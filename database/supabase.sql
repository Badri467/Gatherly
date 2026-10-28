-- Run once in Supabase SQL Editor. This prepares storage; it does not connect the current app.
create table public.events (
 id uuid primary key,
 owner_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
 data jsonb not null check (jsonb_typeof(data) = 'object'),
 updated_at timestamptz not null default now()
);
create index events_owner_idx on public.events(owner_id);
alter table public.events enable row level security;
revoke all on public.events from anon;
grant select, insert, update, delete on public.events to authenticated;
create policy "Owners manage their events" on public.events
 for all to authenticated
 using ((select auth.uid()) = owner_id)
 with check ((select auth.uid()) = owner_id);
