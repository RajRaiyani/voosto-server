-- migrate:up

create type gender as enum ('male', 'female');

create table countries (
  id uuid not null default uuidv7(),
  name varchar(100) not null,
  code varchar(100) not null,
  dial_code varchar(100) not null,
  constraint pk_countries_id primary key (id),
  constraint uk_countries_name unique (name),
  constraint uk_countries_code unique (code)
);

create table files (
  id uuid not null default uuidv7(),
  key text not null,
  size bigint not null,
  _status varchar(100) not null default 'pending',
  created_at timestamp with time zone not null default now(),
  constraint pk_files_id primary key (id),
  constraint uk_files_key unique (key)
);

create table users (
  id uuid not null default uuidv7(),
  first_name varchar(100) not null,
  last_name varchar(100) not null,
  full_name varchar(255) generated always as (first_name || ' ' || last_name) stored,
  email varchar(255) not null,
  is_email_verified boolean not null default false,
  phone_number varchar(100),
  is_phone_number_verified boolean not null default false,
  password_hash text not null,
  profile_image uuid,
  gender gender not null default 'male',
  date_of_birth date,
  country_id uuid,
  bio text,
  interested_activity varchar(200),
  is_profile_completed boolean not null default false,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone,
  meta_data jsonb not null default '{}',
  constraint pk_users_id primary key (id),
  constraint uk_users_email unique (email),
  constraint fk_users_profile_image foreign key (profile_image) references files(id),
  constraint fk_users_country foreign key (country_id) references countries(id)
);


-- migrate:down

drop table users;
drop table files;
drop table countries;
drop type gender;