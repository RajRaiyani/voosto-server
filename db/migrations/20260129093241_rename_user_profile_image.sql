-- migrate:up


alter table users rename column profile_image to profile_image_id;
alter table users
  rename constraint fk_users_profile_image to fk_users_profile_image_id;
alter table users
  rename constraint fk_users_country to fk_users_country_id;


-- migrate:down

alter table users rename column profile_image_id to profile_image;
alter table users
  rename constraint fk_users_profile_image_id to fk_users_profile_image;
alter table users
  rename constraint fk_users_country_id to fk_users_country;
