-- migrate:up

alter table conversation_joining_requests add column notification_enabled boolean not null default true;

-- migrate:down

alter table conversation_joining_requests drop column notification_enabled;