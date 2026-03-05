-- migrate:up

create table user_blocks (
  blocker_id uuid not null constraint fk_user_blocks_blocker_id references users(id),
  blocked_id uuid not null constraint fk_user_blocks_blocked_id references users(id),
  created_at timestamp with time zone not null default now(),
  constraint pk_user_blocks_blocker_id_blocked_id primary key (blocker_id, blocked_id)
);


-- migrate:down

drop table user_blocks;

