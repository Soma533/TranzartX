-- 0020: existing members are not "new signups".
-- 0019 only backfilled profiles that had a bio/statement/discipline, so members
-- who registered but never filled those in were re-prompted to set up their
-- profile on every sign-in. Everyone who already exists has already onboarded
-- (or never will) — stop nagging them.
update profiles
set onboarding_completed_at = now()
where onboarding_completed_at is null;