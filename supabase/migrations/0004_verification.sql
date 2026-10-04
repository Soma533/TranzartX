-- 0004: verification requests (PRD §27 trust).
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
