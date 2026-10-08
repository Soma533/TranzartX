-- 0014: message delivery tracking (sent/delivered/read ticks, PRD §18).
alter table messages add column if not exists delivered_at timestamptz;
-- Participants may stamp delivery/read times; content stays participant-gated.
drop policy if exists "participants stamp messages" on messages;
create policy "participants stamp messages" on messages
  for update using (
    exists (
      select 1 from conversation_participants cp
      join profiles p on p.id = cp.profile_id
      where cp.conversation_id = messages.conversation_id and p.user_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from conversation_participants cp
      join profiles p on p.id = cp.profile_id
      where cp.conversation_id = messages.conversation_id and p.user_id = auth.uid()
    )
  );
