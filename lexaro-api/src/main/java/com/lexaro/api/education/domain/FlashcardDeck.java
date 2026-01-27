package com.lexaro.api.education.domain;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

/**
 * Represents a deck of AI-generated flashcards for studying a document.
 * Each deck contains multiple flashcards with front/back content.
 */
@Entity
@Table(name = "education_flashcard_decks")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FlashcardDeck {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "doc_id", nullable = false)
    private Long docId;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "title")
    private String title;

    @Column(name = "card_count", nullable = false)
    @Builder.Default
    private Integer cardCount = 0;

    /**
     * The flashcards in this deck, ordered by card index.
     * Using EAGER fetch to avoid lazy loading issues.
     */
    @OneToMany(mappedBy = "deck", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @OrderBy("cardIndex ASC")
    @Builder.Default
    private List<Flashcard> cards = new ArrayList<>();

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    /**
     * Add a flashcard to this deck.
     */
    public void addCard(Flashcard card) {
        cards.add(card);
        card.setDeck(this);
        cardCount = cards.size();
    }
}
