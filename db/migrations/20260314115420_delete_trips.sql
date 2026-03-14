-- migrate:up



delete from conversation_members where conversation_id in (
  select id from conversations where place_id in (select place_id from trips where country_code is null)
);

delete from messages where conversation_id in (
  select id from conversations where place_id in (select place_id from trips where country_code is null)
);

delete from conversations where place_id in (select place_id from trips where country_code is null);

delete from trips where country_code is null;

-- migrate:down

