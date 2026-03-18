-- migrate:up

create table message_reads (
  message_id uuid not null constraint fk_message_reads_message_id references messages(id),
  user_id uuid not null constraint fk_message_reads_user_id references users(id),
  seen_at timestamp with time zone not null default now(),
  constraint pk_message_reads_message_id_user_id primary key (message_id, user_id)
);

alter table messages drop column seen_at;

-- migrate:down

drop table message_reads;
alter table messages add column seen_at timestamp with time zone;