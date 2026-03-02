-- migrate:up


alter table users add column is_deleted boolean not null default false;

-- migrate:down

alter table users drop column is_deleted;