-- 0007: auto-create profile on signup + backfill existing users (kills NO_PROFILE dead-ends).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (user_id, name, role)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data->>'name', ''), split_part(new.email, '@', 1)),
    'ARTIST'
  )
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Backfill accounts created before this trigger existed.
insert into public.profiles (user_id, name, role)
select id, coalesce(nullif(raw_user_meta_data->>'name', ''), split_part(email, '@', 1)), 'ARTIST'
from auth.users
on conflict (user_id) do nothing;
