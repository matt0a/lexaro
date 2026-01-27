package com.lexaro.api.education.service;

import com.lexaro.api.education.repo.dto.IndexDocumentResponse;

public interface DocumentIndexService {
    IndexDocumentResponse indexDocument(Long docId);

    /**
     * Index a document with userId to enable automatic text extraction if needed.
     */
    IndexDocumentResponse indexDocument(Long docId, Long userId);
}
