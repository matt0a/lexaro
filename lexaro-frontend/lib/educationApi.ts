import api from '@/lib/api';

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
