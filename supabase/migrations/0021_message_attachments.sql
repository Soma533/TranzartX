-- 0021: message attachments — pictures, voice notes and files (PRD §18).

alter table messages add column if not exists attachment_url text;
alter table messages add column if not exists attachment_type text;      -- image | audio | file
alter table messages add column if not exists attachment_name text;
alter table messages add column if not exists attachment_size int;
alter table messages add column if not exists attachment_duration_ms int;

create index if not exists messages_attachment_idx on messages (conversation_id) where attachment_url is not null;

-- Public bucket for message media, mirroring how artworks are served.
insert into storage.buckets (id, name, public)
values ('messages', 'messages', true)
on conflict (id) do nothing;

-- Any signed-in member may post into the bucket; public read matches the
-- public bucket flag so recipients can load what was sent to them.
drop policy if exists "authenticated post messages" on storage.objects;
create policy "authenticated post messages" on storage.objects
  for insert to authenticated with check (bucket_id = 'messages');

drop policy if exists "public read messages" on storage.objects;
create policy "public read messages" on storage.objects
  for select using (bucket_id = 'messages');