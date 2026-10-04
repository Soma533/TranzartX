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
