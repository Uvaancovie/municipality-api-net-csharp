-- SQL executed directly in Supabase
-- This file is for documentation purposes only and should not be executed again

create table if not exists public.issues (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null,
  location text not null,
  category text not null,
  media_urls text[] not null default '{}',
  status text not null default 'Submitted',
  created_at timestamptz not null default now(),
  updated_at timestamptz
);

create table if not exists public.events (
  id serial primary key,
  title text not null,
  description text not null,
  starts_at timestamptz not null,
  location text
);

-- Basic RLS (demo): allow read to anon, insert via API only
alter table public.issues enable row level security;
create policy "read_issues" on public.issues for select using (true);
create policy "insert_issues" on public.issues for insert with check (true); -- tighten for auth later
