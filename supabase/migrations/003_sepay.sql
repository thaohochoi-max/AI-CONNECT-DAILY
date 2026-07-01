-- SePay integration: thêm cột vào subscribers

alter table subscribers
  add column if not exists plan text default 'starter'
    check (plan in ('starter', 'popular', 'yearly')),
  add column if not exists order_code text unique,
  add column if not exists paid_at timestamptz,
  add column if not exists sepay_ref text,
  add column if not exists amount_paid integer;

-- Thêm trạng thái pending cho subscribers
alter table subscribers
  drop constraint if exists subscribers_status_check;

alter table subscribers
  add constraint subscribers_status_check
    check (status in ('pending', 'active', 'unsubscribed'));

-- Index để tìm nhanh theo order_code
create index if not exists idx_subscribers_order_code on subscribers(order_code);
create index if not exists idx_subscribers_plan on subscribers(plan);
