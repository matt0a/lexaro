package com.lexaro.api.education.service;

import com.lexaro.api.education.repo.dto.IndexDocumentResponse;

public interface DocumentIndexService {
    IndexDocumentResponse indexDocument(Long docId);
}
