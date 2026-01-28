import api from '@/lib/api';

/** =========================
 *  Onboarding API
 *  ========================= */

/**
 * Onboarding status response.
 */
export type OnboardingStatus = {
    completed: boolean;
};

/**
 * Get user's onboarding completion status.
 */
export async function getOnboardingStatus(): Promise<OnboardingStatus> {
    const { data } = await api.get<OnboardingStatus>('/me/onboarding');
    return data;
}

/**
 * Mark onboarding as completed.
 */
export async function completeOnboarding(): Promise<OnboardingStatus> {
    const { data } = await api.post<OnboardingStatus>('/me/onboarding/complete');
    return data;
}

/**
 * Reset onboarding status (for testing).
 */
export async function resetOnboarding(): Promise<OnboardingStatus> {
    const { data } = await api.post<OnboardingStatus>('/me/onboarding/reset');
    return data;
}

export type IndexDocumentResponse = {
    docId: number;
    pageCount: number;
    chunkCount: number;
    chunkChars: number;
    overlapChars: number;
};

export type ChunkSearchItem = {
    chunkId: number;
    pageStart?: number | null;
    pageEnd?: number | null;
    startChar?: number | null;
    endChar?: number | null;
    score: number;
    snippet: string;
};

export type ChunkSearchResponse = {
    docId: number;
    query: string;
    pageStart?: number | null;
    pageEnd?: number | null;
    results: ChunkSearchItem[];
};

export async function indexEducationDocument(docId: number) {
    const { data } = await api.post<IndexDocumentResponse>(`/education/documents/${docId}/index`);
    return data;
}

export async function searchEducationChunks(
    docId: number,
    q: string,
    opts?: { pageStart?: number; pageEnd?: number; limit?: number }
) {
    const { data } = await api.get<ChunkSearchResponse>(`/education/documents/${docId}/chunks/search`, {
        params: {
            q,
            pageStart: opts?.pageStart,
            pageEnd: opts?.pageEnd,
            limit: opts?.limit ?? 6,
        },
    });
    return data;
}

/** =========================
 *  AI Chat API
 *  ========================= */

/**
 * A single chat turn for conversation history.
 * role: "user" | "assistant"
 */
export type ChatMessage = {
    role: 'user' | 'assistant';
    content: string;
};

/**
 * A source reference (chunk) used to ground an answer with citations.
 */
export type ChatSource = {
    chunkId: number;
    pageStart?: number | null;
    pageEnd?: number | null;
    score?: number | null;
    snippet: string;
    chunkIndex: number;
};

/**
 * Request payload for education chat.
 */
export type ChatRequest = {
    message: string;
    docId?: number | null;
    history?: ChatMessage[];
};

/**
 * Response from education chat endpoint.
 */
export type ChatResponse = {
    answer: string;
    docId?: number | null;
    sources: ChatSource[];
};

/**
 * Send a message to the AI tutor with optional document context and conversation history.
 * Returns the AI response with source citations.
 */
export async function sendChatMessage(request: ChatRequest): Promise<ChatResponse> {
    const { data } = await api.post<ChatResponse>('/education/chat', request);
    return data;
}

/** =========================
 *  Progress Hub API
 *  ========================= */

export type EducationProgressSummary = {
    streakDays: number;
    lastStudyAt?: string | null;
    avgAccuracy?: number | null;
    attemptsLast30: number;
};

export type EducationAttemptEvent = {
    id: number;
    docId: number;
    attemptType?: string | null; // DTO is string
    mode?: string | null;        // DTO is string
    score?: number | null;
    maxScore?: number | null;
    percent?: number | null;
    weakTopics?: string[] | null;
    createdAt?: string | null;
};

export type EducationWeakTopic = {
    topic: string;
    count: number;
};

export type EducationAttemptCreateRequest = {
    docId: number;
    attemptType: string; // e.g. "QUIZ", "FLASHCARDS", etc.
    mode: string;        // e.g. "STUDY", "EXAM", etc.
    score?: number;
    maxScore?: number;
    percent?: number;
    weakTopics?: string[];
};

export async function getEducationProgressSummary() {
    const { data } = await api.get<EducationProgressSummary>(`/education/progress/summary`);
    return data;
}

export async function getEducationAttempts(days = 30, limit = 50) {
    const { data } = await api.get<EducationAttemptEvent[]>(`/education/progress/attempts`, {
        params: { days, limit },
    });
    return data;
}

export async function getEducationWeakTopics(days = 30, limit = 10) {
    const { data } = await api.get<EducationWeakTopic[]>(`/education/progress/weak-topics`, {
        params: { days, limit },
    });
    return data;
}

