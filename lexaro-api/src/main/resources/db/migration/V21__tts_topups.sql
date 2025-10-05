create table if not exists tts_topups (
                                          id bigserial primary key,
                                          user_id bigint not null references users(id) on delete cascade,
                                          period_ym char(7) not null,           -- e.g. '2025-10'
                                          chars bigint not null check (chars >= 0),
                                          created_at timestamptz not null default now()
);

create index if not exists idx_tts_topups_user_period on tts_topups(user_id, period_ym);
