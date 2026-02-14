-- migrate:up


alter table activities drop column is_private;
alter table activities drop column is_womans_only;


alter table conversations add column is_private boolean not null default false;
alter table conversations add column is_womans_only boolean not null default false;
alter table conversations add column display_picture_id uuid constraint fk_conversations_display_picture_id references files(id);

alter table conversation_participants rename to conversation_members;

create table message_attachments (
  message_id uuid not null constraint fk_message_attachments_message_id references messages(id),
  file_id uuid not null constraint fk_message_attachments_file_id references files(id),
  constraint pk_message_attachments_message_id_file_id primary key (message_id, file_id)
);

create table conversation_joining_requests (
  conversation_id uuid not null constraint fk_conversation_joining_requests_conversation_id references conversations(id) on delete cascade,
  user_id uuid not null constraint fk_conversation_joining_requests_user_id references users(id) on delete cascade,
  created_at timestamp with time zone not null default now(),
  constraint pk_c_joining_requests_conversation_id_user_id primary key (conversation_id, user_id)
);

-- migrate:down

drop table message_attachments;
drop table conversation_joining_requests;

alter table conversation_members rename to conversation_participants;

alter table activities add column is_private boolean not null default false;
alter table activities add column is_womans_only boolean not null default false;

alter table conversations drop column is_private;
alter table conversations drop column is_womans_only;
alter table conversations drop column display_picture_id;