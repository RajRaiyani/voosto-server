-- migrate:up


alter table files add column endpoint text not null default 'http://localhost:3007/files';
alter table files drop column url;

alter table files add column url text generated always as (endpoint || '/' || key) stored;

-- migrate:down

alter table files drop column endpoint;
alter table files drop column url;
alter table files add column url text not null;