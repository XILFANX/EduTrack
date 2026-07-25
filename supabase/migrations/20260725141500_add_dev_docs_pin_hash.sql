-- Add dev_docs_pin_hash to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS dev_docs_pin_hash TEXT;
