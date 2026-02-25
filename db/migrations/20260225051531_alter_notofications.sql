-- migrate:up


alter table notifications add column body text not null default '';
alter table notifications rename column message to title;

-- migrate:down

alter table notifications drop column body;
alter table notifications rename column title to message;
