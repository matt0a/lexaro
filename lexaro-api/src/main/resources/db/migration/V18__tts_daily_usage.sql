create table if not exists tts_usage_day (
                                             user_id     bigint       not null,
                                             period_ymd  date         not null,
                                             chars_used  bigint       not null default 0,
                                             updated_at  timestamptz  not null default now(),
                                             primary key (user_id, period_ymd)
);
