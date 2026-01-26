package com.lexaro.api.education.service.impl;

import com.lexaro.api.education.config.EducationProperties;
import com.lexaro.api.education.domain.DocumentTextChunk;
import com.lexaro.api.education.repo.dto.IndexDocumentResponse;
import com.lexaro.api.education.repo.DocumentTextChunkRepository;
import com.lexaro.api.education.service.DocumentIndexService;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.List;

import static org.springframework.http.HttpStatus.BAD_REQUEST;
import static org.springframework.http.HttpStatus.NOT_FOUND;

@Service
@RequiredArgsConstructor
public class DocumentIndexServiceImpl implements DocumentIndexService {

    private final JdbcTemplate jdbcTemplate;
    private final DocumentTextChunkRepository chunkRepo;
    private final EducationProperties props;

    private record DocText(String text, Integer pageCount) {}

    @Override
    @Transactional
    public IndexDocumentResponse indexDocument(Long docId) {
        DocText dt = loadExtractedText(docId);

        String text = dt.text();
        int pageCount = (dt.pageCount() == null || dt.pageCount() <= 0) ? 1 : dt.pageCount();

        int chunkChars = props.getDefaultChunkChars();
        int overlap = props.getDefaultOverlapChars();

        // reset
        chunkRepo.deleteByDocId(docId);

        // build page boundaries + chunk windows
        List<int[]> pageBounds = buildPageBounds(text, pageCount);
        List<DocumentTextChunk> chunks = buildChunks(docId, text, pageBounds, chunkChars, overlap);

        chunkRepo.saveAll(chunks);

        return IndexDocumentResponse.builder()
                .docId(docId)
                .pageCount(pageCount)
                .chunkCount(chunks.size())
                .chunkChars(chunkChars)
                .overlapChars(overlap)
                .build();
    }

    private DocText loadExtractedText(Long docId) {
        List<DocText> rows = jdbcTemplate.query(
                "select extracted_text, page_count from public.documents where id = ?",
                (rs, i) -> new DocText(rs.getString(1), (Integer) rs.getObject(2)),
                docId
        );

        if (rows.isEmpty()) throw new ResponseStatusException(NOT_FOUND, "Document not found: " + docId);

        DocText dt = rows.get(0);
        if (dt.text() == null || dt.text().isBlank()) {
            throw new ResponseStatusException(BAD_REQUEST, "Document has no extracted_text yet (complete extraction first).");
        }
        return dt;
    }

    /**
     * Best-effort page boundaries:
     * 1) If extracted_text contains form-feed (\f), treat each as a page break.
     * 2) Else fallback to roughly equal splits by page_count.
     */
    private List<int[]> buildPageBounds(String text, int pageCount) {
        List<int[]> bounds = new ArrayList<>();

        int ff = text.indexOf('\f');
        if (ff >= 0) {
            String[] pages = text.split("\f");
            int pos = 0;
            for (String p : pages) {
                int start = pos;
                int end = start + p.length();
                bounds.add(new int[]{start, end});
                pos = end + 1; // +1 for the split char
            }
            return bounds;
        }

        int total = text.length();
        int approx = Math.max(1, total / Math.max(1, pageCount));
        int start = 0;
        for (int i = 0; i < pageCount; i++) {
            int end = (i == pageCount - 1) ? total : Math.min(total, start + approx);
            bounds.add(new int[]{start, end});
            start = end;
        }
        return bounds;
    }

    private List<DocumentTextChunk> buildChunks(
            Long docId,
            String text,
            List<int[]> pageBounds,
            int chunkChars,
            int overlap
    ) {
        List<DocumentTextChunk> out = new ArrayList<>();
        int pos = 0;
        int idx = 0;

        while (pos < text.length()) {
            int end = Math.min(text.length(), pos + chunkChars);

            // avoid super tiny last chunk: merge backwards a bit
            if (text.length() - end < chunkChars / 4 && end != text.length()) {
                end = text.length();
            }

            // compute trimmed boundaries WITHOUT breaking start/end correctness
            int left = pos;
            while (left < end && Character.isWhitespace(text.charAt(left))) left++;

            int right = end;
            while (right > left && Character.isWhitespace(text.charAt(right - 1))) right--;

            if (right > left) {
                String chunkText = text.substring(left, right);

                int pageStart = pageForChar(pageBounds, left);
                int pageEnd = pageForChar(pageBounds, Math.max(left, right - 1));

                out.add(DocumentTextChunk.builder()
                        .docId(docId)
                        .chunkIndex(idx++)
                        .pageStart(pageStart)
                        .pageEnd(pageEnd)
                        .startChar(left)
                        .endChar(right)
                        .text(chunkText)
                        .topicTag(null)
                        .build());
            }

            if (end == text.length()) break;
            pos = Math.max(0, end - overlap);
        }

        return out;
    }


    private int pageForChar(List<int[]> bounds, int charIndex) {
        for (int i = 0; i < bounds.size(); i++) {
            int[] b = bounds.get(i);
            if (charIndex >= b[0] && charIndex < b[1]) return i + 1; // 1-indexed pages
        }
        return Math.max(1, bounds.size());
    }
}
