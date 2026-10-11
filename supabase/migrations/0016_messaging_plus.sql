-- 0016: messaging upgrades — edit, delete, forward, unread tracking, presence.
-- All additive; existing messages and conversations keep working untouched.

-- EDIT / DELETE / FORWARD
alter table messages add column if not exists edited_at timestamptz;
alter table messages add column if not exists deleted_at timestamptz;
alter table messages add column if not exists forwarded_from uuid references messages(id) on delete set null;

-- CONVERSATION ORDERING (newest activity first) + UNREAD
alter table conversations add column if not exists last_message_at timestamptz default now();
alter table conversation_participants add column if not exists last_read_at timestamptz;

-- LAST SEEN (online status is realtime presence, not stored)
alter table profiles add column if not exists last_seen_at timestamptz;

-- Backfill ordering from existing history so the inbox is correct immediately.
update conversations c
set last_message_at = coalesce(
  (select max(m.created_at) from messages m where m.conversation_id = c.id),
  c.created_at
)
where c.last_message_at is null or c.last_message_at = c.created_at;

update conversation_participants cp
set last_read_at = coalesce(
  (select max(m.read_at) from messages m
   where m.conversation_id = cp.conversation_id and m.sender_id <> cp.profile_id and m.read_at is not null),
  (select max(m.created_at) from messages m where m.conversation_id = cp.conversation_id),
  (select c.created_at from conversations c where c.id = cp.conversation_id)
);

-- IMMUTABILITY: a participant may stamp read/delivered times on any message in a
-- shared conversation, but only the author may rewrite the body or delete it.
-- RLS alone cannot restrict which columns an UPDATE may touch, so guard here.
-- auth.uid() is null for service-role writes (cron, webhooks) — always allowed.
create or replace function enforce_message_authorship() returns trigger as $$
begin
  if auth.uid() is null then
    return new;
  end if;

  if new.sender_id is distinct from old.sender_id then
    raise exception 'sender_id is immutable';
  end if;

  if (new.body is distinct from old.body)
     and not exists (select 1 from profiles p where p.id = old.sender_id and p.user_id = auth.uid()) then
    raise exception 'Only the sender can edit a message';
  end if;

  if (new.deleted_at is distinct from old.deleted_at)
     and not exists (select 1 from profiles p where p.id = old.sender_id and p.user_id = auth.uid()) then
    raise exception 'Only the sender can delete a message';
  end if;

  return new;
end;
$$ language plpgsql;

drop trigger if exists message_authorship on messages;
create trigger message_authorship before update on messages
for each row execute function enforce_message_authorship();