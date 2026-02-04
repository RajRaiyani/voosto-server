-- migrate:up

alter table files add column mimetype varchar(200);

-- migrate:down

alter table files drop column mimetype;