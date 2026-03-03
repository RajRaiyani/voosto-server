-- migrate:up


alter table conversation add column category varchar(100);

-- migrate:down

alter table conversations drop column category;