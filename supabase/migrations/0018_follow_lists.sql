-- 0018: followers / following lists.
-- Previously only the two parties in a follow could read the row, which made
-- it impossible to show "N followers" on anyone's public profile. Follow rows
-- hold ids only (no private content), so they are readable like any public
-- profile. Unfollowing still requires being the follower (0011 policy).

-- Both names are dropped first so this file is safe to run more than once —
-- re-running against a database that already has the policy would otherwise
-- fail with 42710 "policy already exists".
drop policy if exists "parties read follows" on follows;
drop policy if exists "public read follows" on follows;
create policy "public read follows" on follows for select using (true);

create index if not exists follows_following_idx on follows (following_id);
create index if not exists follows_follower_idx on follows (follower_id);