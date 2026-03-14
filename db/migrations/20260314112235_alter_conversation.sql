-- migrate:up



alter table conversations drop column meta_data;


-- migrate:down
