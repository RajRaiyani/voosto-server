-- migrate:up

create table user_posts (
  id uuid not null default uuidv7() constraint pk_user_posts_id primary key,
  user_id uuid not null constraint fk_user_posts_user_id references users(id),
  title varchar(255) not null,
  file_id uuid not null constraint fk_user_posts_file_id references files(id),
  meta_data jsonb not null default '{}',
  constraint uk_user_posts_file_id unique (file_id)
);

-- migrate:down

drop table user_posts;