package com.lexaro.api.education.service;

import com.lexaro.api.education.repo.dto.ChunkSearchResponse;

public interface ChunkSearchService {
    ChunkSearchResponse search(Long docId, String query, Integer pageStart, Integer pageEnd, Integer limit);
}
