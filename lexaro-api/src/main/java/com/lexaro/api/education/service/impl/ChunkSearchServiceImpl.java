package com.lexaro.api.education.service.impl;

import com.lexaro.api.education.domain.DocumentTextChunk;
import com.lexaro.api.education.repo.dto.ChunkSearchItem;
import com.lexaro.api.education.repo.dto.ChunkSearchResponse;
import com.lexaro.api.education.repo.DocumentTextChunkRepository;
import com.lexaro.api.education.service.ChunkSearchService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ChunkSearchServiceImpl implements ChunkSearchService {

    private final DocumentTextChunkRepository chunkRepo;

    @Override
    @Transactional(readOnly = true)
    public ChunkSearchResponse search(Long docId, String query, Integer pageStart, Integer pageEnd, Integer limit) {
        int lim = (limit == null || limit <= 0) ? 6 : Math.min(limit, 25);

        List<DocumentTextChunk> chunks;
        if (pageStart != null && pageEnd != null) {
            chunks = chunkRepo.findByDocIdAndPageEndGreaterThanEqualAndPageStartLessThanEqualOrderByChunkIndexAsc(
                    docId, pageStart, pageEnd
            );
        } else {
            chunks = chunkRepo.findByDocIdOrderByChunkIndexAsc(docId);
        }

        List<String> tokens = tokenize(query);
        if (tokens.isEmpty()) {
            return ChunkSearchResponse.builder()
                    .docId(docId)
                    .query(query)
                    .pageStart(pageStart)
                    .pageEnd(pageEnd)
                    .results(List.of())
                    .build();
        }

        List<Scored> scored = new ArrayList<>();
        for (DocumentTextChunk c : chunks) {
            double s = score(c.getText(), tokens);
            if (s > 0) {
                scored.add(new Scored(c, s));
            }
        }

        List<ChunkSearchItem> results = scored.stream()
                .sorted(Comparator.comparingDouble(Scored::score).reversed())
                .limit(lim)
                .map(x -> ChunkSearchItem.builder()
                        .chunkId(x.chunk.getId())
                        .pageStart(x.chunk.getPageStart())
                        .pageEnd(x.chunk.getPageEnd())
                        .startChar(x.chunk.getStartChar())
                        .endChar(x.chunk.getEndChar())
                        .score(x.score)
                        .snippet(snippet(x.chunk.getText(), tokens))
                        .build())
                .collect(Collectors.toList());

        return ChunkSearchResponse.builder()
                .docId(docId)
                .query(query)
                .pageStart(pageStart)
                .pageEnd(pageEnd)
                .results(results)
                .build();
    }

    private record Scored(DocumentTextChunk chunk, double score) {}

    private List<String> tokenize(String q) {
        if (q == null) return List.of();
        return Arrays.stream(q.toLowerCase(Locale.ROOT).split("\\s+"))
                .map(t -> t.replaceAll("[^a-z0-9_\\-]", ""))
                .filter(t -> t.length() >= 2)
                .distinct()
                .toList();
    }

    private double score(String text, List<String> tokens) {
        if (text == null || text.isBlank()) return 0;

        String lc = text.toLowerCase(Locale.ROOT);

        double score = 0;
        for (String t : tokens) {
            int count = countOccurrences(lc, t);
            score += count * 2.0;               // keyword hits
            if (lc.contains(" " + t + " ")) score += 1.0; // word-boundary-ish bonus
        }

        // phrase-ish bonus if query has >=2 tokens and appears close
        if (tokens.size() >= 2) {
            String phrase = String.join(" ", tokens);
            if (lc.contains(phrase)) score += 4.0;
        }

        return score;
    }

    private int countOccurrences(String haystack, String needle) {
        int count = 0;
        int idx = 0;
        while ((idx = haystack.indexOf(needle, idx)) >= 0) {
            count++;
            idx += needle.length();
        }
        return count;
    }

    private String snippet(String text, List<String> tokens) {
        if (text == null) return "";
        String lc = text.toLowerCase(Locale.ROOT);

        int best = -1;
        for (String t : tokens) {
            int i = lc.indexOf(t);
            if (i >= 0 && (best < 0 || i < best)) best = i;
        }

        if (best < 0) return text.substring(0, Math.min(240, text.length()));

        int start = Math.max(0, best - 80);
        int end = Math.min(text.length(), best + 160);

        String s = text.substring(start, end).trim();
        return (start > 0 ? "…" : "") + s + (end < text.length() ? "…" : "");
    }
}
