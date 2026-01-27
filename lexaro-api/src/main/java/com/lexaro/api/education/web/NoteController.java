package com.lexaro.api.education.web;

import com.lexaro.api.education.repo.dto.GenerateNotesRequest;
import com.lexaro.api.education.repo.dto.NoteDto;
import com.lexaro.api.education.service.NoteService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST controller for notes operations.
 * Handles AI-powered note generation and management.
 */
@RestController
@RequestMapping("/education")
@RequiredArgsConstructor
public class NoteController {

    private final NoteService noteService;

    /**
     * Get the current user's ID from the security context.
     */
    private long userId() {
        return (Long) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
    }

    /**
     * Generate new notes from document content.
     * Supports styles: outline, cornell, detailed, summary
     *
     * @param docId   the document ID
     * @param request generation parameters (style, page range)
     * @return the generated notes
     */
    @PostMapping("/documents/{docId}/notes/generate")
    public NoteDto generateNotes(
            @PathVariable Long docId,
            @RequestBody(required = false) GenerateNotesRequest request
    ) {
        if (request == null) {
            request = new GenerateNotesRequest(null, null, null);
        }
        return noteService.generateNotes(userId(), docId, request);
    }

    /**
     * Get all notes for a document.
     *
     * @param docId the document ID
     * @return list of notes
     */
    @GetMapping("/documents/{docId}/notes")
    public List<NoteDto> getNotesForDocument(@PathVariable Long docId) {
        return noteService.getNotesForDocument(userId(), docId);
    }

    /**
     * Get a specific note by ID.
     *
     * @param noteId the note ID
     * @return the note
     */
    @GetMapping("/notes/{noteId}")
    public NoteDto getNote(@PathVariable Long noteId) {
        return noteService.getNote(userId(), noteId);
    }

    /**
     * Delete a note.
     *
     * @param noteId the note ID
     */
    @DeleteMapping("/notes/{noteId}")
    public void deleteNote(@PathVariable Long noteId) {
        noteService.deleteNote(userId(), noteId);
    }
}
