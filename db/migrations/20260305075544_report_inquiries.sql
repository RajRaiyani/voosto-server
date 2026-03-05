-- migrate:up



create table report_inquiries (
  id uuid not null default uuidv7() constraint pk_report_inquiries_id primary key,
  created_by uuid not null constraint fk_report_inquiries_created_by references users(id),
  type varchar(100) not null default 'general',
  reference_id uuid,
  body text,
  created_at timestamp with time zone not null default now()
);


-- migrate:down

drop table report_inquiries;
