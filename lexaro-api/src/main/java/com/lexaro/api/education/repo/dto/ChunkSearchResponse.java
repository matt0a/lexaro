package com.lexaro.api.education.repo.dto;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class ChunkSearchResponse {
    private Long docId;
    private String query;
    private Integer pageStart;
    private Integer pageEnd;
    private List<ChunkSearchItem> results;
}
