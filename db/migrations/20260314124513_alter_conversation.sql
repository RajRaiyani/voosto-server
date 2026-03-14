-- migrate:up

update conversations set is_womans_only = false
where id in (
  select conversation_id from activities where created_by in (select id from users where gender = 'male')
);

-- migrate:down

