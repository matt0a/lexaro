package com.lexaro.api.education.repo.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ChunkSearchItem {
    private Long chunkId;
    private Integer pageStart;
    private Integer pageEnd;
    private Integer startChar;
    private Integer endChar;
    private double score;
    private String snippet;
}
