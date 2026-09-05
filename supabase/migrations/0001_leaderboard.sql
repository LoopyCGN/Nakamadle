-- Nakamadle leaderboard + accounts migration.
-- Run once in the Supabase SQL editor (project dashboard).
-- Auth uses Supabase Auth (email/password); this file creates app tables,
-- Row Level Security, a profile trigger and a leaderboard view.

-- 1. Profiles (one row per auth user, username picked at signup)
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text unique not null,
  created_at timestamptz not null default now()
);

-- 2. Daily results (one row per user/mode/scope/day; upserted on finish)
create table if not exists public.results (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  mode text not null check (mode in ('classic', 'fruits')),
  scope text not null check (scope in ('anime', 'manga')),
  date_key date not null,
  attempts int not null check (attempts >= 0),
  won boolean not null,
  created_at timestamptz not null default now(),
  unique (user_id, mode, scope, date_key)
);
create index if not exists results_board_idx on public.results (mode, scope, date_key, won desc, attempts asc);
create index if not exists results_user_idx on public.results (user_id, created_at desc);

-- 3. Row Level Security: users own their rows, boards are public to read
alter table public.profiles enable row level security;
alter table public.results enable row level security;

drop policy if exists "profiles readable by everyone" on public.profiles;
create policy "profiles readable by everyone" on public.profiles for select using (true);

drop policy if exists "users insert own profile" on public.profiles;
create policy "users insert own profile" on public.profiles for insert with check (auth.uid() = id);

drop policy if exists "users update own profile" on public.profiles;
create policy "users update own profile" on public.profiles for update using (auth.uid() = id);

drop policy if exists "results readable by everyone" on public.results;
create policy "results readable by everyone" on public.results for select using (true);

drop policy if exists "users insert own results" on public.results;
create policy "users insert own results" on public.results for insert with check (auth.uid() = user_id);

drop policy if exists "users update own results" on public.results;
create policy "users update own results" on public.results for update using (auth.uid() = user_id);

drop policy if exists "users delete own results" on public.results;
create policy "users delete own results" on public.results for delete using (auth.uid() = user_id);

-- 4. Auto-create profile on signup (username from metadata, fallback email prefix + suffix)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  base text;
  candidate text;
  n int := 0;
begin
  base := lower(regexp_replace(coalesce(new.raw_user_meta_data ->> 'username', split_part(new.email, '@', 1), 'nakama'), '[^a-z0-9_]', '', 'g'));
  if base = '' then base := 'nakama'; end if;
  candidate := substring(base from 1 for 14);
  loop
    begin
      insert into public.profiles (id, username) values (new.id, candidate);
      return new;
    exception when unique_violation then
      n := n + 1;
      candidate := substring(base from 1 for 11) || '_' || lpad(n::text, 2, '0');
      if n > 99 then raise; end if;
    end;
  end loop;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 5. All-time leaderboard view (plays, wins, win rate, avg attempts on wins)
create or replace view public.leaderboard_alltime as
select
  p.id as user_id,
  p.username,
  count(r.id)::int as plays,
  coalesce(sum(r.won::int), 0)::int as wins,
  round(avg(r.attempts) filter (where r.won), 1) as avg_attempts
from public.profiles p
left join public.results r on r.user_id = p.id
group by p.id, p.username;
