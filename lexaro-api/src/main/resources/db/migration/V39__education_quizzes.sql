-- Quiz storage for education feature
-- Stores generated quizzes and their questions

CREATE TABLE education_quizzes (
    id              BIGSERIAL PRIMARY KEY,
    doc_id          BIGINT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    user_id         BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title           VARCHAR(255),
    question_count  INT NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE education_quiz_questions (
    id              BIGSERIAL PRIMARY KEY,
    quiz_id         BIGINT NOT NULL REFERENCES education_quizzes(id) ON DELETE CASCADE,
    question_index  INT NOT NULL DEFAULT 0,
    question_type   VARCHAR(20) NOT NULL DEFAULT 'mcq',
    prompt          TEXT NOT NULL,
    choices         TEXT,  -- JSON array of choices for MCQ
    answer_index    INT,   -- correct answer index for MCQ
    explanation     TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for efficient lookups
CREATE INDEX idx_education_quizzes_doc_id ON education_quizzes(doc_id);
CREATE INDEX idx_education_quizzes_user_id ON education_quizzes(user_id);
CREATE INDEX idx_education_quiz_questions_quiz_id ON education_quiz_questions(quiz_id);
