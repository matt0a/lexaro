-- Study plans table
CREATE TABLE education_study_plans (
    id              BIGSERIAL PRIMARY KEY,
    user_id         BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title           VARCHAR(255) NOT NULL,
    description     TEXT,
    exam_date       DATE,
    weekly_hours    INT DEFAULT 10,
    status          VARCHAR(20) NOT NULL DEFAULT 'active',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Study tasks table
CREATE TABLE education_study_tasks (
    id              BIGSERIAL PRIMARY KEY,
    plan_id         BIGINT NOT NULL REFERENCES education_study_plans(id) ON DELETE CASCADE,
    doc_id          BIGINT REFERENCES documents(id) ON DELETE SET NULL,
    task_type       VARCHAR(50) NOT NULL,
    title           VARCHAR(255) NOT NULL,
    description     TEXT,
    scheduled_date  DATE NOT NULL,
    duration_mins   INT DEFAULT 30,
    status          VARCHAR(20) NOT NULL DEFAULT 'pending',
    completed_at    TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_study_plans_user_id ON education_study_plans(user_id);
CREATE INDEX idx_study_tasks_plan_id ON education_study_tasks(plan_id);
CREATE INDEX idx_study_tasks_scheduled_date ON education_study_tasks(scheduled_date);
CREATE INDEX idx_study_tasks_status ON education_study_tasks(status);
