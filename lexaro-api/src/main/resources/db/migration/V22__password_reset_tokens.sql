create table if not exists password_reset_tokens (
                                                     id bigserial primary key,
                                                     user_id bigint not null references users(id) on delete cascade,
                                                     token varchar(128) not null unique,
                                                     expires_at timestamptz not null,
                                                     used_at timestamptz null,
                                                     created_at timestamptz not null default now()
);

create index if not exists idx_prt_user on password_reset_tokens(user_id);
create index if not exists idx_prt_token on password_reset_tokens(token);
