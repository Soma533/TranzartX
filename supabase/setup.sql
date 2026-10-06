-- TranzartX full setup: paste the WHOLE file into Supabase SQL Editor and Run once.

-- ================= supabase/migrations/0001_init.sql =================
-- TranzartX initial schema (Supabase Postgres + RLS)
create extension if not exists "uuid-ossp";

do $$ begin
  create type user_role as enum ('ARTIST','COLLECTOR','GALLERY','CURATOR','ORG','ADMIN');
exception when duplicate_object then null; end $$;

do $$ begin
  create type goal_type as enum ('FIRST_EXHIBITION','FIND_GALLERY','FIRST_SALE','INCREASE_SALES','FIND_COLLECTORS','COMMISSIONS','COLLABS','PORTFOLIO','INTERNATIONAL','NETWORK');
exception when duplicate_object then null; end $$;

do $$ begin
  create type opp_type as enum ('EXHIBITION','OPEN_CALL','RESIDENCY','GRANT','COMPETITION','COMMISSION','FELLOWSHIP','WORKSHOP','FAIR','GALLERY');
exception when duplicate_object then null; end $$;

do $$ begin
  create type track_status as enum ('SAVED','CONSIDERING','PREPARING','APPLIED','CONTACTED','ACCEPTED','REJECTED','COMPLETED');
exception when duplicate_object then null; end $$;

create table if not exists profiles (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  role user_role not null default 'ARTIST',
  name text not null,
  location_country text, location_city text, avatar_url text,
  disciplines text[] not null default '{}',
  mediums text[] not null default '{}',
  styles text[] not null default '{}',
  bio text, statement text, short_desc text,
  career_stage text, commission_open boolean not null default false,
  profile_completeness int not null default 20,
  is_verified boolean not null default false,
  created_at timestamptz default now(), updated_at timestamptz default now()
);

create table if not exists career_goals (
  id uuid primary key default uuid_generate_v4(),
  profile_id uuid not null references profiles(id) on delete cascade,
  goal_type goal_type not null,
  is_primary boolean default false,
  status text default 'ACTIVE',
  progress_pct int default 0,
  created_at timestamptz default now()
);

create table if not exists roadmap_items (
  id uuid primary key default uuid_generate_v4(),
  goal_id uuid not null references career_goals(id) on delete cascade,
  title text not null, description text,
  sort_order int default 0, status text default 'TODO',
  created_at timestamptz default now()
);

create table if not exists collections (
  id uuid primary key default uuid_generate_v4(),
  artist_id uuid not null references profiles(id) on delete cascade,
  title text not null, description text, cover_url text,
  created_at timestamptz default now()
);

create table if not exists artworks (
  id uuid primary key default uuid_generate_v4(),
  artist_id uuid not null references profiles(id) on delete cascade,
  collection_id uuid references collections(id) on delete set null,
  title text not null, description text, image_url text not null,
  medium text, dimensions text, year int, category text,
  price_cents int, currency text default 'NGN',
  availability text default 'AVAILABLE',
  views_count int default 0,
  created_at timestamptz default now()
);

create table if not exists opportunities (
  id uuid primary key default uuid_generate_v4(),
  org_id uuid not null references profiles(id) on delete cascade,
  type opp_type not null, title text not null, description text not null,
  location text, deadline timestamptz,
  disciplines text[] default '{}', eligibility jsonb default '{}',
  created_at timestamptz default now()
);

create table if not exists opportunity_tracking (
  artist_id uuid not null references profiles(id) on delete cascade,
  opportunity_id uuid not null references opportunities(id) on delete cascade,
  status track_status default 'SAVED',
  created_at timestamptz default now(),
  primary key (artist_id, opportunity_id)
);

