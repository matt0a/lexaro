-- Create table if it does not exist
create table if not exists tts_usage (
                                         user_id    bigint       not null,
                                         period_ym  char(7)      not null,         -- e.g. '2025-10'
                                         chars_used bigint       not null default 0,
                                         updated_at timestamptz  not null default now(),
                                         constraint pk_tts_usage primary key (user_id, period_ym)
);

-- If table exists but column doesn't, add it
alter table tts_usage
    add column if not exists chars_used bigint not null default 0;

-- If you previously had a different column name, uncomment one of these:
-- alter table tts_usage rename column words_used to chars_used;
-- alter table tts_usage add column if not exists words_used bigint;  -- only if you need to keep legacy

-- Optional: ensure not null/defaults are set (safe idempotent)
alter table tts_usage alter column chars_used set default 0;
alter table tts_usage alter column chars_used set not null;
