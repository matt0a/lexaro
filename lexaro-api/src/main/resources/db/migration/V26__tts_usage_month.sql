create table if not exists tts_usage (
                                         user_id    bigint      not null,
                                         period_ym  char(7)     not null,        -- e.g. '2025-10'
                                         chars_used bigint      not null default 0,
                                         updated_at timestamptz not null default now(),
                                         constraint pk_tts_usage primary key (user_id, period_ym)
);

alter table tts_usage
    add column if not exists chars_used bigint not null default 0;

alter table tts_usage alter column chars_used set default 0;
alter table tts_usage alter column chars_used set not null;
