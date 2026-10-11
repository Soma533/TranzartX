-- 0019: explicit onboarding completion flag.
-- The landing rule previously inferred "never onboarded" from a low
-- completeness score, which re-prompted users who saved only their name.
alter table profiles add column if not exists onboarding_completed_at timestamptz;

-- Members who already have profile content are treated as onboarded.
update profiles
set onboarding_completed_at = now()
where onboarding_completed_at is null
  and (bio is not null or statement is not null or array_length(disciplines, 1) > 0);