create table if not exists follows (
  follower_id uuid not null references profiles(id) on delete cascade,
  following_id uuid not null references profiles(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (follower_id, following_id)
);

create table if not exists connections (
  id uuid primary key default uuid_generate_v4(),
  requester_id uuid not null references profiles(id) on delete cascade,
  receiver_id uuid not null references profiles(id) on delete cascade,
  status text default 'PENDING',
  created_at timestamptz default now()
);

create table if not exists conversations (
  id uuid primary key default uuid_generate_v4(),
  created_at timestamptz default now()
);
create table if not exists conversation_participants (
  conversation_id uuid references conversations(id) on delete cascade,
  profile_id uuid references profiles(id) on delete cascade,
  primary key (conversation_id, profile_id)
);
create table if not exists messages (
  id uuid primary key default uuid_generate_v4(),
  conversation_id uuid not null references conversations(id) on delete cascade,
  sender_id uuid not null references profiles(id) on delete cascade,
  body text not null, artwork_id uuid references artworks(id) on delete set null,
  read_at timestamptz, created_at timestamptz default now()
);

create table if not exists inquiries (
  id uuid primary key default uuid_generate_v4(),
  artwork_id uuid not null references artworks(id) on delete cascade,
  from_id uuid not null references profiles(id) on delete cascade,
  to_artist_id uuid not null references profiles(id) on delete cascade,
  message text not null, status text default 'OPEN',
  created_at timestamptz default now()
);

create table if not exists transactions (
  id uuid primary key default uuid_generate_v4(),
  artwork_id uuid not null references artworks(id),
  buyer_id uuid not null references profiles(id),
  artist_id uuid not null references profiles(id),
  flutterwave_tx_ref text unique not null,
  flutterwave_flw_ref text, amount_cents int not null, currency text not null,
  status text default 'PENDING', verified_at timestamptz,
  created_at timestamptz default now()
);

create table if not exists notifications (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null, title text not null, body text, link text,
  read_at timestamptz, created_at timestamptz default now()
);

create table if not exists analytics_events (
  id uuid primary key default uuid_generate_v4(),
  actor_id uuid references profiles(id) on delete set null,
  event text not null, target_id text, metadata jsonb default '{}',
  created_at timestamptz default now()
);

alter table profiles enable row level security;
alter table artworks enable row level security;
alter table opportunities enable row level security;
alter table opportunity_tracking enable row level security;
alter table messages enable row level security;

-- Permissive MVP policies (tighten per-feature with auth.uid() checks in follow-up)
drop policy if exists "public read profiles" on profiles;
create policy "public read profiles" on profiles for select using (true);
drop policy if exists "public read artworks" on artworks;
create policy "public read artworks" on artworks for select using (true);
drop policy if exists "public read opportunities" on opportunities;
create policy "public read opportunities" on opportunities for select using (true);

-- ================= supabase/migrations/0002_rls.sql =================
-- 0002: tighten RLS â€” owners manage own rows, public reads published content.
-- Requires: auth.uid() mapped via profiles.user_id.

-- Helper: is owner of profile row
create or replace function is_profile_owner(p_user_id uuid) returns boolean
language sql stable as $$ select exists (select 1 from profiles where user_id = p_user_id and user_id = auth.uid()) $$;

-- ARTWORKS: owners insert/update/delete own; public select available
drop policy if exists "public read artworks" on artworks;
create policy "public read artworks" on artworks for select using (true);
drop policy if exists "owners manage artworks" on artworks;
create policy "owners manage artworks" on artworks for all using (
  exists (select 1 from profiles p where p.id = artworks.artist_id and p.user_id = auth.uid())
) with check (
  exists (select 1 from profiles p where p.id = artworks.artist_id and p.user_id = auth.uid())
);

-- PROFILES: public read; owners update own
drop policy if exists "public read profiles" on profiles;
create policy "public read profiles" on profiles for select using (true);
drop policy if exists "owners update profiles" on profiles;
create policy "owners update profiles" on profiles for update using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "owners insert profiles" on profiles;
create policy "owners insert profiles" on profiles for insert with check (user_id = auth.uid());

-- OPPORTUNITIES: public read; org owners manage
drop policy if exists "public read opportunities" on opportunities;
create policy "public read opportunities" on opportunities for select using (true);
drop policy if exists "orgs manage opportunities" on opportunities;
create policy "orgs manage opportunities" on opportunities for all using (
  exists (select 1 from profiles p where p.id = opportunities.org_id and p.user_id = auth.uid())
) with check (
  exists (select 1 from profiles p where p.id = opportunities.org_id and p.user_id = auth.uid())
);

-- TRACKING: artists manage own rows
drop policy if exists "owners manage tracking" on opportunity_tracking;
create policy "owners manage tracking" on opportunity_tracking for all using (
  exists (select 1 from profiles p where p.id = opportunity_tracking.artist_id and p.user_id = auth.uid())
) with check (
  exists (select 1 from profiles p where p.id = opportunity_tracking.artist_id and p.user_id = auth.uid())
);

-- MESSAGES: participants only (enforced primarily in API; RLS as backstop deny-by-default)
-- Storage buckets (create via dashboard or SQL):
-- insert into storage.buckets (id, name, public) values ('artworks','artworks', true), ('avatars','avatars', true)
-- on conflict (id) do nothing;

-- ================= supabase/migrations/0003_saves.sql =================
-- 0003: collector saves + notification preferences (PRD Â§24/Â§25).
create table if not exists saved_artworks (
  collector_id uuid not null references profiles(id) on delete cascade,
  artwork_id uuid not null references artworks(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (collector_id, artwork_id)
);
alter table saved_artworks enable row level security;
drop policy if exists "owners manage saves" on saved_artworks;
create policy "owners manage saves" on saved_artworks for all using (
  exists (select 1 from profiles p where p.id = saved_artworks.collector_id and p.user_id = auth.uid())
) with check (
  exists (select 1 from profiles p where p.id = saved_artworks.collector_id and p.user_id = auth.uid())
);

alter table profiles add column if not exists notify_matches boolean default true;
alter table profiles add column if not exists notify_saves boolean default true;
alter table profiles add column if not exists notify_deadlines boolean default true;
alter table profiles add column if not exists collaboration_types text[] default '{}';

-- ================= supabase/migrations/0004_verification.sql =================
-- 0004: verification requests (PRD Â§27 trust).
-- Artists request verification; an ADMIN approves/rejects via API.
-- Make a user admin in the dashboard: update profiles set role='ADMIN' where ...

create table if not exists verification_requests (
  id uuid primary key default uuid_generate_v4(),
  profile_id uuid not null references profiles(id) on delete cascade,
  kind text not null default 'IDENTITY',
  evidence text,
  status text not null default 'PENDING',
  reviewed_by uuid references profiles(id) on delete set null,
  created_at timestamptz default now()
);

alter table verification_requests enable row level security;
drop policy if exists "owners manage verification" on verification_requests;
create policy "owners manage verification" on verification_requests for all using (
  exists (select 1 from profiles p where p.id = verification_requests.profile_id and p.user_id = auth.uid())
) with check (
  exists (select 1 from profiles p where p.id = verification_requests.profile_id and p.user_id = auth.uid())
);

-- ================= supabase/migrations/0005_storage.sql =================
-- 0005: storage buckets + policies for artwork/avatar uploads.
-- Run AFTER creating the project. Public read, authenticated write.

insert into storage.buckets (id, name, public)
values ('artworks', 'artworks', true), ('avatars', 'avatars', true)
on conflict (id) do nothing;

drop policy if exists "public read uploads" on storage.objects;
create policy "public read uploads" on storage.objects
  for select using (bucket_id in ('artworks', 'avatars'));

drop policy if exists "authenticated insert uploads" on storage.objects;
create policy "authenticated insert uploads" on storage.objects
  for insert with check (bucket_id in ('artworks', 'avatars') and auth.role() = 'authenticated');

drop policy if exists "authenticated update uploads" on storage.objects;
create policy "authenticated update uploads" on storage.objects
  for update using (bucket_id in ('artworks', 'avatars') and auth.role() = 'authenticated')
  with check (bucket_id in ('artworks', 'avatars'));

drop policy if exists "authenticated delete uploads" on storage.objects;
create policy "authenticated delete uploads" on storage.objects
  for delete using (bucket_id in ('artworks', 'avatars') and auth.role() = 'authenticated');


-- ================= supabase/migrations/0006_paystack.sql =================
-- 0006: multi-provider payments (Paystack). Existing rows stay FLUTTERWAVE.
alter table transactions add column if not exists provider text not null default 'FLUTTERWAVE';
alter table transactions add column if not exists gateway_ref text;
update transactions set gateway_ref = flutterwave_tx_ref where gateway_ref is null;
drop index if exists transactions_gateway_ref_key;
create unique index transactions_gateway_ref_key on transactions (gateway_ref);


-- ================= supabase/migrations/0007_profiles_trigger.sql =================
-- 0007: auto-create profile on signup + backfill existing users (kills NO_PROFILE dead-ends).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (user_id, name, role)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data->>'name', ''), split_part(new.email, '@', 1)),
    'ARTIST'
  )
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Backfill accounts created before this trigger existed.
insert into public.profiles (user_id, name, role)
select id, coalesce(nullif(raw_user_meta_data->>'name', ''), split_part(email, '@', 1)), 'ARTIST'
from auth.users
on conflict (user_id) do nothing;

