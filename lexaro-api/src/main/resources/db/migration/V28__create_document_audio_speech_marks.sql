create table if not exists document_audio_speech_marks (
                                                           id bigserial primary key,
                                                           doc_id bigint not null unique,
                                                           user_id bigint not null,
                                                           provider varchar(32) not null,
                                                           text_sha256 varchar(64) not null,
                                                           marks_json jsonb not null,
                                                           created_at timestamptz not null default now()
);

create index if not exists idx_marks_user on document_audio_speech_marks(user_id);
create index if not exists idx_marks_provider on document_audio_speech_marks(provider);
