-- 0017: threaded replies — a message can point at the one it answers.
alter table messages add column if not exists reply_to_id uuid references messages(id) on delete set null;
create index if not exists messages_reply_to_idx on messages (reply_to_id);