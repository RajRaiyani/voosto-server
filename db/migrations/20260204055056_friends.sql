-- migrate:up

create type friend_mapping_status as enum ('pending', 'accepted', 'rejected');

create table friend_mappings (
  sender_id uuid not null constraint fk_friend_mappings_sender_id references users(id),
  receiver_id uuid not null constraint fk_friend_mappings_receiver_id references users(id),
  status friend_mapping_status not null default 'pending',
  created_at timestamp with time zone not null default now()
);

-- migrate:down

drop table friend_mappings;
drop type friend_mapping_status;
