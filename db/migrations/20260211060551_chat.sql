-- migrate:up


create table conversations (
  id uuid not null default uuidv7() constraint pk_conversations_id primary key,
  name varchar(255) not null,
  is_group boolean not null default false,
  created_at timestamp with time zone not null default now(),
  created_by uuid not null constraint fk_conversations_created_by references users(id),
  updated_at timestamp with time zone
);

create table conversation_participants (
  conversation_id uuid not null constraint fk_conversation_participants_conversation_id references conversations(id),
  user_id uuid not null constraint fk_conversation_participants_user_id references users(id),
  joined_at timestamp with time zone not null default now(),
  is_admin boolean not null default false,
  constraint pk_conversation_participants_conversation_id_user_id primary key (conversation_id, user_id)
);

create table messages (
  id uuid not null default uuidv7() constraint pk_messages_id primary key,
  conversation_id uuid not null constraint fk_messages_conversation_id references conversations(id),
  sender_id uuid not null constraint fk_messages_sender_id references users(id),
  content text not null,
  created_at timestamp with time zone not null default now(),
  seen_at timestamp with time zone
);


-- migrate:down

drop table messages;
drop table conversation_participants;
drop table conversations;