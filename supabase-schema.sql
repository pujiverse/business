-- BizManager Lite — database schema
-- Paste this whole file into Supabase ▸ SQL Editor ▸ New query, then click Run.
-- It is safe to run more than once: every CREATE uses IF NOT EXISTS.

create table if not exists customers (
  id          bigserial primary key,
  name        text not null,
  phone       text,
  address     text,
  status      text not null default 'Active' check (status in ('Active','Inactive')),
  created_at  timestamptz not null default now()
);

create table if not exists customer_transactions (
  id           bigserial primary key,
  customer_id  bigint not null references customers(id) on delete cascade,
  date         date not null default current_date,
  amount       numeric(14,2) not null,
  description  text,
  type         text not null check (type in ('Given','Received'))
);

create table if not exists expenses (
  id            bigserial primary key,
  expense_date  date not null default current_date,
  description   text not null,
  category      text,
  amount        numeric(14,2) not null,
  type          text not null check (type in ('Income','Expense'))
);

create table if not exists loans (
  id               bigserial primary key,
  name             text not null,
  principal        numeric(14,2) not null,
  interest_rate    numeric(5,2) default 0,
  duration_months  int default 0,
  type             text not null check (type in ('Taken','Given')),
  status           text not null default 'Active' check (status in ('Active','Paid Off')),
  created_at       timestamptz not null default now()
);

create table if not exists loan_transactions (
  id           bigserial primary key,
  loan_id      bigint not null references loans(id) on delete cascade,
  date         date not null default current_date,
  amount       numeric(14,2) not null,
  description  text,
  type         text not null check (type in ('Payment','Disbursement'))
);

-- Row Level Security: open to anon (single-user app, your Supabase anon key controls access).
-- If you ever want multi-user, replace these with auth.uid() based policies.
alter table customers              enable row level security;
alter table customer_transactions  enable row level security;
alter table expenses               enable row level security;
alter table loans                  enable row level security;
alter table loan_transactions      enable row level security;

do $$
declare t text;
begin
  for t in select unnest(array[
    'customers','customer_transactions','expenses','loans','loan_transactions'
  ]) loop
    execute format(
      'drop policy if exists "anon_all_%1$s" on %1$I;
       create policy "anon_all_%1$s" on %1$I for all using (true) with check (true);',
      t);
  end loop;
end $$;
