create table if not exists public.admin_credentials (
  id boolean primary key default true check (id),
  code_hash text not null,
  updated_at timestamptz not null default now()
);

alter table public.admin_credentials enable row level security;
revoke all on table public.admin_credentials from anon, authenticated;
grant all on table public.admin_credentials to service_role;
