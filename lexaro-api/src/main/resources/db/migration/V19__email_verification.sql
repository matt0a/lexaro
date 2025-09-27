-- V15__email_verification.sql
create table if not exists verification_tokens (
                                                   token        varchar(64) primary key,
                                                   user_id      bigint not null references users(id) on delete cascade,
                                                   created_at   timestamptz not null default now(),
                                                   last_sent_at timestamptz not null default now(),
                                                   expires_at   timestamptz not null,
                                                   used_at      timestamptz null
);

create index if not exists idx_verification_tokens_user on verification_tokens(user_id);
