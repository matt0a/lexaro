package com.lexaro.api.education.service.impl;

import com.lexaro.api.domain.DocumentPurpose;
import com.lexaro.api.education.ai.AiClientRouter;
import com.lexaro.api.education.ai.AiRequestOptions;
import com.lexaro.api.education.ai.AiResult;
import com.lexaro.api.education.domain.Note;
import com.lexaro.api.education.repo.DocumentTextChunkRepository;
import com.lexaro.api.education.repo.NoteRepository;
import com.lexaro.api.education.repo.dto.GenerateNotesRequest;
import com.lexaro.api.education.repo.dto.NoteDto;
import com.lexaro.api.education.service.DocumentIndexService;
import com.lexaro.api.education.service.EducationGatekeeper;
import com.lexaro.api.education.service.NoteService;
import com.lexaro.api.repo.DocumentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

import static org.springframework.http.HttpStatus.BAD_REQUEST;
import static org.springframework.http.HttpStatus.NOT_FOUND;

/**
 * Implementation of NoteService.
 * Generates study notes using AI based on document content.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class NoteServiceImpl implements NoteService {

    private final NoteRepository noteRepository;
    private final DocumentRepository documentRepository;
    private final DocumentTextChunkRepository chunkRepository;
    private final DocumentIndexService documentIndexService;
    private final AiClientRouter aiClientRouter;
    private final EducationGatekeeper gatekeeper;

    @Override
    @Transactional
    public NoteDto generateNotes(long userId, long docId, GenerateNotesRequest request) {
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
            throw new ResponseStatusException(BAD_REQUEST, "Document has no content to generate notes from");
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

        // Build context from chunks (limit to ~10000 chars for notes)
        StringBuilder context = new StringBuilder();
        int charLimit = 10000;
        for (var chunk : filteredChunks) {
            if (context.length() + chunk.getText().length() > charLimit) break;
            context.append(chunk.getText()).append("\n\n");
        }

        // Get the style
        String style = request.styleOrDefault();

        // Build the prompt based on style
        String prompt = buildNotesPrompt(context.toString(), style);

        // Call AI with gatekeeper
        AiResult result = gatekeeper.guardAiCall(
                "education_notes",
                0, 0,
                () -> aiClientRouter.current().generateText(prompt, AiRequestOptions.builder()
                        .temperature(0.3)
                        .maxOutputTokens(2500)
                        .build())
        );

        String content = result.getText();
        if (content == null || content.isBlank()) {
            throw new ResponseStatusException(BAD_REQUEST, "Failed to generate notes");
        }

        // Create and save the note
        Note note = Note.builder()
                .docId(docId)
                .userId(userId)
                .title(buildTitle(doc.getFilename(), style))
                .style(style)
                .content(content)
                .pageStart(request.pageStart())
                .pageEnd(request.pageEnd())
                .build();

        note = noteRepository.save(note);
        log.info("Generated {} notes for doc {} by user {}", style, docId, userId);

        return toDto(note);
    }

    @Override
    @Transactional(readOnly = true)
    public List<NoteDto> getNotesForDocument(long userId, long docId) {
        // Verify document ownership
        documentRepository.findByIdAndUserIdAndDeletedAtIsNull(docId, userId)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Document not found"));

        return noteRepository.findByDocIdAndUserIdOrderByCreatedAtDesc(docId, userId)
                .stream()
                .map(this::toDto)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public NoteDto getNote(long userId, long noteId) {
        Note note = noteRepository.findByIdAndUserId(noteId, userId)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Note not found"));
        return toDto(note);
    }

    @Override
    @Transactional
    public void deleteNote(long userId, long noteId) {
        Note note = noteRepository.findByIdAndUserId(noteId, userId)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Note not found"));
        noteRepository.delete(note);
        log.info("Deleted note {} by user {}", noteId, userId);
    }

    // --- Helper methods ---

    private String buildNotesPrompt(String content, String style) {
        String styleInstructions = switch (style) {
            case "cornell" -> """
                    Use the Cornell Note-Taking method:
                    1. Start with a clear TITLE
                    2. Create a "MAIN NOTES" section with detailed bullet points
                    3. Create a "CUE COLUMN" section with key questions and terms
                    4. End with a "SUMMARY" section (2-3 sentences)
                    """;
            case "detailed" -> """
                    Create comprehensive, detailed notes:
                    1. Use clear hierarchical headings (##, ###)
                    2. Include all important concepts with explanations
                    3. Add examples where relevant
                    4. Use bullet points and sub-bullets for organization
                    5. End with "Key Takeaways" list
                    """;
            case "summary" -> """
                    Create a concise executive summary:
                    1. Start with a one-paragraph overview
                    2. List 5-7 key points as bullets
                    3. Include any important definitions
                    4. End with "Main Conclusions" section
                    Keep it brief but comprehensive.
                    """;
            default -> // outline
                    """
                    Create clear outline-style notes:
                    1. Use hierarchical bullet points
                    2. Main topics as top-level bullets
                    3. Sub-topics indented underneath
                    4. Keep each point concise
                    5. End with "Key Takeaways" list
                    """;
        };

        return """
                You are an expert note-taker creating study notes.

                CONTENT TO SUMMARIZE:
                %s

                INSTRUCTIONS:
                %s

                Format your response in clean Markdown.

                Notes:
                """.formatted(content, styleInstructions);
    }

    private String buildTitle(String filename, String style) {
        String baseName = filename != null ? filename : "Document";
        // Remove extension if present
        int dotIndex = baseName.lastIndexOf('.');
        if (dotIndex > 0) {
            baseName = baseName.substring(0, dotIndex);
        }

        String styleLabel = switch (style) {
            case "cornell" -> "Cornell Notes";
            case "detailed" -> "Detailed Notes";
            case "summary" -> "Summary";
            default -> "Outline";
        };

        return styleLabel + ": " + baseName;
    }

    private NoteDto toDto(Note note) {
        return NoteDto.builder()
                .id(note.getId())
                .docId(note.getDocId())
                .title(note.getTitle())
                .style(note.getStyle())
                .content(note.getContent())
                .pageStart(note.getPageStart())
                .pageEnd(note.getPageEnd())
                .createdAt(note.getCreatedAt())
                .build();
    }
}
