-- One row per user per month (YYYY-MM)
create table if not exists tts_usage (
                                         user_id    bigint      not null references users(id) on delete cascade,
                                         period_ym  char(7)     not null,              -- e.g. '2025-09'
                                         chars_used bigint      not null default 0,
                                         updated_at timestamptz not null default now(),
                                         primary key (user_id, period_ym)
);

create index if not exists idx_tts_usage_user_period on tts_usage(user_id, period_ym);
