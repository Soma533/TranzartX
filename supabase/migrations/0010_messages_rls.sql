-- 0010: row security for messaging (PRD §18). Previously messages had RLS
-- enabled with no policies (deny-all: nothing could send or read), while
-- conversations/participants had none at all (world-readable). Now:
-- participants-only reads, sender-own writes.

alter table conversations enable row level security;
alter table conversation_participants enable row level security;

-- CONVERSATIONS: participants read; any signed-in user can start one.
drop policy if exists "participants read conversations" on conversations;
create policy "participants read conversations" on conversations for select using (
  exists (
    select 1 from conversation_participants cp
    join profiles p on p.id = cp.profile_id
    where cp.conversation_id = conversations.id and p.user_id = auth.uid()
  )
);
drop policy if exists "signed-in start conversations" on conversations;
create policy "signed-in start conversations" on conversations
  for insert with check (auth.uid() is not null);

-- PARTICIPANTS: see rows in own conversations; signed-in users may add rows
-- (needed to add the other party when starting; reads stay participant-only).
drop policy if exists "participants read participants" on conversation_participants;
create policy "participants read participants" on conversation_participants for select using (
  exists (
    select 1 from conversation_participants mine
    join profiles p on p.id = mine.profile_id
    where mine.conversation_id = conversation_participants.conversation_id
      and p.user_id = auth.uid()
  )
);
drop policy if exists "signed-in add participants" on conversation_participants;
create policy "signed-in add participants" on conversation_participants
  for insert with check (auth.uid() is not null);

-- MESSAGES: participants read; sender must be own profile in the conversation.
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
