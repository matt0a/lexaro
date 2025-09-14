-- Convert CHAR(64) -> VARCHAR(64) and strip any trailing spaces
ALTER TABLE documents
ALTER COLUMN sha256 TYPE VARCHAR(64)
  USING trim(both FROM sha256);
