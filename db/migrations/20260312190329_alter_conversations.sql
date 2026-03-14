-- migrate:up

alter table conversations add column display_emoji varchar(5) not null default '💬';

delete from conversation_members where user_id = (
    select created_by from trips where meta_data->'country' is null
    );

delete from trips where meta_data->>'country' is null;

alter table trips add column country_code varchar(3);

update trips set country_code = meta_data->'country'->>'code';

alter table trips drop column meta_data;

update conversations set display_emoji = (
  select ac.icon 
  from activities a
  left join activity_categories ac on ac.id = a.category_id
  where a.conversation_id = conversations.id
  limit 1
) where id in (select conversation_id from activities); 


update conversations set display_emoji = (
  select 
    c.flag
  from trips t
  left join countries c on c.code = t.country_code
  where t.place_id = conversations.place_id
  limit 1
) where id in (select id from conversations where place_id in (select place_id from trips));

update conversation_members set is_admin = false;


update conversation_members cm set is_admin = true
from activities a
left join conversations c on c.id = a.conversation_id
where cm.conversation_id = c.id and a.created_by = cm.user_id;







alter table users add column latitude numeric(10,8);
alter table users add column longitude numeric(11,8);


-- update trips t
-- set meta_data = t2.meta_data
-- from trips t2
-- where t2.place_name = t.place_name
--   and t2.meta_data->>'country' is not null
--   and t.meta_data->>'country' is null;

-- migrate:down

alter table users drop column if exists latitude;
alter table users drop column if exists longitude;

alter table trips add column meta_data jsonb;
update trips set meta_data = jsonb_build_object('country', jsonb_build_object('code', country_code)) where country_code is not null;
alter table trips drop column country_code;

alter table conversations drop column if exists display_emoji;

-- Note: Rows deleted from conversation_members and trips in the up migration cannot be restored.
