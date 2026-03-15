-- migrate:up


alter table messages alter column sender_id drop not null;

-- migrate:down

alter table messages alter column sender_id set not null;