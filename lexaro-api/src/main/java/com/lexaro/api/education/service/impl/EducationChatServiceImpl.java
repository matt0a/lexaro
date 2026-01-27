package com.lexaro.api.education.service.impl;

import com.lexaro.api.domain.DocumentPurpose;
import com.lexaro.api.education.ai.AiClientRouter;
import com.lexaro.api.education.ai.AiRequestOptions;
import com.lexaro.api.education.ai.AiResult;
import com.lexaro.api.education.config.EducationProperties;
import com.lexaro.api.education.domain.DocumentTextChunk;
import com.lexaro.api.education.repo.DocumentTextChunkRepository;
import com.lexaro.api.education.repo.dto.*;
import com.lexaro.api.education.service.*;
import com.lexaro.api.repo.DocumentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.*;

import static org.springframework.http.HttpStatus.NOT_FOUND;

@Service
@RequiredArgsConstructor
public class EducationChatServiceImpl implements EducationChatService {

    private final AiClientRouter aiClientRouter;
    private final EducationGatekeeper gatekeeper;
    private final EducationProperties educationProperties;

    private final DocumentRepository documents;
    private final DocumentIndexService documentIndexService;
    private final DocumentTextChunkRepository chunks;
    private final ChunkSearchService chunkSearchService;

    @Override
    @Transactional
    public EducationChatResponse chat(long userId, EducationChatRequest request) {
        final String message = request != null ? safe(request.message()) : "";
        final Long docId = request != null ? request.docId() : null;

        if (docId != null) {
            var doc = documents.findByIdAndUserIdAndDeletedAtIsNull(docId, userId)
                    .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Document not found"));

            if (doc.getPurpose() != null
                    && doc.getPurpose() != DocumentPurpose.EDUCATION
                    && doc.getPurpose() != DocumentPurpose.BOTH) {
                throw new ResponseStatusException(NOT_FOUND, "Document not found");
            }

            if (!chunks.existsByDocId(docId)) {
                try {
                    documentIndexService.indexDocument(docId);
                } catch (Exception ignore) {}
            }
        }

        int k = educationProperties.getRetrieval().getMaxChunks();
        if (k <= 0) k = 5;

        List<EducationChatSourceDto> sources = List.of();
        String contextBlock = "";

        if (docId != null && !message.isBlank()) {
            ChunkSearchResponse sr = chunkSearchService.search(docId, message, null, null, k);
            List<ChunkSearchItem> items = sr != null && sr.getResults() != null ? sr.getResults() : List.of();

            if (!items.isEmpty()) {
                Map<Long, DocumentTextChunk> chunkMap = new HashMap<>();
                var ids = items.stream().map(ChunkSearchItem::getChunkId).filter(Objects::nonNull).toList();
                for (var c : chunks.findAllById(ids)) chunkMap.put(c.getId(), c);

                int maxChars = educationProperties.getRetrieval().getMaxCharsPerChunk();
                if (maxChars <= 0) maxChars = 2500;

                StringBuilder ctx = new StringBuilder();
                ctx.append("CONTEXT FROM THE DOCUMENT:\n");

                int i = 0;
                for (var it : items) {
                    i++;
                    var chunk = chunkMap.get(it.getChunkId());
                    String text = chunk != null ? safe(chunk.getText()) : "";
                    if (text.length() > maxChars) text = text.substring(0, maxChars);

                    ctx.append("\n[Source ").append(i).append("] pages ")
                            .append(it.getPageStart()).append("-").append(it.getPageEnd())
                            .append("\n")
                            .append(text)
                            .append("\n");
                }

                contextBlock = ctx.toString();

                sources = items.stream().map(it -> {
                    var chunk = chunkMap.get(it.getChunkId());
                    int chunkIndex = chunk != null && chunk.getChunkIndex() != null ? chunk.getChunkIndex() : 0;

                    return new EducationChatSourceDto(
                            it.getChunkId(),
                            it.getPageStart(),
                            it.getPageEnd(),
                            it.getScore(),
                            it.getSnippet(),
                            chunkIndex
                    );
                }).toList();
            }
        }

        String prompt = buildPrompt(request, contextBlock);

        AiResult res = gatekeeper.guardAiCall(
                "education_chat",
                0,
                0,
                () -> aiClientRouter.current().generateText(prompt, AiRequestOptions.builder()
                        .temperature(0.2)
                        .maxOutputTokens(900)
                        .build())
        );

        return new EducationChatResponse(res != null ? safe(res.getText()) : "", docId, sources);
    }

    private String buildPrompt(EducationChatRequest req, String contextBlock) {
        StringBuilder sb = new StringBuilder();

        sb.append("You are Lexaro, an expert study coach.\n");
        sb.append("Be helpful and accurate. If you use document context, reference page ranges like (p. 3–4).\n");
        sb.append("If context is insufficient, say so.\n");

        if (contextBlock != null && !contextBlock.isBlank()) {
            sb.append("\n").append(contextBlock).append("\n");
        }

        if (req != null && req.history() != null && !req.history().isEmpty()) {
            sb.append("\nCONVERSATION HISTORY:\n");
            List<EducationChatMessageDto> hist = req.history();
            int start = Math.max(0, hist.size() - 12);

            for (int i = start; i < hist.size(); i++) {
                var m = hist.get(i);
                String role = (m.role() == null ? "USER" : m.role().trim().toUpperCase(Locale.ROOT));
                String content = safe(m.content());
                if (content.isBlank()) continue;

                sb.append("ASSISTANT".equals(role) ? "Assistant: " : "User: ")
                        .append(content).append("\n");
            }
        }

        sb.append("\nUSER QUESTION:\n")
                .append(req != null ? safe(req.message()) : "")
                .append("\n\nAnswer:\n");

        return sb.toString();
    }

    private static String safe(String s) {
        return s == null ? "" : s.trim();
    }
}
