-- Convert Postgres enum doc_status -> VARCHAR for JPA compatibility
ALTER TABLE documents
ALTER COLUMN status TYPE VARCHAR(20)
  USING status::text;
