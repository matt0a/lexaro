create table if not exists tts_usage_day (
                                             user_id    bigint      not null,
                                             period_ymd char(10)    not null,        -- e.g. '2025-10-26'
                                             chars_used bigint      not null default 0,
                                             updated_at timestamptz not null default now(),
                                             constraint pk_tts_usage_day primary key (user_id, period_ymd)
);

alter table tts_usage_day
    add column if not exists chars_used bigint not null default 0;

alter table tts_usage_day alter column chars_used set default 0;
alter table tts_usage_day alter column chars_used set not null;
