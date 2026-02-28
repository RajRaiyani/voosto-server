-- migrate:up

alter table user_notification_tokens drop constraint pk_user_notification_tokens_token;
alter table user_notification_tokens add constraint pk_user_notification_tokens_user_id_token primary key (user_id, token);

-- migrate:down

alter table user_notification_tokens drop constraint pk_user_notification_tokens_user_id_token;
alter table user_notification_tokens add constraint pk_user_notification_tokens_token primary key (token);