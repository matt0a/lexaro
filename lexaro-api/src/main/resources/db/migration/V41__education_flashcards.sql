-- Flashcard decks table
CREATE TABLE education_flashcard_decks (
    id              BIGSERIAL PRIMARY KEY,
    doc_id          BIGINT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    user_id         BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title           VARCHAR(255),
    card_count      INT NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Individual flashcards table
CREATE TABLE education_flashcards (
    id              BIGSERIAL PRIMARY KEY,
    deck_id         BIGINT NOT NULL REFERENCES education_flashcard_decks(id) ON DELETE CASCADE,
    card_index      INT NOT NULL DEFAULT 0,
    front           TEXT NOT NULL,
    back            TEXT NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for efficient queries
CREATE INDEX idx_flashcard_decks_doc_id ON education_flashcard_decks(doc_id);
CREATE INDEX idx_flashcard_decks_user_id ON education_flashcard_decks(user_id);
CREATE INDEX idx_flashcards_deck_id ON education_flashcards(deck_id);
