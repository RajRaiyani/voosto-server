-- migrate:up


create table trips (
  id uuid not null default uuidv7() constraint pk_trips_id primary key,
  conversation_id uuid not null constraint fk_trips_conversation_id references conversations(id),
  place varchar(255) not null,
  date date,
  created_at timestamp with time zone not null default now(),
  created_by uuid not null constraint fk_trips_created_by references users(id),
  updated_at timestamp with time zone
);

-- migrate:down

drop table trips;
