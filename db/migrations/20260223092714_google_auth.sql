-- migrate:up

alter table users alter column password_hash drop not null;

alter table users add column login_method varchar(100) not null default 'normal';

-- migrate:down

alter table users alter column password_hash set not null;
alter table users drop column login_method;
