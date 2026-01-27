package com.lexaro.api.education.web;

import com.lexaro.api.education.repo.dto.*;
import com.lexaro.api.education.service.QuizService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST controller for quiz operations.
 * Handles quiz generation, retrieval, grading, and deletion.
 */
@RestController
@RequestMapping("/education")
@RequiredArgsConstructor
public class QuizController {

    private final QuizService quizService;

    private long userId() {
        return (Long) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
    }

    /**
     * Generate a new quiz from document content.
     */
    @PostMapping("/documents/{docId}/quizzes/generate")
    public QuizDto generateQuiz(
            @PathVariable Long docId,
            @RequestBody(required = false) GenerateQuizRequest request
    ) {
        if (request == null) {
            request = new GenerateQuizRequest(null, null, null, null);
        }
        return quizService.generateQuiz(userId(), docId, request);
    }

    /**
     * Get all quizzes for a document.
     */
    @GetMapping("/documents/{docId}/quizzes")
    public List<QuizDto> getQuizzesForDocument(@PathVariable Long docId) {
        return quizService.getQuizzesForDocument(userId(), docId);
    }

    /**
     * Get a specific quiz.
     */
    @GetMapping("/quizzes/{quizId}")
    public QuizDto getQuiz(@PathVariable Long quizId) {
        return quizService.getQuiz(userId(), quizId);
    }

    /**
     * Grade a quiz attempt.
     */
    @PostMapping("/quizzes/{quizId}/grade")
    public QuizGradeResponse gradeQuiz(
            @PathVariable Long quizId,
            @RequestBody QuizGradeRequest request
    ) {
        return quizService.gradeQuiz(userId(), quizId, request);
    }

    /**
     * Delete a quiz.
     */
    @DeleteMapping("/quizzes/{quizId}")
    public void deleteQuiz(@PathVariable Long quizId) {
        quizService.deleteQuiz(userId(), quizId);
    }
}
