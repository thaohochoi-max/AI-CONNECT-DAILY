-- Require explicit admin approval before a digest email goes out
alter table digests add column if not exists approved_at timestamptz;
