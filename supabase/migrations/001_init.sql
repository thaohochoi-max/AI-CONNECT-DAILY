-- Subscribers table
create table if not exists subscribers (
  id uuid default gen_random_uuid() primary key,
  email text unique not null,
  name text,
  status text default 'active' check (status in ('active', 'unsubscribed')),
  subscribed_at timestamptz default now(),
  unsubscribed_at timestamptz
);

-- Daily digests table
create table if not exists digests (
  id uuid default gen_random_uuid() primary key,
  date date unique not null,
  items jsonb not null default '[]',    -- array of scraped tool news
  script text,                           -- AI-generated video script
  status text default 'pending' check (status in ('pending', 'scripted', 'video_generating', 'video_ready', 'sent')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Videos table
create table if not exists videos (
  id uuid default gen_random_uuid() primary key,
  digest_id uuid references digests(id) on delete cascade,
  luma_generation_id text,              -- Luma AI job ID
  video_url text,
  thumbnail_url text,
  status text default 'generating' check (status in ('generating', 'ready', 'failed')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Send logs table
create table if not exists send_logs (
  id uuid default gen_random_uuid() primary key,
  digest_id uuid references digests(id) on delete cascade,
  subscriber_id uuid references subscribers(id) on delete cascade,
  sent_at timestamptz default now(),
  status text default 'sent' check (status in ('sent', 'failed')),
  error_message text
);

-- Indexes
create index if not exists idx_subscribers_status on subscribers(status);
create index if not exists idx_digests_date on digests(date);
create index if not exists idx_videos_digest_id on videos(digest_id);
create index if not exists idx_send_logs_digest_id on send_logs(digest_id);

-- Auto-update updated_at
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger digests_updated_at before update on digests
  for each row execute function update_updated_at();

create trigger videos_updated_at before update on videos
  for each row execute function update_updated_at();
