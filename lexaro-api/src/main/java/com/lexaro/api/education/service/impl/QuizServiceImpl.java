package com.lexaro.api.education.service.impl;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.lexaro.api.domain.DocumentPurpose;
import com.lexaro.api.education.ai.AiClientRouter;
import com.lexaro.api.education.ai.AiRequestOptions;
import com.lexaro.api.education.ai.AiResult;
import com.lexaro.api.education.domain.Quiz;
import com.lexaro.api.education.domain.QuizQuestion;
import com.lexaro.api.education.repo.DocumentTextChunkRepository;
import com.lexaro.api.education.repo.QuizRepository;
import com.lexaro.api.education.repo.dto.*;
import com.lexaro.api.education.service.*;
import com.lexaro.api.repo.DocumentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.*;
import java.util.stream.Collectors;

import static org.springframework.http.HttpStatus.*;

/**
 * Implementation of QuizService.
 * Generates quizzes using AI based on document content.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class QuizServiceImpl implements QuizService {

    private final QuizRepository quizRepository;
    private final DocumentRepository documentRepository;
    private final DocumentTextChunkRepository chunkRepository;
    private final DocumentIndexService documentIndexService;
    private final AiClientRouter aiClientRouter;
    private final EducationGatekeeper gatekeeper;
    private final EducationProgressService progressService;
    private final ObjectMapper objectMapper;

    @Override
    @Transactional
    public QuizDto generateQuiz(long userId, long docId, GenerateQuizRequest request) {
        // Verify document ownership and purpose
        var doc = documentRepository.findByIdAndUserIdAndDeletedAtIsNull(docId, userId)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Document not found"));

        if (doc.getPurpose() != null
                && doc.getPurpose() != DocumentPurpose.EDUCATION
                && doc.getPurpose() != DocumentPurpose.BOTH) {
            throw new ResponseStatusException(BAD_REQUEST, "Document not set up for education");
        }

        // Ensure document is indexed
        if (!chunkRepository.existsByDocId(docId)) {
            try {
                documentIndexService.indexDocument(docId, userId);
            } catch (Exception e) {
                throw new ResponseStatusException(BAD_REQUEST, "Failed to index document: " + e.getMessage());
            }
        }

        // Get document chunks for context
        var chunks = chunkRepository.findByDocIdOrderByChunkIndexAsc(docId);
        if (chunks.isEmpty()) {
            throw new ResponseStatusException(BAD_REQUEST, "Document has no content to generate quiz from");
        }

        // Filter by page range if specified
        var filteredChunks = chunks;
        if (request.pageStart() != null || request.pageEnd() != null) {
            int start = request.pageStart() != null ? request.pageStart() : 1;
            int end = request.pageEnd() != null ? request.pageEnd() : Integer.MAX_VALUE;
            filteredChunks = chunks.stream()
                    .filter(c -> c.getPageEnd() >= start && c.getPageStart() <= end)
                    .toList();
        }

        if (filteredChunks.isEmpty()) {
            throw new ResponseStatusException(BAD_REQUEST, "No content in specified page range");
        }

        // Build context from chunks (limit to ~8000 chars for prompt)
        StringBuilder context = new StringBuilder();
        int charLimit = 8000;
        for (var chunk : filteredChunks) {
            if (context.length() + chunk.getText().length() > charLimit) break;
            context.append(chunk.getText()).append("\n\n");
        }

        // Build the prompt
        int questionCount = request.questionCountOrDefault();
        String difficulty = request.difficultyOrDefault();
        String prompt = buildQuizPrompt(context.toString(), questionCount, difficulty);

        // Call AI with gatekeeper
        AiResult result = gatekeeper.guardAiCall(
                "education_quiz",
                0, 0,
                () -> aiClientRouter.current().generateText(prompt, AiRequestOptions.builder()
                        .temperature(0.3)
                        .maxOutputTokens(2000)
                        .build())
        );

        // Parse the AI response
        List<ParsedQuestion> parsedQuestions = parseQuizResponse(result.getText());
        if (parsedQuestions.isEmpty()) {
            throw new ResponseStatusException(INTERNAL_SERVER_ERROR, "Failed to generate quiz questions");
        }

        // Create and save the quiz
        Quiz quiz = Quiz.builder()
                .docId(docId)
                .userId(userId)
                .title("Quiz: " + (doc.getFilename() != null ? doc.getFilename() : "Document #" + docId))
                .build();

        int index = 0;
        for (ParsedQuestion pq : parsedQuestions) {
            QuizQuestion question = QuizQuestion.builder()
                    .questionIndex(index++)
                    .questionType("mcq")
                    .prompt(pq.prompt)
                    .choices(toJson(pq.choices))
                    .answerIndex(pq.answerIndex)
                    .explanation(pq.explanation)
                    .build();
            quiz.addQuestion(question);
        }

        quiz = quizRepository.save(quiz);
        log.info("Generated quiz {} with {} questions for doc {} by user {}",
                quiz.getId(), quiz.getQuestionCount(), docId, userId);

        return toDto(quiz, false);  // Don't include answers when returning newly generated quiz
    }

    @Override
    @Transactional(readOnly = true)
    public List<QuizDto> getQuizzesForDocument(long userId, long docId) {
        // Verify document ownership
        documentRepository.findByIdAndUserIdAndDeletedAtIsNull(docId, userId)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Document not found"));

        return quizRepository.findByDocIdAndUserIdOrderByCreatedAtDesc(docId, userId)
                .stream()
                .map(q -> toDto(q, false))
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public QuizDto getQuiz(long userId, long quizId) {
        Quiz quiz = quizRepository.findByIdAndUserId(quizId, userId)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Quiz not found"));
        return toDto(quiz, false);  // Don't include answers
    }

    @Override
    @Transactional
    public QuizGradeResponse gradeQuiz(long userId, long quizId, QuizGradeRequest request) {
        Quiz quiz = quizRepository.findByIdAndUserId(quizId, userId)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Quiz not found"));

        Map<Long, Integer> answers = request.answers() != null ? request.answers() : Map.of();

        List<QuizGradeResponse.QuestionResult> results = new ArrayList<>();
        int correct = 0;
        List<String> weakTopics = new ArrayList<>();

        for (QuizQuestion q : quiz.getQuestions()) {
            Integer userAnswer = answers.get(q.getId());
            boolean isCorrect = userAnswer != null && userAnswer.equals(q.getAnswerIndex());

            if (isCorrect) {
                correct++;
            } else {
                // Extract weak topic from question prompt (first few words)
                String topic = extractTopic(q.getPrompt());
                if (topic != null && !weakTopics.contains(topic)) {
                    weakTopics.add(topic);
                }
            }

            List<String> choices = parseChoices(q.getChoices());

            results.add(QuizGradeResponse.QuestionResult.builder()
                    .questionId(q.getId())
                    .questionIndex(q.getQuestionIndex())
                    .prompt(q.getPrompt())
                    .choices(choices)
                    .correctAnswerIndex(q.getAnswerIndex() != null ? q.getAnswerIndex() : 0)
                    .userAnswerIndex(userAnswer)
                    .correct(isCorrect)
                    .explanation(q.getExplanation())
                    .build());
        }

        int total = quiz.getQuestions().size();
        double scorePercent = total > 0 ? (correct * 100.0 / total) : 0;

        // Record attempt in progress service (non-blocking)
        try {
            EducationAttemptCreateRequest attemptReq = new EducationAttemptCreateRequest();
            attemptReq.setDocId(quiz.getDocId());
            attemptReq.setAttemptType("QUIZ");
            attemptReq.setMode("practice");
            attemptReq.setScore(correct);
            attemptReq.setMaxScore(total);
            attemptReq.setPercent(scorePercent);
            attemptReq.setWeakTopics(weakTopics);
            progressService.recordAttempt(attemptReq);
        } catch (Exception e) {
            log.warn("Failed to record quiz attempt: {}", e.getMessage());
        }

        log.info("Graded quiz {} for user {}: {}/{} correct ({}%)",
                quizId, userId, correct, total, String.format("%.1f", scorePercent));

        return QuizGradeResponse.builder()
                .quizId(quizId)
                .totalQuestions(total)
                .correctCount(correct)
                .incorrectCount(total - correct)
                .scorePercent(scorePercent)
                .results(results)
                .weakTopics(weakTopics)
                .build();
    }

    @Override
    @Transactional
    public void deleteQuiz(long userId, long quizId) {
        Quiz quiz = quizRepository.findByIdAndUserId(quizId, userId)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Quiz not found"));
        quizRepository.delete(quiz);
        log.info("Deleted quiz {} by user {}", quizId, userId);
    }

    // --- Helper methods ---

    private String buildQuizPrompt(String content, int questionCount, String difficulty) {
        return """
                You are an expert educator creating a quiz to test understanding.

                CONTENT TO TEST:
                %s

                INSTRUCTIONS:
                - Create exactly %d multiple-choice questions
                - Difficulty level: %s
                - Each question should test understanding, not just memorization
                - Provide 4 answer choices (A, B, C, D)
                - Include a brief explanation for the correct answer

                Return JSON ONLY with this exact format:
                {
                  "questions": [
                    {
                      "prompt": "The question text here?",
                      "choices": ["First choice", "Second choice", "Third choice", "Fourth choice"],
                      "answerIndex": 0,
                      "explanation": "Brief explanation of why this is correct."
                    }
                  ]
                }

                JSON Response:
                """.formatted(content, questionCount, difficulty);
    }

    private record ParsedQuestion(String prompt, List<String> choices, int answerIndex, String explanation) {}

    private List<ParsedQuestion> parseQuizResponse(String response) {
        List<ParsedQuestion> questions = new ArrayList<>();

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
            JsonNode questionsNode = root.get("questions");

            if (questionsNode != null && questionsNode.isArray()) {
                for (JsonNode qNode : questionsNode) {
                    String prompt = qNode.has("prompt") ? qNode.get("prompt").asText() : "";
                    int answerIndex = qNode.has("answerIndex") ? qNode.get("answerIndex").asInt() : 0;
                    String explanation = qNode.has("explanation") ? qNode.get("explanation").asText() : "";

                    List<String> choices = new ArrayList<>();
                    if (qNode.has("choices") && qNode.get("choices").isArray()) {
                        for (JsonNode c : qNode.get("choices")) {
                            choices.add(c.asText());
                        }
                    }

                    if (!prompt.isBlank() && !choices.isEmpty()) {
                        questions.add(new ParsedQuestion(prompt, choices, answerIndex, explanation));
                    }
                }
            }
        } catch (Exception e) {
            log.error("Failed to parse quiz response: {}", e.getMessage());
            log.debug("Raw response: {}", response);
        }

        return questions;
    }

    private String toJson(List<String> choices) {
        try {
            return objectMapper.writeValueAsString(choices);
        } catch (Exception e) {
            return "[]";
        }
    }

    private List<String> parseChoices(String json) {
        if (json == null || json.isBlank()) return List.of();
        try {
            return objectMapper.readValue(json, new TypeReference<List<String>>() {});
        } catch (Exception e) {
            return List.of();
        }
    }

    private String extractTopic(String prompt) {
        if (prompt == null || prompt.isBlank()) return null;
        // Take first ~50 chars as topic indicator
        String clean = prompt.replaceAll("^(What|Which|How|Why|When|Where|Who)\\s+", "");
        if (clean.length() > 50) {
            clean = clean.substring(0, 50);
            int lastSpace = clean.lastIndexOf(' ');
            if (lastSpace > 20) clean = clean.substring(0, lastSpace);
        }
        return clean.trim();
    }

    private QuizDto toDto(Quiz quiz, boolean includeAnswers) {
        List<QuizQuestionDto> questions = quiz.getQuestions().stream()
                .map(q -> QuizQuestionDto.builder()
                        .id(q.getId())
                        .questionIndex(q.getQuestionIndex())
                        .questionType(q.getQuestionType())
                        .prompt(q.getPrompt())
                        .choices(parseChoices(q.getChoices()))
                        .answerIndex(includeAnswers ? q.getAnswerIndex() : null)
                        .explanation(includeAnswers ? q.getExplanation() : null)
                        .build())
                .collect(Collectors.toList());

        return QuizDto.builder()
                .id(quiz.getId())
                .docId(quiz.getDocId())
                .title(quiz.getTitle())
                .questionCount(quiz.getQuestionCount())
                .questions(questions)
                .createdAt(quiz.getCreatedAt())
                .build();
    }
}
