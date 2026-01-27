package com.lexaro.api.education.domain;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;

/**
 * Represents a single flashcard within a deck.
 * Contains front (question/prompt) and back (answer) content.
 */
@Entity
@Table(name = "education_flashcards")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Flashcard {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "deck_id", nullable = false)
    private FlashcardDeck deck;

    @Column(name = "card_index", nullable = false)
    @Builder.Default
    private Integer cardIndex = 0;

    /**
     * The front of the card - typically a question, term, or prompt.
     */
    @Column(name = "front", nullable = false, columnDefinition = "TEXT")
    private String front;

    /**
     * The back of the card - typically an answer, definition, or explanation.
     */
    @Column(name = "back", nullable = false, columnDefinition = "TEXT")
    private String back;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;
}
