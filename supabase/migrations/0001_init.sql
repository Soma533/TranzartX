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
