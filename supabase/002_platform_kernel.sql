create table if not exists public.platform_settings (
  id boolean primary key default true,
  platform_name text,
  support_email text,
  auth_provider text not null default 'supabase',
  initialized_at timestamptz,
  initialized_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  check (id = true)
);

insert into public.platform_settings (id)
values (true)
on conflict (id) do nothing;

create table if not exists public.platforms (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  logo_url text,
  is_active boolean not null default true,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.platform_memberships (
  id uuid primary key default gen_random_uuid(),
  platform_id uuid not null references public.platforms(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null check (role in ('super_admin', 'platform_admin', 'platform_user')),
  status text not null default 'active' check (status in ('active', 'disabled')),
  invited_email text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (platform_id, user_id)
);

create index if not exists platform_memberships_user_idx on public.platform_memberships (user_id);
create index if not exists platform_memberships_platform_idx on public.platform_memberships (platform_id);

alter table public.profiles
  add column if not exists active_platform_id uuid references public.platforms(id) on delete set null;

drop trigger if exists set_platform_settings_updated_at on public.platform_settings;
create trigger set_platform_settings_updated_at
before update on public.platform_settings
for each row
execute procedure public.set_current_timestamp_updated_at();

drop trigger if exists set_platforms_updated_at on public.platforms;
create trigger set_platforms_updated_at
before update on public.platforms
for each row
execute procedure public.set_current_timestamp_updated_at();

drop trigger if exists set_platform_memberships_updated_at on public.platform_memberships;
create trigger set_platform_memberships_updated_at
before update on public.platform_memberships
for each row
execute procedure public.set_current_timestamp_updated_at();
