-- 0009: honor signup role choice. The signup form stores `role` in the user's
-- metadata; the trigger whitelists it (invalid values fall back to ARTIST so
-- signup can never fail on a bad role).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  chosen text := coalesce(nullif(new.raw_user_meta_data->>'role', ''), 'ARTIST');
begin
  if chosen not in ('ARTIST', 'COLLECTOR', 'GALLERY', 'CURATOR', 'ORG', 'AESTHETE') then
    chosen := 'ARTIST';
  end if;
  insert into public.profiles (user_id, name, role)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data->>'name', ''), split_part(new.email, '@', 1)),
    chosen::user_role
  )
  on conflict (user_id) do nothing;
  return new;
end;
$$;
