-- migrate:up

alter table messages
  add column reply_to_message_id uuid constraint fk_messages_reply_to_message_id references messages(id) on delete set null;

create table message_reactions (
  message_id uuid not null constraint fk_message_reactions_message_id references messages(id) on delete cascade,
  user_id uuid not null constraint fk_message_reactions_user_id references users(id) on delete cascade,
  emoji varchar(32) not null,
  created_at timestamp with time zone not null default now(),
  constraint pk_message_reactions_message_id_user_id primary key (message_id, user_id)
);

create index idx_messages_reply_to_message_id on messages (reply_to_message_id);

-- migrate:down

drop table message_reactions;

alter table messages drop column reply_to_message_id;
