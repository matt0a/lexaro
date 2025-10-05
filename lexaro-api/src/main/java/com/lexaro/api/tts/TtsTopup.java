package com.lexaro.api.tts;

import jakarta.persistence.*;
import lombok.Data;

@Entity @Table(name = "tts_topups")
@Data
public class TtsTopup {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) Long id;
    @Column(name = "user_id",   nullable = false) Long userId;
    @Column(name = "period_ym", nullable = false, length = 7) String periodYm; // yyyy-MM
    @Column(nullable = false) Long chars;
}
