-- 0012: notifications remember their actor so inboxes can offer follow-back/reply.
alter table notifications add column if not exists actor_id uuid references profiles(id) on delete set null;
create index if not exists notifications_actor_idx on notifications (actor_id);
create index if not exists notifications_user_unread_idx on notifications (user_id) where read_at is null;
drop policy if exists "owners update notifications" on notifications;
create policy "owners update notifications" on notifications
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());
