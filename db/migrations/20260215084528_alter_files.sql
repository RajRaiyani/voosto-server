-- migrate:up


alter table files drop column size;
alter table files drop column mimetype;

-- migrate:down

alter table files add column size bigint not null;
alter table files add column mimetype varchar(200);