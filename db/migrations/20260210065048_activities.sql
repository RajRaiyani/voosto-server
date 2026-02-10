-- migrate:up



create table activities (
  id uuid not null default uuidv7() constraint pk_activities_id primary key,
  description text not null,
  category varchar(100),
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  date date,
  time time,
  is_private boolean not null default false,
  is_womans_only boolean not null default false,
  created_at timestamp with time zone not null default now(),
  created_by uuid not null constraint fk_activities_created_by references users(id),
  updated_at timestamp with time zone
);

-- migrate:down

drop table activities;
