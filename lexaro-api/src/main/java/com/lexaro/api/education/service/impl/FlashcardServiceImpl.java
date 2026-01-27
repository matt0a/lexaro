package com.lexaro.api.education.service.impl;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.lexaro.api.domain.DocumentPurpose;
import com.lexaro.api.education.ai.AiClientRouter;
import com.lexaro.api.education.ai.AiRequestOptions;
import com.lexaro.api.education.ai.AiResult;
import com.lexaro.api.education.domain.Flashcard;
import com.lexaro.api.education.domain.FlashcardDeck;
import com.lexaro.api.education.repo.DocumentTextChunkRepository;
import com.lexaro.api.education.repo.FlashcardDeckRepository;
import com.lexaro.api.education.repo.dto.*;
import com.lexaro.api.education.service.*;
import com.lexaro.api.repo.DocumentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

import static org.springframework.http.HttpStatus.*;

/**
 * Implementation of FlashcardService.
 * Generates flashcard decks using AI based on document content.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class FlashcardServiceImpl implements FlashcardService {

    private final FlashcardDeckRepository deckRepository;
    private final DocumentRepository documentRepository;
    private final DocumentTextChunkRepository chunkRepository;
    private final DocumentIndexService documentIndexService;
    private final AiClientRouter aiClientRouter;
    private final EducationGatekeeper gatekeeper;
    private final ObjectMapper objectMapper;

    @Override
    @Transactional
    public FlashcardDeckDto generateFlashcards(long userId, long docId, GenerateFlashcardsRequest request) {
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
            throw new ResponseStatusException(BAD_REQUEST, "Document has no content to generate flashcards from");
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
        int cardCount = request.cardCountOrDefault();
        String prompt = buildFlashcardPrompt(context.toString(), cardCount);

        // Call AI with gatekeeper
        AiResult result = gatekeeper.guardAiCall(
                "education_flashcards",
                0, 0,
                () -> aiClientRouter.current().generateText(prompt, AiRequestOptions.builder()
                        .temperature(0.3)
                        .maxOutputTokens(2000)
                        .build())
        );

        // Parse the AI response
        List<ParsedCard> parsedCards = parseFlashcardResponse(result.getText());
        if (parsedCards.isEmpty()) {
            throw new ResponseStatusException(INTERNAL_SERVER_ERROR, "Failed to generate flashcards");
        }

        // Create and save the deck
        FlashcardDeck deck = FlashcardDeck.builder()
                .docId(docId)
                .userId(userId)
                .title("Flashcards: " + (doc.getFilename() != null ? doc.getFilename() : "Document #" + docId))
                .build();

        int index = 0;
        for (ParsedCard pc : parsedCards) {
            Flashcard card = Flashcard.builder()
                    .cardIndex(index++)
                    .front(pc.front)
                    .back(pc.back)
                    .build();
            deck.addCard(card);
        }

        deck = deckRepository.save(deck);
        log.info("Generated flashcard deck {} with {} cards for doc {} by user {}",
                deck.getId(), deck.getCardCount(), docId, userId);

        return toDto(deck);
    }

    @Override
    @Transactional(readOnly = true)
    public List<FlashcardDeckDto> getDecksForDocument(long userId, long docId) {
        // Verify document ownership
        documentRepository.findByIdAndUserIdAndDeletedAtIsNull(docId, userId)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Document not found"));

        return deckRepository.findByDocIdAndUserIdOrderByCreatedAtDesc(docId, userId)
                .stream()
                .map(this::toDto)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public FlashcardDeckDto getDeck(long userId, long deckId) {
        FlashcardDeck deck = deckRepository.findByIdAndUserId(deckId, userId)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Flashcard deck not found"));
        return toDto(deck);
    }

    @Override
    @Transactional
    public void deleteDeck(long userId, long deckId) {
        FlashcardDeck deck = deckRepository.findByIdAndUserId(deckId, userId)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Flashcard deck not found"));
        deckRepository.delete(deck);
        log.info("Deleted flashcard deck {} by user {}", deckId, userId);
    }

    // --- Helper methods ---

    private String buildFlashcardPrompt(String content, int cardCount) {
        return """
                You are an expert educator creating flashcards for effective studying.

                CONTENT TO CREATE FLASHCARDS FROM:
                %s

                INSTRUCTIONS:
                - Create exactly %d flashcards
                - Each flashcard should have a clear question/term on the front
                - Each flashcard should have a concise, accurate answer on the back
                - Focus on key concepts, definitions, and important facts
                - Make cards that test understanding, not just memorization
                - Keep both sides concise but complete

                Return JSON ONLY with this exact format:
                {
                  "cards": [
                    {
                      "front": "Question or term to test",
                      "back": "Answer or definition"
                    }
                  ]
                }

                JSON Response:
                """.formatted(content, cardCount);
    }

    private record ParsedCard(String front, String back) {}

    private List<ParsedCard> parseFlashcardResponse(String response) {
        List<ParsedCard> cards = new ArrayList<>();

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
            JsonNode cardsNode = root.get("cards");

            if (cardsNode != null && cardsNode.isArray()) {
                for (JsonNode cardNode : cardsNode) {
                    String front = cardNode.has("front") ? cardNode.get("front").asText() : "";
                    String back = cardNode.has("back") ? cardNode.get("back").asText() : "";

                    if (!front.isBlank() && !back.isBlank()) {
                        cards.add(new ParsedCard(front, back));
                    }
                }
            }
        } catch (Exception e) {
            log.error("Failed to parse flashcard response: {}", e.getMessage());
            log.debug("Raw response: {}", response);
        }

        return cards;
    }

    private FlashcardDeckDto toDto(FlashcardDeck deck) {
        List<FlashcardDto> cards = deck.getCards().stream()
                .map(c -> FlashcardDto.builder()
                        .id(c.getId())
                        .cardIndex(c.getCardIndex())
                        .front(c.getFront())
                        .back(c.getBack())
                        .build())
                .collect(Collectors.toList());

        return FlashcardDeckDto.builder()
                .id(deck.getId())
                .docId(deck.getDocId())
                .title(deck.getTitle())
                .cardCount(deck.getCardCount())
                .cards(cards)
                .createdAt(deck.getCreatedAt())
                .build();
    }
}
