-- Add email_html column to digests for storing AI-generated email content
alter table digests add column if not exists email_html text;
