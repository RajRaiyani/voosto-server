-- migrate:up

create table visited_countries (
  user_id uuid not null constraint fk_visited_countries_user_id references users(id),
  country_id uuid not null constraint fk_visited_countries_country_id references countries(id),
  constraint pk_visited_countries_user_id_country_id primary key (user_id, country_id)
);


-- migrate:down

drop table visited_countries;