export async function recordEducationAttempt(payload: EducationAttemptCreateRequest) {
    const { data } = await api.post<EducationAttemptEvent>(`/education/progress/attempts`, payload);
    return data;
}

/** =========================
 *  Quiz API
 *  ========================= */

/**
 * A quiz question with choices.
 */
export type QuizQuestion = {
    id: number;
    questionIndex: number;
    questionType: string;
    prompt: string;
    choices: string[];
    answerIndex?: number | null;    // null when taking quiz
    explanation?: string | null;     // null when taking quiz
};

/**
 * A complete quiz with questions.
 */
export type Quiz = {
    id: number;
    docId: number;
    title: string;
    questionCount: number;
    questions: QuizQuestion[];
    createdAt: string;
};

/**
 * Request to generate a quiz.
 */
export type GenerateQuizRequest = {
    questionCount?: number;
    difficulty?: 'easy' | 'medium' | 'hard';
    pageStart?: number;
    pageEnd?: number;
};

/**
 * Result for a single graded question.
 */
export type QuestionResult = {
    questionId: number;
    questionIndex: number;
    prompt: string;
    choices: string[];
    correctAnswerIndex: number;
    userAnswerIndex?: number | null;
    correct: boolean;
    explanation: string;
};

/**
 * Response after grading a quiz.
 */
export type QuizGradeResponse = {
    quizId: number;
    totalQuestions: number;
    correctCount: number;
    incorrectCount: number;
    scorePercent: number;
    results: QuestionResult[];
    weakTopics: string[];
};

/**
 * Generate a new quiz from document content.
 */
export async function generateQuiz(docId: number, options?: GenerateQuizRequest): Promise<Quiz> {
    const { data } = await api.post<Quiz>(`/education/documents/${docId}/quizzes/generate`, options || {});
    return data;
}

/**
 * Get all quizzes for a document.
 */
export async function getQuizzesForDocument(docId: number): Promise<Quiz[]> {
    const { data } = await api.get<Quiz[]>(`/education/documents/${docId}/quizzes`);
    return data;
}

/**
 * Get a specific quiz by ID.
 */
export async function getQuiz(quizId: number): Promise<Quiz> {
    const { data } = await api.get<Quiz>(`/education/quizzes/${quizId}`);
    return data;
}

/**
 * Grade a quiz attempt.
 * @param quizId The quiz ID
 * @param answers Map of questionId -> selected answer index
 */
export async function gradeQuiz(quizId: number, answers: Record<number, number>): Promise<QuizGradeResponse> {
    const { data } = await api.post<QuizGradeResponse>(`/education/quizzes/${quizId}/grade`, { answers });
    return data;
}

/**
 * Delete a quiz.
 */
export async function deleteQuiz(quizId: number): Promise<void> {
    await api.delete(`/education/quizzes/${quizId}`);
}

/** =========================
 *  Notes API
 *  ========================= */

/**
 * Note style options.
 */
export type NoteStyle = 'outline' | 'cornell' | 'detailed' | 'summary';

/**
 * A generated note.
 */
export type Note = {
    id: number;
    docId: number;
    title: string;
    style: NoteStyle;
    content: string;
    pageStart?: number | null;
    pageEnd?: number | null;
    createdAt: string;
};

/**
 * Request to generate notes.
 */
export type GenerateNotesRequest = {
    style?: NoteStyle;
    pageStart?: number;
    pageEnd?: number;
};

/**
 * Generate notes from document content.
 * Supports styles: outline, cornell, detailed, summary
 */
export async function generateNotes(docId: number, options?: GenerateNotesRequest): Promise<Note> {
    const { data } = await api.post<Note>(`/education/documents/${docId}/notes/generate`, options || {});
    return data;
}

/**
 * Get all notes for a document.
 */
export async function getNotesForDocument(docId: number): Promise<Note[]> {
    const { data } = await api.get<Note[]>(`/education/documents/${docId}/notes`);
    return data;
}

/**
 * Get a specific note by ID.
 */
export async function getNote(noteId: number): Promise<Note> {
    const { data } = await api.get<Note>(`/education/notes/${noteId}`);
    return data;
}

/**
 * Delete a note.
 */
export async function deleteNote(noteId: number): Promise<void> {
    await api.delete(`/education/notes/${noteId}`);
}

/** =========================
 *  Flashcards API
 *  ========================= */

/**
 * A single flashcard with front and back content.
 */
export type Flashcard = {
    id: number;
    cardIndex: number;
    front: string;
    back: string;
};

