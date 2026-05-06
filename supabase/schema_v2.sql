-- ═══════════════════════════════════════════════════════════════
-- SeoulMate v2 — Simplified no-auth realtime schema
-- Run this in Supabase SQL Editor → New Query
-- ═══════════════════════════════════════════════════════════════

-- ── MEMBERS ──────────────────────────────────────────────────
create table if not exists public.members (
  id         text        primary key,
  trip_id    text        not null default 'demo-trip',
  name       text        not null,
  emoji      text        not null default '🐱',
  color      text        not null default 'from-emerald-400 to-teal-500',
  created_at timestamptz default now()
);

-- ── JOURNAL POSTS ─────────────────────────────────────────────
-- One post per member per day (upsert on trip_id+date+member_id)
create table if not exists public.journal_posts (
  id           uuid        primary key default gen_random_uuid(),
  trip_id      text        not null default 'demo-trip',
  date         date        not null,
  member_id    text        not null,
  member_name  text        not null default '',
  member_emoji text        not null default '😊',
  mood         text        not null default '😊',
  text         text,
  photos       jsonb       not null default '[]'::jsonb,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);
create unique index if not exists journal_posts_unique
  on public.journal_posts(trip_id, date, member_id);

-- ── PREPARE ITEMS ─────────────────────────────────────────────
create table if not exists public.prepare_items (
  id         text        primary key,
  trip_id    text        not null default 'demo-trip',
  category   text        not null default 'todo',
  text       text        not null,
  done       boolean     not null default false,
  assignees  jsonb       not null default '[]'::jsonb,
  created_by text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ── WISHLIST ITEMS ────────────────────────────────────────────
create table if not exists public.wishlist_items (
  id         text        primary key,
  trip_id    text        not null default 'demo-trip',
  name       text        not null,
  location   text,
  category   text        not null default 'other',
  photo      text,
  url        text,
  notes      text,
  visited    boolean     not null default false,
  created_by text,
  created_at timestamptz default now()
);

-- ── ACTIVITIES / SCHEDULE ─────────────────────────────────────
create table if not exists public.activities (
  id            text        primary key,
  trip_id       text        not null default 'demo-trip',
  title         text        not null,
  description   text,
  category      text        not null default 'other',
  activity_date date        not null,
  start_time    text,
  end_time      text,
  place_name    text,
  address       text,
  created_by    text,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

-- ── BOOKINGS ─────────────────────────────────────────────────
create table if not exists public.bookings (
  id         text        primary key,
  trip_id    text        not null default 'demo-trip',
  type       text        not null,
  title      text        not null,
  data       jsonb       not null default '{}'::jsonb,
  created_by text,
  created_at timestamptz default now()
);

-- ── EXPENSES ─────────────────────────────────────────────────
create table if not exists public.trip_expenses (
  id           text        primary key,
  trip_id      text        not null default 'demo-trip',
  title        text        not null,
  category     text        not null default 'other',
  amount_krw   numeric     not null,
  amount_myr   numeric,
  exchange_rate numeric,
  paid_by      text        not null,
  expense_date date        not null default current_date,
  splits       jsonb       not null default '[]'::jsonb,
  notes        text,
  created_at   timestamptz default now()
);

-- ── SETTLED DEBTS ────────────────────────────────────────────
create table if not exists public.settled_debts (
  trip_id     text        not null,
  debtor_id   text        not null,
  creditor_id text        not null,
  settled_at  timestamptz default now(),
  primary key (trip_id, debtor_id, creditor_id)
);

-- ── DISABLE RLS (simple friends-only app) ────────────────────
alter table public.members        disable row level security;
alter table public.journal_posts  disable row level security;
alter table public.prepare_items  disable row level security;
alter table public.wishlist_items disable row level security;
alter table public.activities     disable row level security;
alter table public.bookings       disable row level security;
alter table public.trip_expenses  disable row level security;
alter table public.settled_debts  disable row level security;

-- ── ENABLE REALTIME ──────────────────────────────────────────
-- If supabase_realtime publication doesn't include these tables yet:
alter publication supabase_realtime add table public.members;
alter publication supabase_realtime add table public.journal_posts;
alter publication supabase_realtime add table public.prepare_items;
alter publication supabase_realtime add table public.wishlist_items;
alter publication supabase_realtime add table public.activities;
alter publication supabase_realtime add table public.bookings;
alter publication supabase_realtime add table public.trip_expenses;
alter publication supabase_realtime add table public.settled_debts;

-- ── updated_at trigger ────────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

create trigger trg_journal_updated_at
  before update on public.journal_posts
  for each row execute function public.set_updated_at();

create trigger trg_prepare_updated_at
  before update on public.prepare_items
  for each row execute function public.set_updated_at();

create trigger trg_activities_updated_at
  before update on public.activities
  for each row execute function public.set_updated_at();
