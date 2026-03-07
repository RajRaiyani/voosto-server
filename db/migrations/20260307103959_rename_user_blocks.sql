-- migrate:up


alter table user_blocks rename to blocked_users;

-- migrate:down

drop table user_blocks;