-- ==============================================================================
-- OfflinePay Nepal — Complete Supabase PostgreSQL Schema
-- Project: https://ffglrijlxmfffkbkuoso.supabase.co
-- Description: Sets up profiles, wallets, devices, transactions, nonces,
--              offline authorizations, security events, RLS policies & seed data.
-- ==============================================================================

-- 1. Enable Required Extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- 2. Helper function to auto-update 'updated_at' timestamp
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- ------------------------------------------------------------------------------
-- 3. PROFILES / USERS TABLE
-- ------------------------------------------------------------------------------
create table if not exists public.profiles (
  id text primary key,
  email text unique,
  phone_number text,
  full_name text not null,
  role text not null default 'user' check (role in ('user', 'merchant', 'admin')),
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profiles is 'Stores user identity, roles, and contact info';

create trigger update_profiles_updated_at
  before update on public.profiles
  for each row execute function public.handle_updated_at();

-- ------------------------------------------------------------------------------
-- 4. WALLETS TABLE
-- ------------------------------------------------------------------------------
create table if not exists public.wallets (
  id text primary key,
  user_id text not null references public.profiles(id) on delete cascade,
  balance numeric(14, 2) not null default 0.00 check (balance >= 0),
  offline_limit numeric(14, 2) not null default 0.00 check (offline_limit >= 0),
  offline_reserve numeric(14, 2) not null default 0.00 check (offline_reserve >= 0),
  currency text not null default 'NPR',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint uq_wallets_user unique (user_id)
);

comment on table public.wallets is 'Tracks total balance, offline spending limits, and reserves';

create trigger update_wallets_updated_at
  before update on public.wallets
  for each row execute function public.handle_updated_at();

-- ------------------------------------------------------------------------------
-- 5. REGISTERED DEVICES & PUBLIC KEYS TABLE
-- ------------------------------------------------------------------------------
create table if not exists public.devices (
  id text primary key,
  user_id text not null references public.profiles(id) on delete cascade,
  device_fingerprint text not null,
  device_name text not null,
  public_key_jwk jsonb not null,
  status text not null default 'ACTIVE' check (status in ('ACTIVE', 'REVOKED', 'SUSPENDED')),
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

comment on table public.devices is 'Cryptographic public keys (ECDSA P-256) per user device';

create index if not exists idx_devices_user_id on public.devices(user_id);
create index if not exists idx_devices_status on public.devices(status);

-- ------------------------------------------------------------------------------
-- 6. OFFLINE AUTHORIZATIONS TABLE
-- ------------------------------------------------------------------------------
create table if not exists public.authorizations (
  id text primary key,
  user_id text not null references public.profiles(id) on delete cascade,
  device_id text references public.devices(id) on delete set null,
  authorized_amount numeric(14, 2) not null check (authorized_amount >= 0),
  remaining_limit numeric(14, 2) not null check (remaining_limit >= 0),
  nonce text not null,
  sequence_counter integer not null default 0,
  status text not null default 'ACTIVE' check (status in ('ACTIVE', 'EXPIRED', 'EXHAUSTED', 'REVOKED')),
  signature text,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

comment on table public.authorizations is 'Cryptographic offline allowances granted while online';

create index if not exists idx_auth_user_id on public.authorizations(user_id);
create index if not exists idx_auth_status on public.authorizations(status);

-- ------------------------------------------------------------------------------
-- 7. TRANSACTIONS / AUDIT LEDGER TABLE
-- ------------------------------------------------------------------------------
create table if not exists public.transactions (
  id text primary key,
  transaction_ref text not null unique,
  sender_id text not null references public.profiles(id) on delete restrict,
  sender_name text not null default '',
  receiver_id text not null references public.profiles(id) on delete restrict,
  receiver_name text not null default '',
  amount numeric(14, 2) not null check (amount > 0),
  type text not null default 'PAYMENT' check (type in ('PAYMENT', 'TRANSFER', 'RESERVE', 'REFUND')),
  payment_type text not null default 'OFFLINE_QR' check (payment_type in ('OFFLINE_QR', 'ONLINE')),
  status text not null default 'SETTLED' check (status in ('PENDING', 'SETTLED', 'FAILED', 'REJECTED')),
  signature text,
  nonce text,
  sequence_counter integer not null default 0,
  offline_auth_id text,
  payload jsonb,
  settled_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

comment on table public.transactions is 'Central ledger of online and reconciled offline transactions';

create index if not exists idx_tx_sender on public.transactions(sender_id);
create index if not exists idx_tx_receiver on public.transactions(receiver_id);
create index if not exists idx_tx_status on public.transactions(status);
create index if not exists idx_tx_created on public.transactions(created_at desc);

-- ------------------------------------------------------------------------------
-- 8. NONCE REGISTRY (ANTI-REPLAY PROTECTION)
-- ------------------------------------------------------------------------------
create table if not exists public.nonces (
  nonce text primary key,
  transaction_id text,
  used_at timestamptz not null default now()
);

comment on table public.nonces is 'Tracks used cryptographic nonces to prevent replay attacks';

-- ------------------------------------------------------------------------------
-- 9. SECURITY AUDIT EVENTS TABLE
-- ------------------------------------------------------------------------------
create table if not exists public.security_events (
  id text primary key,
  user_id text references public.profiles(id) on delete set null,
  device_id text,
  event_type text not null,
  severity text not null default 'LOW' check (severity in ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

comment on table public.security_events is 'Logs tampering, nonce reuse, and cryptographic anomalies';

create index if not exists idx_security_events_user on public.security_events(user_id);
create index if not exists idx_security_events_severity on public.security_events(severity);

-- ==============================================================================
-- 10. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
alter table public.profiles enable row level security;
alter table public.wallets enable row level security;
alter table public.devices enable row level security;
alter table public.authorizations enable row level security;
alter table public.transactions enable row level security;
alter table public.nonces enable row level security;
alter table public.security_events enable row level security;

-- Profiles: Anyone can view user directory (needed for Send Money recipient search)
drop policy if exists "Profiles are publicly viewable" on public.profiles;
create policy "Profiles are publicly viewable"
  on public.profiles for select
  using (true);

drop policy if exists "Profiles can be inserted or updated" on public.profiles;
create policy "Profiles can be inserted or updated"
  on public.profiles for all
  using (true)
  with check (true);

-- Wallets: Full access for demo prototype
drop policy if exists "Wallets full access" on public.wallets;
create policy "Wallets full access"
  on public.wallets for all
  using (true)
  with check (true);

-- Devices: Full access for demo prototype
drop policy if exists "Devices full access" on public.devices;
create policy "Devices full access"
  on public.devices for all
  using (true)
  with check (true);

-- Authorizations: Full access for demo prototype
drop policy if exists "Authorizations full access" on public.authorizations;
create policy "Authorizations full access"
  on public.authorizations for all
  using (true)
  with check (true);

-- Transactions: Full access for demo prototype
drop policy if exists "Transactions full access" on public.transactions;
create policy "Transactions full access"
  on public.transactions for all
  using (true)
  with check (true);

-- Nonces: Full access for anti-replay checks
drop policy if exists "Nonces full access" on public.nonces;
create policy "Nonces full access"
  on public.nonces for all
  using (true)
  with check (true);

-- Security Events: Full access for logging
drop policy if exists "Security events full access" on public.security_events;
create policy "Security events full access"
  on public.security_events for all
  using (true)
  with check (true);

-- ==============================================================================
-- 11. SEED DATA (INITIAL DEMO ACCOUNTS & WALLETS)
-- ==============================================================================
insert into public.profiles (id, email, phone_number, full_name, role)
values
  ('user_anshu_01', 'anshu@offlinepay.local', '+977-9841234567', 'Anshu Tamang', 'user'),
  ('user_demo_02',  'demo@offlinepay.local',  '+977-9800000000', 'Demo User',    'user'),
  ('user_admin_03', 'admin@offlinepay.local', '+977-9811111111', 'Admin User',   'admin')
on conflict (id) do update set
  full_name = excluded.full_name,
  email = excluded.email,
  phone_number = excluded.phone_number,
  role = excluded.role;

insert into public.wallets (id, user_id, balance, offline_limit, offline_reserve, currency)
values
  ('wallet_anshu_01', 'user_anshu_01', 8450.00, 2500.00, 2500.00, 'NPR'),
  ('wallet_demo_02',  'user_demo_02',  5000.00, 1500.00, 1500.00, 'NPR'),
  ('wallet_admin_03', 'user_admin_03', 99999.00, 10000.00, 10000.00, 'NPR')
on conflict (user_id) do update set
  balance = excluded.balance,
  offline_limit = excluded.offline_limit,
  offline_reserve = excluded.offline_reserve;
