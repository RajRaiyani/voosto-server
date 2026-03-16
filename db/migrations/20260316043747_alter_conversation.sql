-- migrate:up


alter table conversations add column country_code varchar(4);

update conversations set country_code = (
  select country_code from trips where place_id = conversations.place_id limit 1
) where place_id in (select place_id from trips);

-- migrate:down

alter table conversations alter column country_code set not null;