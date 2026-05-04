-- ═══════════════════════════════════════════════════════════════════════════════
-- SeoulMate — Supabase Schema
-- Run this in Supabase SQL Editor → New Query
-- ═══════════════════════════════════════════════════════════════════════════════

-- Enable UUID extension
create extension if not exists "uuid-ossp";
create extension if not exists "pg_trgm";    -- for fuzzy-search on activities


-- ─── PROFILES ────────────────────────────────────────────────────────────────
-- Extends auth.users with display info and last known location.
create table public.profiles (
  id            uuid        primary key references auth.users(id) on delete cascade,
  display_name  text        not null,
  avatar_url    text,
  phone         text,
  -- last check-in (lat/lng stored as simple decimals for Leaflet)
  last_lat      numeric(10,7),
  last_lng      numeric(10,7),
  last_checkin  timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Profiles are viewable by trip members"
  on public.profiles for select
  using (true);                          -- public within app; tighten per trip if needed

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);


-- ─── TRIPS ───────────────────────────────────────────────────────────────────
create table public.trips (
  id            uuid        primary key default uuid_generate_v4(),
  name          text        not null,
  destination   text        not null default 'Seoul, South Korea',
  start_date    date        not null,
  end_date      date        not null,
  cover_url     text,
  base_currency text        not null default 'MYR',   -- home currency
  trip_currency text        not null default 'KRW',   -- local currency
  invite_code   text        unique default upper(substring(md5(random()::text), 1, 8)),
  created_by    uuid        references public.profiles(id),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

alter table public.trips enable row level security;

-- ─── TRIP MEMBERS ────────────────────────────────────────────────────────────
create table public.trip_members (
  trip_id    uuid references public.trips(id)    on delete cascade,
  user_id    uuid references public.profiles(id) on delete cascade,
  role       text not null default 'member'      check (role in ('admin','member')),
  joined_at  timestamptz not null default now(),
  primary key (trip_id, user_id)
);

alter table public.trip_members enable row level security;

create policy "Trip members can view their trips"
  on public.trips for select
  using (
    id in (
      select trip_id from public.trip_members where user_id = auth.uid()
    )
  );

create policy "Trip admins can update their trip"
  on public.trips for update
  using (
    id in (
      select trip_id from public.trip_members
      where user_id = auth.uid() and role = 'admin'
    )
  );

create policy "Members can view trip_members of their trips"
  on public.trip_members for select
  using (
    trip_id in (
      select trip_id from public.trip_members where user_id = auth.uid()
    )
  );


-- ─── SCHEDULES ───────────────────────────────────────────────────────────────
create type public.activity_category as enum (
  'transport', 'food', 'attraction', 'accommodation', 'shopping', 'other'
);

create table public.schedules (
  id              uuid        primary key default uuid_generate_v4(),
  trip_id         uuid        not null references public.trips(id) on delete cascade,
  title           text        not null,
  description     text,
  category        public.activity_category not null default 'other',
  activity_date   date        not null,
  start_time      time,
  end_time        time,
  -- location
  place_name      text,
  address         text,
  lat             numeric(10,7),
  lng             numeric(10,7),
  naver_place_id  text,       -- used to build navermap:// deep link
  kakao_place_id  text,       -- fallback kakao deep link
  -- meta
  created_by      uuid        references public.profiles(id),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

alter table public.schedules enable row level security;

create policy "Trip members can view schedules"
  on public.schedules for select
  using (
    trip_id in (
      select trip_id from public.trip_members where user_id = auth.uid()
    )
  );

create policy "Trip members can insert schedules"
  on public.schedules for insert
  with check (
    trip_id in (
      select trip_id from public.trip_members where user_id = auth.uid()
    )
  );

create policy "Schedule creator can update/delete"
  on public.schedules for all
  using (created_by = auth.uid());

-- Index for fast date-range queries (timeline view)
create index schedules_trip_date_idx on public.schedules(trip_id, activity_date, start_time);


-- ─── EXPENSES ────────────────────────────────────────────────────────────────
create type public.expense_category as enum (
  'food', 'transport', 'accommodation', 'shopping',
  'entertainment', 'health', 'other'
);

create table public.expenses (
  id              uuid        primary key default uuid_generate_v4(),
  trip_id         uuid        not null references public.trips(id) on delete cascade,
  schedule_id     uuid        references public.schedules(id) on delete set null,
  title           text        not null,
  category        public.expense_category not null default 'other',
  amount_krw      numeric(14,2) not null,        -- always stored in KRW
  amount_myr      numeric(14,4),                 -- cached conversion
  exchange_rate   numeric(14,6),                 -- rate used at time of entry
  paid_by         uuid        not null references public.profiles(id),
  receipt_url     text,                          -- Supabase Storage path
  notes           text,
  expense_date    date        not null default current_date,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- Participants (who shares the expense)
create table public.expense_splits (
  id              uuid        primary key default uuid_generate_v4(),
  expense_id      uuid        not null references public.expenses(id) on delete cascade,
  user_id         uuid        not null references public.profiles(id) on delete cascade,
  share_krw       numeric(14,2) not null,        -- their portion in KRW
  share_myr       numeric(14,4),
  is_settled      boolean     not null default false,
  settled_at      timestamptz,
  unique(expense_id, user_id)
);

alter table public.expenses enable row level security;
alter table public.expense_splits enable row level security;

create policy "Trip members can view expenses"
  on public.expenses for select
  using (
    trip_id in (
      select trip_id from public.trip_members where user_id = auth.uid()
    )
  );

create policy "Trip members can insert expenses"
  on public.expenses for insert
  with check (
    trip_id in (
      select trip_id from public.trip_members where user_id = auth.uid()
    )
  );

create policy "Expense creator can update/delete"
  on public.expenses for all
  using (paid_by = auth.uid());

create policy "Trip members can view splits"
  on public.expense_splits for select
  using (
    expense_id in (
      select e.id from public.expenses e
      join public.trip_members tm on tm.trip_id = e.trip_id
      where tm.user_id = auth.uid()
    )
  );

create policy "Expense owner can manage splits"
  on public.expense_splits for all
  using (
    expense_id in (
      select id from public.expenses where paid_by = auth.uid()
    )
  );

-- Indexes for expense queries
create index expenses_trip_idx      on public.expenses(trip_id, expense_date);
create index expense_splits_exp_idx on public.expense_splits(expense_id);
create index expense_splits_usr_idx on public.expense_splits(user_id);


-- ─── CHECK-INS (Social Map) ──────────────────────────────────────────────────
create table public.checkins (
  id          uuid        primary key default uuid_generate_v4(),
  trip_id     uuid        not null references public.trips(id) on delete cascade,
  user_id     uuid        not null references public.profiles(id) on delete cascade,
  lat         numeric(10,7) not null,
  lng         numeric(10,7) not null,
  place_name  text,
  note        text,
  created_at  timestamptz not null default now()
);

alter table public.checkins enable row level security;

create policy "Trip members can view checkins"
  on public.checkins for select
  using (
    trip_id in (
      select trip_id from public.trip_members where user_id = auth.uid()
    )
  );

create policy "Users can insert own checkins"
  on public.checkins for insert
  with check (user_id = auth.uid());


-- ─── REALTIME — enable for live expense + checkin updates ─────────────────
-- Run in Supabase Dashboard → Database → Replication → Tables
-- Or via SQL:
alter publication supabase_realtime add table public.expenses;
alter publication supabase_realtime add table public.expense_splits;
alter publication supabase_realtime add table public.checkins;
alter publication supabase_realtime add table public.profiles;


-- ─── TRIGGERS — updated_at auto-update ────────────────────────────────────
create or replace function public.handle_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_profiles_updated_at
  before update on public.profiles
  for each row execute function public.handle_updated_at();

create trigger trg_trips_updated_at
  before update on public.trips
  for each row execute function public.handle_updated_at();

create trigger trg_schedules_updated_at
  before update on public.schedules
  for each row execute function public.handle_updated_at();

create trigger trg_expenses_updated_at
  before update on public.expenses
  for each row execute function public.handle_updated_at();


-- ─── TRIGGER — new user → profile row ────────────────────────────────────
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$;

create trigger trg_on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


-- ─── STORAGE — receipts bucket ────────────────────────────────────────────
-- Create via Dashboard → Storage or:
insert into storage.buckets (id, name, public)
values ('receipts', 'receipts', false)
on conflict do nothing;

create policy "Authenticated users can upload receipts"
  on storage.objects for insert
  with check (bucket_id = 'receipts' and auth.role() = 'authenticated');

create policy "Trip members can view receipts"
  on storage.objects for select
  using (bucket_id = 'receipts' and auth.role() = 'authenticated');


-- ═══════════════════════════════════════════════════════════════════════════════
-- VIEWS
-- ═══════════════════════════════════════════════════════════════════════════════

-- Debt matrix view: how much A owes B across all unsettled splits
create or replace view public.debt_summary as
select
  es.user_id          as debtor_id,
  e.paid_by           as creditor_id,
  e.trip_id,
  sum(es.share_krw)   as total_owes_krw,
  sum(es.share_myr)   as total_owes_myr
from public.expense_splits es
join public.expenses e on e.id = es.expense_id
where es.is_settled = false
  and es.user_id != e.paid_by   -- exclude the payer from their own split
group by es.user_id, e.paid_by, e.trip_id;

-- Trip totals
create or replace view public.trip_totals as
select
  trip_id,
  count(*)            as expense_count,
  sum(amount_krw)     as total_krw,
  sum(amount_myr)     as total_myr
from public.expenses
group by trip_id;
