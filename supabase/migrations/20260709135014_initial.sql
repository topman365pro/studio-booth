create extension if not exists "pgcrypto";

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  preferences jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.frame_templates (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users(id) on delete cascade,
  visibility text not null check (visibility in ('curated', 'private')) default 'private',
  title text not null check (char_length(title) between 1 and 80),
  category text not null default 'Custom',
  background text not null default '#111111',
  foreground text not null default '#ffffff',
  canvas_width integer not null check (canvas_width between 320 and 4000),
  canvas_height integer not null check (canvas_height between 320 and 5000),
  shot_count integer not null check (shot_count between 1 and 8),
  slots jsonb not null,
  overlay_path text,
  thumbnail_path text,
  created_at timestamptz not null default now(),
  constraint private_frames_have_owner check (
    (visibility = 'private' and owner_id is not null) or visibility = 'curated'
  )
);

create table public.photo_sessions (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  frame_template_id text,
  title text not null check (char_length(title) between 1 and 120),
  export_metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.exports (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.photo_sessions(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  format text not null check (format in ('png', 'jpeg', 'gif', 'webm')),
  storage_path text not null unique,
  width integer not null check (width > 0),
  height integer not null check (height > 0),
  byte_size bigint not null check (byte_size > 0),
  duration_ms integer,
  created_at timestamptz not null default now()
);

create index photo_sessions_owner_created_idx on public.photo_sessions(owner_id, created_at desc);
create index exports_session_idx on public.exports(session_id);
create index frame_templates_owner_idx on public.frame_templates(owner_id);

alter table public.profiles enable row level security;
alter table public.frame_templates enable row level security;
alter table public.photo_sessions enable row level security;
alter table public.exports enable row level security;

create policy "profiles_select_own" on public.profiles for select using (auth.uid() = id);
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id);
create policy "frames_read_curated_or_own" on public.frame_templates for select using (visibility = 'curated' or auth.uid() = owner_id);
create policy "frames_insert_own_private" on public.frame_templates for insert with check (auth.uid() = owner_id and visibility = 'private');
create policy "frames_update_own" on public.frame_templates for update using (auth.uid() = owner_id) with check (auth.uid() = owner_id and visibility = 'private');
create policy "frames_delete_own" on public.frame_templates for delete using (auth.uid() = owner_id);
create policy "sessions_select_own" on public.photo_sessions for select using (auth.uid() = owner_id);
create policy "sessions_insert_own" on public.photo_sessions for insert with check (auth.uid() = owner_id);
create policy "sessions_update_own" on public.photo_sessions for update using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
create policy "sessions_delete_own" on public.photo_sessions for delete using (auth.uid() = owner_id);
create policy "exports_select_own" on public.exports for select using (auth.uid() = owner_id);
create policy "exports_insert_own" on public.exports for insert with check (
  auth.uid() = owner_id and exists (
    select 1 from public.photo_sessions s where s.id = session_id and s.owner_id = auth.uid()
  )
);
create policy "exports_delete_own" on public.exports for delete using (auth.uid() = owner_id);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('exports', 'exports', false, 52428800, array['image/png','image/jpeg','image/gif','video/webm']),
  ('private-frames', 'private-frames', false, 10485760, array['image/png']),
  ('curated-frames', 'curated-frames', true, 10485760, array['image/png','image/webp'])
on conflict (id) do nothing;

create policy "export_objects_select_own" on storage.objects for select using (
  bucket_id = 'exports' and (storage.foldername(name))[1] = auth.uid()::text
);
create policy "export_objects_insert_own" on storage.objects for insert with check (
  bucket_id = 'exports' and (storage.foldername(name))[1] = auth.uid()::text
);
create policy "export_objects_delete_own" on storage.objects for delete using (
  bucket_id = 'exports' and (storage.foldername(name))[1] = auth.uid()::text
);
create policy "private_frame_objects_select_own" on storage.objects for select using (
  bucket_id = 'private-frames' and (storage.foldername(name))[1] = auth.uid()::text
);
create policy "private_frame_objects_insert_own" on storage.objects for insert with check (
  bucket_id = 'private-frames' and (storage.foldername(name))[1] = auth.uid()::text
);
create policy "private_frame_objects_delete_own" on storage.objects for delete using (
  bucket_id = 'private-frames' and (storage.foldername(name))[1] = auth.uid()::text
);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
