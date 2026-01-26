package com.lexaro.api.education.repo.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class IndexDocumentResponse {
    private Long docId;
    private int pageCount;
    private int chunkCount;
    private int chunkChars;
    private int overlapChars;
}
