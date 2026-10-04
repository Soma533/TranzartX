-- 0003: collector saves + notification preferences (PRD §24/§25).
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
