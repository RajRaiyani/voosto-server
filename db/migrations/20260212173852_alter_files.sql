-- migrate:up


alter table files drop column url;
alter table files add column url text not null generated always as ('http://localhost:3007/files/' || key) stored;

-- migrate:down

