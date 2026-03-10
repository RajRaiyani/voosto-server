-- migrate:up

alter table users add column account_delete_reason text;

-- migrate:down

alter table users drop column account_delete_reason;