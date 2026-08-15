-- Đi Đâu Đây: dữ liệu riêng tư theo từng tài khoản Supabase Auth.
create extension if not exists pgcrypto;

create table if not exists public.trips (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  title text not null default 'Chuyến đi',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.trip_documents (
  trip_id uuid primary key references public.trips(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  document jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create index if not exists trips_owner_updated_idx on public.trips(owner_id, updated_at desc);
create index if not exists trip_documents_owner_updated_idx on public.trip_documents(owner_id, updated_at desc);

alter table public.trips enable row level security;
alter table public.trip_documents enable row level security;

drop policy if exists "owners read trips" on public.trips;
drop policy if exists "owners create trips" on public.trips;
drop policy if exists "owners update trips" on public.trips;
drop policy if exists "owners delete trips" on public.trips;
create policy "owners read trips" on public.trips for select using (auth.uid() = owner_id);
create policy "owners create trips" on public.trips for insert with check (auth.uid() = owner_id);
create policy "owners update trips" on public.trips for update using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
create policy "owners delete trips" on public.trips for delete using (auth.uid() = owner_id);

drop policy if exists "owners read trip documents" on public.trip_documents;
drop policy if exists "owners create trip documents" on public.trip_documents;
drop policy if exists "owners update trip documents" on public.trip_documents;
drop policy if exists "owners delete trip documents" on public.trip_documents;
create policy "owners read trip documents" on public.trip_documents for select using (auth.uid() = owner_id);
create policy "owners create trip documents" on public.trip_documents for insert with check (auth.uid() = owner_id);
create policy "owners update trip documents" on public.trip_documents for update using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
create policy "owners delete trip documents" on public.trip_documents for delete using (auth.uid() = owner_id);

grant select, insert, update, delete on public.trips to authenticated;
grant select, insert, update, delete on public.trip_documents to authenticated;

-- Bucket ảnh riêng tư. Đường dẫn bắt đầu bằng auth.uid().
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('trip-photos', 'trip-photos', false, 10485760, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "owners upload trip photos" on storage.objects;
drop policy if exists "owners read trip photos" on storage.objects;
drop policy if exists "owners update trip photos" on storage.objects;
drop policy if exists "owners delete trip photos" on storage.objects;
create policy "owners upload trip photos" on storage.objects for insert to authenticated
  with check (bucket_id = 'trip-photos' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "owners read trip photos" on storage.objects for select to authenticated
  using (bucket_id = 'trip-photos' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "owners update trip photos" on storage.objects for update to authenticated
  using (bucket_id = 'trip-photos' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'trip-photos' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "owners delete trip photos" on storage.objects for delete to authenticated
  using (bucket_id = 'trip-photos' and (storage.foldername(name))[1] = auth.uid()::text);
