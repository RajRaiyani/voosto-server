-- migrate:up

alter table files add column url text;
update files set url = ('http://localhost:3007/files/' || key);

-- migrate:down

alter table files drop column url;