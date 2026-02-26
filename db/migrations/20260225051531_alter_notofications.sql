-- migrate:up


alter table notifications add column body text not null default '';
alter table notifications add column title text not null default '';

-- migrate:down

alter table notifications drop column body;
alter table notifications drop column title;
