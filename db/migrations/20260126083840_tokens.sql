-- migrate:up


create table tokens (
  token text not null constraint pk_tokens_token primary key,
  expires_at timestamp with time zone not null,
  created_at timestamp with time zone not null default now(),
  meta_data jsonb not null default '{}'
);

-- migrate:down

drop table tokens;