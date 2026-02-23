-- migrate:up
ALTER TYPE gender ADD VALUE IF NOT EXISTS 'other';

-- migrate:down

ALTER TYPE gender DROP VALUE IF EXISTS 'other';
