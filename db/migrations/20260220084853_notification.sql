-- migrate:up

create table notifications (
  id uuid not null default uuidv7() constraint pk_notifications_id primary key,
  type varchar(100) not null default 'general',
  user_id uuid not null constraint fk_notifications_user_id references users(id),
  meta_data jsonb not null default '{}'::jsonb,
  created_at timestamp with time zone not null default now()
);

-- migrate:down

drop table notifications;
