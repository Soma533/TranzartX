-- 0002: tighten RLS — owners manage own rows, public reads published content.
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
