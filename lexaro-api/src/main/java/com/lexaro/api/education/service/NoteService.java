package com.lexaro.api.education.service;

import com.lexaro.api.education.repo.dto.GenerateNotesRequest;
import com.lexaro.api.education.repo.dto.NoteDto;

import java.util.List;

/**
 * Service for note generation and management.
 */
public interface NoteService {

    /**
     * Generate notes from document content using AI.
     *
     * @param userId  the user requesting the notes
     * @param docId   the document to generate notes from
     * @param request generation parameters (style, page range)
     * @return the generated notes
     */
    NoteDto generateNotes(long userId, long docId, GenerateNotesRequest request);

    /**
     * Get all notes for a document.
     *
     * @param userId the user ID (for ownership check)
     * @param docId  the document ID
     * @return list of notes
     */
    List<NoteDto> getNotesForDocument(long userId, long docId);

    /**
     * Get a specific note by ID.
     *
     * @param userId the user ID (for ownership check)
     * @param noteId the note ID
     * @return the note
     */
    NoteDto getNote(long userId, long noteId);

    /**
     * Delete a note.
     *
     * @param userId the user ID (for ownership check)
     * @param noteId the note ID
     */
    void deleteNote(long userId, long noteId);
}
