-- migrate:up

alter table trips drop column place;
alter table conversations add column is_deletable boolean not null default true;

alter table trips alter column conversation_id drop not null;

delete from messages where conversation_id in (
  select id from conversations where id in (
    select conversation_id from trips
  )
);

delete from conversation_members where conversation_id in (
  select id from conversations where id in (
    select conversation_id from trips
  )
);

with deleted_trips as (
  delete from trips
  returning conversation_id
)
delete from conversations
where id in (select conversation_id from deleted_trips);

alter table trips add column place_id varchar(255) not null;
alter table trips add column place_name varchar(255) not null;
alter table trips add constraint uk_trips_created_by_place_id unique (created_by, place_id);

alter table conversations add column meta_data jsonb not null default '{}';
alter table conversations add column place_id varchar(255) constraint uk_conversations_place_id unique;
alter table conversations add column place_name varchar(255);
alter table trips add column meta_data jsonb not null default '{}';

-- migrate:down


alter table trips drop column place_id;
alter table trips drop column place_name;
alter table trips drop column meta_data;
alter table trips alter column conversation_id set not null;

alter table trips add column place varchar(255) not null;

alter table conversations drop column place_id;
alter table conversations drop column place_name;
alter table conversations drop column meta_data;
alter table conversations drop column is_deletable;