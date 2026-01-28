package com.lexaro.api.education.service.impl;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.lexaro.api.education.ai.AiClientRouter;
import com.lexaro.api.education.ai.AiRequestOptions;
import com.lexaro.api.education.ai.AiResult;
import com.lexaro.api.education.repo.dto.EssayGradeRequest;
import com.lexaro.api.education.repo.dto.EssayGradeResponse;
import com.lexaro.api.education.service.EssayGraderService;
import com.lexaro.api.education.service.EducationGatekeeper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.*;

import static org.springframework.http.HttpStatus.BAD_REQUEST;
import static org.springframework.http.HttpStatus.INTERNAL_SERVER_ERROR;

/**
 * Implementation of EssayGraderService.
 * Uses AI to grade essays based on a comprehensive rubric.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class EssayGraderServiceImpl implements EssayGraderService {

    private final AiClientRouter aiClientRouter;
    private final EducationGatekeeper gatekeeper;
    private final ObjectMapper objectMapper;

    @Override
    public EssayGradeResponse gradeEssay(long userId, EssayGradeRequest request) {
        // Validate input
        if (request.essay() == null || request.essay().isBlank()) {
            throw new ResponseStatusException(BAD_REQUEST, "Essay text is required");
        }

        String essay = request.essay().trim();
        if (essay.length() < 50) {
            throw new ResponseStatusException(BAD_REQUEST, "Essay is too short. Please provide at least 50 characters.");
        }

        if (essay.length() > 50000) {
            throw new ResponseStatusException(BAD_REQUEST, "Essay is too long. Maximum 50,000 characters allowed.");
        }

        // Build the prompt
        String prompt = buildGradingPrompt(essay, request.topicOrDefault());

        // Call AI with gatekeeper
        AiResult result = gatekeeper.guardAiCall(
                "education_essay",
                0, 0,
                () -> aiClientRouter.current().generateText(prompt, AiRequestOptions.builder()
                        .temperature(0.3)
                        .maxOutputTokens(2000)
                        .build())
        );

        // Parse the response
        EssayGradeResponse response = parseGradingResponse(result.getText());
        if (response == null) {
            throw new ResponseStatusException(INTERNAL_SERVER_ERROR, "Failed to grade essay");
        }

        log.info("Graded essay for user {}: overall score {}", userId, response.overallScore());
        return response;
    }

    private String buildGradingPrompt(String essay, String topic) {
        return """
                You are an expert essay grader and writing coach. Evaluate the essay below using a comprehensive rubric.

                ESSAY PROMPT/TOPIC (if provided):
                %s

                ESSAY TO GRADE:
                %s

                Evaluate the essay on the following criteria (score each 1-10):

                1. **Thesis & Argument**: Is there a clear thesis? Is the argument well-developed and persuasive?
                2. **Organization & Structure**: Is the essay well-organized with clear introduction, body paragraphs, and conclusion?
                3. **Evidence & Support**: Are claims supported with relevant evidence, examples, or citations?
                4. **Analysis & Critical Thinking**: Does the essay demonstrate deep analysis rather than surface-level description?
                5. **Clarity & Style**: Is the writing clear, concise, and engaging? Is the tone appropriate?
                6. **Grammar & Mechanics**: Is the essay free of grammatical errors, typos, and punctuation issues?

                Return JSON ONLY with this exact format:
                {
                  "overallScore": 85,
                  "scores": {
                    "thesis": 8,
                    "organization": 9,
                    "evidence": 7,
                    "analysis": 8,
                    "clarity": 9,
                    "grammar": 8
                  },
                  "strengths": [
                    "Clear and compelling thesis statement",
                    "Well-organized paragraph structure"
                  ],
                  "improvements": [
                    "Add more specific evidence to support claims",
                    "Consider varying sentence structure"
                  ],
                  "detailedFeedback": "Your essay presents a strong argument...",
                  "rewriteSuggestion": "Consider revising your introduction to..."
                }

                JSON Response:
                """.formatted(topic, essay);
    }

    private EssayGradeResponse parseGradingResponse(String response) {
        try {
            // Extract JSON from response (handle markdown code blocks)
            String json = response.trim();
            if (json.startsWith("```")) {
                int start = json.indexOf("{");
                int end = json.lastIndexOf("}");
                if (start >= 0 && end > start) {
                    json = json.substring(start, end + 1);
                }
            }

            JsonNode root = objectMapper.readTree(json);

            // Parse overall score
            int overallScore = root.has("overallScore") ? root.get("overallScore").asInt() : 0;

            // Parse individual scores
            Map<String, Integer> scores = new LinkedHashMap<>();
            if (root.has("scores") && root.get("scores").isObject()) {
                JsonNode scoresNode = root.get("scores");
                Iterator<Map.Entry<String, JsonNode>> fields = scoresNode.fields();
                while (fields.hasNext()) {
                    Map.Entry<String, JsonNode> field = fields.next();
                    scores.put(field.getKey(), field.getValue().asInt());
                }
            }

            // Parse strengths
            List<String> strengths = new ArrayList<>();
            if (root.has("strengths") && root.get("strengths").isArray()) {
                for (JsonNode s : root.get("strengths")) {
                    strengths.add(s.asText());
                }
            }

            // Parse improvements
            List<String> improvements = new ArrayList<>();
            if (root.has("improvements") && root.get("improvements").isArray()) {
                for (JsonNode i : root.get("improvements")) {
                    improvements.add(i.asText());
                }
            }

            // Parse feedback
            String detailedFeedback = root.has("detailedFeedback") ? root.get("detailedFeedback").asText() : "";
            String rewriteSuggestion = root.has("rewriteSuggestion") ? root.get("rewriteSuggestion").asText() : "";

            return EssayGradeResponse.builder()
                    .overallScore(overallScore)
                    .scores(scores)
                    .strengths(strengths)
                    .improvements(improvements)
                    .detailedFeedback(detailedFeedback)
                    .rewriteSuggestion(rewriteSuggestion)
                    .build();

        } catch (Exception e) {
            log.error("Failed to parse essay grading response: {}", e.getMessage());
            log.debug("Raw response: {}", response);
            return null;
        }
    }
}
