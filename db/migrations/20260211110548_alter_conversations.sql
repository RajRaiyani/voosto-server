-- migrate:up


alter table conversations
alter column name drop not null;

alter table conversations
drop column created_by;

alter table conversations
drop column updated_at;

-- migrate:down

alter table conversations
alter column name set not null;

alter table conversations
add column created_by uuid not null constraint fk_conversations_created_by references users(id);

alter table conversations
add column updated_at timestamp with time zone;