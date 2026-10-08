-- 0013: messaging RLS reset. The parent-row policy on conversations denied the
-- very insert that creates them (RLS evaluates before participants exist),
-- and partial application left mixed states. Link tables carry no content —
-- all readable content stays gated by the message-level participant policies.
-- This migration is self-contained: run it alone even if 0010 never applied.

alter table conversations disable row level security;
alter table conversation_participants disable row level security;

drop policy if exists "participants read messages" on messages;
create policy "participants read messages" on messages for select using (
  exists (
    select 1 from conversation_participants cp
    join profiles p on p.id = cp.profile_id
    where cp.conversation_id = messages.conversation_id and p.user_id = auth.uid()
  )
);
drop policy if exists "participants send messages" on messages;
create policy "participants send messages" on messages for insert with check (
  exists (select 1 from profiles p where p.id = messages.sender_id and p.user_id = auth.uid())
  and exists (
    select 1 from conversation_participants cp
    join profiles p on p.id = cp.profile_id
    where cp.conversation_id = messages.conversation_id and p.user_id = auth.uid()
  )
);
