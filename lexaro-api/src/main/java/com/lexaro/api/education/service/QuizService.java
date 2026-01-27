package com.lexaro.api.education.service;

import com.lexaro.api.education.repo.dto.GenerateQuizRequest;
import com.lexaro.api.education.repo.dto.QuizDto;
import com.lexaro.api.education.repo.dto.QuizGradeRequest;
import com.lexaro.api.education.repo.dto.QuizGradeResponse;

import java.util.List;

/**
 * Service for quiz generation, retrieval, and grading.
 */
public interface QuizService {

    /**
     * Generate a new quiz from document content using AI.
     *
     * @param userId    the user requesting the quiz
     * @param docId     the document to generate quiz from
     * @param request   generation parameters (question count, difficulty, etc.)
     * @return the generated quiz
     */
    QuizDto generateQuiz(long userId, long docId, GenerateQuizRequest request);

    /**
     * Get all quizzes for a document.
     *
     * @param userId the user ID (for ownership check)
     * @param docId  the document ID
     * @return list of quizzes
     */
    List<QuizDto> getQuizzesForDocument(long userId, long docId);

    /**
     * Get a specific quiz by ID.
     *
     * @param userId the user ID (for ownership check)
     * @param quizId the quiz ID
     * @return the quiz
     */
    QuizDto getQuiz(long userId, long quizId);

    /**
     * Grade a quiz attempt and record the results.
     *
     * @param userId  the user ID
     * @param quizId  the quiz ID
     * @param request the user's answers
     * @return grading results with score and explanations
     */
    QuizGradeResponse gradeQuiz(long userId, long quizId, QuizGradeRequest request);

    /**
     * Delete a quiz.
     *
     * @param userId the user ID (for ownership check)
     * @param quizId the quiz ID
     */
    void deleteQuiz(long userId, long quizId);
}
