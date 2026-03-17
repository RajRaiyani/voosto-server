-- migrate:up


create table activity_categories (
  id uuid not null default uuidv7() constraint pk_activity_categories_id primary key,
  name varchar(100) not null constraint uk_activity_categories_name unique,
  icon varchar(5) not null
);


update activities set category = 'Sightseeing' where category = 'Other';
update users set interested_activity = 'Food & Drinks' where interested_activity = 'All activities';
update users set interested_activity = 'Food & Drinks' where interested_activity is null;

alter table activities add column category_id uuid constraint fk_activities_category_id references activity_categories(id);

update activities set category_id = (select id from activity_categories where name = category);

alter table activities alter column category_id set not null;

alter table activities drop column category;


create table user_interested_activities (
  user_id uuid not null constraint fk_user_interested_activities_user_id references users(id),
  activity_category_id uuid not null constraint fk_user_interested_activities_activity_category_id references activity_categories(id),
  constraint pk_user_interested_activities_user_id_activity_category_id primary key (user_id, activity_category_id)
);

insert into user_interested_activities (user_id, activity_category_id) 
select id, (select id from activity_categories where name = interested_activity) 
from users;

alter table users drop column interested_activity;
alter table users add column heard_about_us varchar(150);

alter table trips drop column conversation_id;

-- migrate:down

alter table trips add column conversation_id uuid constraint fk_trips_conversation_id references conversations(id);

alter table users drop column heard_about_us;
alter table users add column interested_activity varchar(100);
update users u set interested_activity = (
  select ac.name from user_interested_activities uia
  join activity_categories ac on ac.id = uia.activity_category_id
  where uia.user_id = u.id
  limit 1
);
drop table user_interested_activities;

alter table activities add column category varchar(100);
update activities set category = (select name from activity_categories where id = activities.category_id);
alter table activities drop column category_id;

drop table activity_categories;
