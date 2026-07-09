alter table public.profiles
  add column if not exists role text not null default 'member'
  check (role in ('member', 'admin'));

alter table public.frame_templates
  add column if not exists published boolean not null default false,
  add column if not exists sort_order integer not null default 100,
  add column if not exists mime_type text check (mime_type in ('image/png', 'image/webp')),
  add column if not exists print_compatible boolean not null default false,
  add column if not exists updated_at timestamptz not null default now();

create table if not exists public.stickers (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users(id) on delete cascade,
  visibility text not null check (visibility in ('curated', 'private')) default 'private',
  title text not null check (char_length(title) between 1 and 80),
  category text not null default 'Custom',
  storage_path text not null unique,
  mime_type text not null check (mime_type in ('image/png', 'image/webp')),
  width integer not null check (width between 32 and 8000),
  height integer not null check (height between 32 and 8000),
  published boolean not null default false,
  sort_order integer not null default 100,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint sticker_visibility_owner check (
    (visibility = 'private' and owner_id is not null) or visibility = 'curated'
  )
);

create index if not exists stickers_owner_idx on public.stickers(owner_id);
create index if not exists stickers_catalog_idx on public.stickers(visibility, published, sort_order);
alter table public.stickers enable row level security;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

drop policy if exists "frames_read_curated_or_own" on public.frame_templates;
create policy "frames_read_published_or_own" on public.frame_templates for select using (
  (visibility = 'curated' and published = true)
  or auth.uid() = owner_id
  or public.is_admin()
);
create policy "frames_admin_manage" on public.frame_templates for all
  using (public.is_admin()) with check (public.is_admin());

create policy "stickers_read_published_or_own" on public.stickers for select using (
  (visibility = 'curated' and published = true)
  or auth.uid() = owner_id
  or public.is_admin()
);
create policy "stickers_insert_private_own" on public.stickers for insert with check (
  auth.uid() = owner_id and visibility = 'private' and published = false
);
create policy "stickers_update_private_own" on public.stickers for update
  using (auth.uid() = owner_id and visibility = 'private')
  with check (auth.uid() = owner_id and visibility = 'private' and published = false);
create policy "stickers_delete_private_own" on public.stickers for delete using (
  auth.uid() = owner_id and visibility = 'private'
);
create policy "stickers_admin_manage" on public.stickers for all
  using (public.is_admin()) with check (public.is_admin());

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('curated-stickers', 'curated-stickers', true, 10485760, array['image/png','image/webp']),
  ('private-stickers', 'private-stickers', false, 10485760, array['image/png','image/webp'])
on conflict (id) do update set
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "curated_frame_admin_write" on storage.objects for insert with check (
  bucket_id = 'curated-frames' and public.is_admin()
);
create policy "curated_frame_admin_update" on storage.objects for update
  using (bucket_id = 'curated-frames' and public.is_admin());
create policy "curated_frame_admin_delete" on storage.objects for delete
  using (bucket_id = 'curated-frames' and public.is_admin());
create policy "curated_sticker_admin_write" on storage.objects for insert with check (
  bucket_id = 'curated-stickers' and public.is_admin()
);
create policy "curated_sticker_admin_update" on storage.objects for update
  using (bucket_id = 'curated-stickers' and public.is_admin());
create policy "curated_sticker_admin_delete" on storage.objects for delete
  using (bucket_id = 'curated-stickers' and public.is_admin());
create policy "private_sticker_select_own" on storage.objects for select using (
  bucket_id = 'private-stickers' and (storage.foldername(name))[1] = auth.uid()::text
);
create policy "private_sticker_insert_own" on storage.objects for insert with check (
  bucket_id = 'private-stickers' and (storage.foldername(name))[1] = auth.uid()::text
);
create policy "private_sticker_delete_own" on storage.objects for delete using (
  bucket_id = 'private-stickers' and (storage.foldername(name))[1] = auth.uid()::text
);

-- Run after the first account signs in:
-- update public.profiles set role = 'admin' where id = '<USER_UUID>';
