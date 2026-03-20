-- migrate:up

alter table notifications alter column body drop not null;
alter table notifications alter column title drop not null;


-- migrate:down

