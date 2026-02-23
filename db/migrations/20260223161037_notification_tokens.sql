-- migrate:up

create table user_notification_tokens (
  token text not null constraint pk_user_notification_tokens_token primary key,
  user_id uuid not null constraint fk_user_notification_tokens_user_id references users(id),
  created_at timestamp with time zone not null default now()
);

-- migrate:down

drop table user_notification_tokens;