/**
 * A flashcard deck containing multiple cards.
 */
export type FlashcardDeck = {
    id: number;
    docId: number;
    title: string;
    cardCount: number;
    cards: Flashcard[];
    createdAt: string;
};

/**
 * Request to generate flashcards.
 */
export type GenerateFlashcardsRequest = {
    cardCount?: number;
    pageStart?: number;
    pageEnd?: number;
};

/**
 * Generate flashcards from document content.
 */
export async function generateFlashcards(docId: number, options?: GenerateFlashcardsRequest): Promise<FlashcardDeck> {
    const { data } = await api.post<FlashcardDeck>(`/education/documents/${docId}/flashcards/generate`, options || {});
    return data;
}

/**
 * Get all flashcard decks for a document.
 */
export async function getFlashcardDecks(docId: number): Promise<FlashcardDeck[]> {
    const { data } = await api.get<FlashcardDeck[]>(`/education/documents/${docId}/flashcards`);
    return data;
}

/**
 * Get a specific flashcard deck by ID.
 */
export async function getFlashcardDeck(deckId: number): Promise<FlashcardDeck> {
    const { data } = await api.get<FlashcardDeck>(`/education/flashcards/${deckId}`);
    return data;
}

/**
 * Delete a flashcard deck.
 */
export async function deleteFlashcardDeck(deckId: number): Promise<void> {
    await api.delete(`/education/flashcards/${deckId}`);
}

/** =========================
 *  Essay Grader API
 *  ========================= */

/**
 * Request to grade an essay.
 */
export type EssayGradeRequest = {
    essay: string;
    topic?: string;
};

/**
 * Rubric scores for essay grading.
 */
export type EssayScores = {
    thesis: number;
    organization: number;
    evidence: number;
    analysis: number;
    clarity: number;
    grammar: number;
};

/**
 * Response from essay grading.
 */
export type EssayGradeResponse = {
    overallScore: number;
    scores: EssayScores;
    strengths: string[];
    improvements: string[];
    detailedFeedback: string;
    rewriteSuggestion: string;
};

/**
 * Grade an essay using AI-powered rubric evaluation.
 */
export async function gradeEssay(request: EssayGradeRequest): Promise<EssayGradeResponse> {
    const { data } = await api.post<EssayGradeResponse>('/education/essay/grade', request);
    return data;
}

/** =========================
 *  Study Plan API
 *  ========================= */

/**
 * A study task within a plan.
 */
export type StudyTask = {
    id: number;
    docId?: number | null;
    taskType: string;
    title: string;
    description?: string | null;
    scheduledDate: string;
    durationMins: number;
    status: 'pending' | 'completed' | 'skipped';
    completedAt?: string | null;
};

/**
 * A study plan with scheduled tasks.
 */
export type StudyPlan = {
    id: number;
    title: string;
    description?: string | null;
    examDate: string;
    weeklyHours: number;
    status: string;
    tasks: StudyTask[];
    totalTasks: number;
    completedTasks: number;
    createdAt: string;
};

/**
 * Request to create a study plan.
 */
export type CreateStudyPlanRequest = {
    title: string;
    description?: string;
    examDate: string;
    weeklyHours?: number;
    docIds?: number[];
    focusTopics?: string[];
};

/**
 * Create a new study plan.
 */
export async function createStudyPlan(request: CreateStudyPlanRequest): Promise<StudyPlan> {
    const { data } = await api.post<StudyPlan>('/education/plans', request);
    return data;
}

/**
 * Get all study plans for the current user.
 */
export async function getStudyPlans(): Promise<StudyPlan[]> {
    const { data } = await api.get<StudyPlan[]>('/education/plans');
    return data;
}

/**
 * Get a specific study plan.
 */
export async function getStudyPlan(planId: number): Promise<StudyPlan> {
    const { data } = await api.get<StudyPlan>(`/education/plans/${planId}`);
    return data;
}

/**
 * Delete a study plan.
 */
export async function deleteStudyPlan(planId: number): Promise<void> {
    await api.delete(`/education/plans/${planId}`);
}

/**
 * Mark a task as completed.
 */
export async function completeStudyTask(taskId: number): Promise<StudyTask> {
    const { data } = await api.post<StudyTask>(`/education/tasks/${taskId}/complete`);
    return data;
}

/**
 * Skip a task.
 */
export async function skipStudyTask(taskId: number): Promise<StudyTask> {
    const { data } = await api.post<StudyTask>(`/education/tasks/${taskId}/skip`);
    return data;
}
