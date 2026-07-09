alter table public.profiles
  add column if not exists username text;

create unique index if not exists profiles_username_lower_key
  on public.profiles (lower(username))
  where username is not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_username_format'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
      add constraint profiles_username_format
      check (username is null or username ~ '^[a-z0-9_]{3,24}$');
  end if;
end $$;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$
declare
  normalized_username text := lower(nullif(new.raw_user_meta_data->>'username', ''));
begin
  insert into public.profiles (id, username, display_name)
  values (
    new.id,
    normalized_username,
    coalesce(
      nullif(new.raw_user_meta_data->>'display_name', ''),
      normalized_username,
      split_part(new.email, '@', 1)
    )
  )
  on conflict (id) do update set
    username = coalesce(public.profiles.username, excluded.username),
    display_name = coalesce(public.profiles.display_name, excluded.display_name),
    updated_at = now();

  return new;
end;
$$;
