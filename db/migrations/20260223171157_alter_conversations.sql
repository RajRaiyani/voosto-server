-- migrate:up

alter table conversation_members add column notification_enabled boolean not null default true;


-- migrate:down

alter table conversation_members drop column notification_enabled;