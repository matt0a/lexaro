/**
 * Query key factories for TanStack Query.
 *
 * Rules:
 * - Import from this file everywhere. Never inline object literals in queryKey arrays.
 * - Factories return `as const` tuples so TypeScript can narrow the exact key type.
 * - The ['documents', 'list'] prefix is used by partial-key invalidation in mutation
 *   handlers — do not change the first two segments without updating those call sites.
 */
export const queryKeys = {
    /**
     * Key for GET /me/usage — current user plan + usage counters.
     */
    meUsage: () => ['me', 'usage'] as const,

    /**
     * Key for GET /documents with pagination + purpose filter.
     * Including page/size so different pagination states are cached independently.
     */
    documentsList: (purpose: string, page: number, size: number) =>
        ['documents', 'list', { purpose, page, size }] as const,

    /**
     * Partial prefix for invalidating ALL document list variants (all purposes/pages/sizes).
     * Use with queryClient.invalidateQueries — partial-key matching covers all documentsList entries.
     */
    documentsListAll: () => ['documents', 'list'] as const,

    /**
     * Key for a single document's metadata, fetched by id.
     */
    documentMeta: (docId: string) => ['documents', 'meta', docId] as const,

    /**
     * Key for the audio generation status poll of a document.
     */
    audioStatus: (docId: string) => ['documents', 'audioStatus', docId] as const,

    /**
     * Key for GET /education/progress/summary — education stats.
     */
    educationSummary: () => ['education', 'summary'] as const,

    /**
     * Key for GET /tts/voices — voice catalog (very long stale time).
     */
    voicesCatalog: () => ['voices', 'catalog'] as const,
} as const;
