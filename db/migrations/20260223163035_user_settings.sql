-- migrate:up

alter table users add column settings jsonb not null default '{}';

-- migrate:down

alter table users drop column settings;
