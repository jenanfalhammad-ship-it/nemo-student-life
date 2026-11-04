
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  university text,
  major text,
  semester text,
  course_count int,
  language text not null default 'en',
  theme text not null default 'light',
  study_goal text,
  session_minutes int not null default 25,
  daily_focus_goal int not null default 120,
  show_quran boolean not null default true,
  time_format text not null default '12h',
  week_start int not null default 0,
  onboarded boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;
create policy "own profile select" on public.profiles for select to authenticated using (auth.uid() = id);
create policy "own profile insert" on public.profiles for insert to authenticated with check (auth.uid() = id);
create policy "own profile update" on public.profiles for update to authenticated using (auth.uid() = id);

create function public.handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name) values (new.id, coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email,'@',1)));
  return new;
end; $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

create table public.courses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  name text not null, code text, color text not null default 'sage', instructor text, semester text, description text,
  archived boolean not null default false,
  created_at timestamptz not null default now()
);
create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  title text not null, description text,
  category text not null default 'university',
  course_id uuid references public.courses(id) on delete set null,
  priority text not null default 'medium',
  due_at timestamptz, estimated_minutes int,
  status text not null default 'not_started',
  completed_at timestamptz,
  created_at timestamptz not null default now()
);
create table public.events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  title text not null, description text,
  kind text not null default 'lecture',
  course_id uuid references public.courses(id) on delete set null,
  starts_at timestamptz not null, ends_at timestamptz not null,
  location text, link text, recurrence text not null default 'none',
  created_at timestamptz not null default now()
);
create table public.reminders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  title text not null, description text,
  category text not null default 'academic', priority text not null default 'medium',
  remind_at timestamptz not null, repeat text not null default 'none',
  done boolean not null default false,
  created_at timestamptz not null default now()
);
create table public.countdowns (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  title text not null, category text not null default 'exam', color text not null default 'sage',
  target_at timestamptz not null,
  course_id uuid references public.courses(id) on delete set null,
  created_at timestamptz not null default now()
);
create table public.focus_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  mode text not null default 'pomodoro',
  planned_minutes int not null, actual_minutes int not null,
  completed boolean not null default false,
  pearls int not null default 0,
  task_id uuid references public.tasks(id) on delete set null,
  course_id uuid references public.courses(id) on delete set null,
  started_at timestamptz not null, ended_at timestamptz not null default now()
);
create table public.flashcard_decks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  name text not null, course_id uuid references public.courses(id) on delete set null,
  created_at timestamptz not null default now()
);
create table public.flashcards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  deck_id uuid not null references public.flashcard_decks(id) on delete cascade,
  front text not null, back text not null,
  state text not null default 'new',
  due_at timestamptz not null default now(),
  stability real not null default 0, difficulty real not null default 5, reps int not null default 0,
  created_at timestamptz not null default now()
);
create table public.course_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  title text not null default 'Untitled', content text not null default '',
  updated_at timestamptz not null default now()
);
create table public.course_files (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  name text not null, path text not null, mime text, size bigint,
  created_at timestamptz not null default now()
);
create table public.user_animals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  animal_key text not null, nickname text,
  discovered_at timestamptz not null default now(),
  unique (user_id, animal_key)
);

do $$ declare t text; begin
  foreach t in array array['courses','tasks','events','reminders','countdowns','focus_sessions','flashcard_decks','flashcards','course_notes','course_files','user_animals'] loop
    execute format('grant select, insert, update, delete on public.%I to authenticated', t);
    execute format('grant all on public.%I to service_role', t);
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy "own rows" on public.%I for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id)', t);
  end loop;
end $$;

create table public.study_rooms (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid(),
  name text not null,
  code text not null unique default upper(substr(md5(random()::text),1,6)),
  goal text,
  created_at timestamptz not null default now()
);
create table public.room_members (
  room_id uuid not null references public.study_rooms(id) on delete cascade,
  user_id uuid not null default auth.uid(),
  display_name text,
  status text not null default 'idle',
  joined_at timestamptz not null default now(),
  primary key (room_id, user_id)
);
grant select, insert, update, delete on public.study_rooms to authenticated;
grant select, insert, update, delete on public.room_members to authenticated;
grant all on public.study_rooms to service_role;
grant all on public.room_members to service_role;
alter table public.study_rooms enable row level security;
alter table public.room_members enable row level security;

create function public.is_room_member(_room uuid) returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.room_members where room_id = _room and user_id = auth.uid())
$$;
create function public.join_room_by_code(_code text, _name text) returns uuid language plpgsql security definer set search_path = public as $$
declare r uuid; n int;
begin
  select id into r from public.study_rooms where code = upper(_code);
  if r is null then raise exception 'Room not found'; end if;
  select count(*) into n from public.room_members where room_id = r;
  if n >= 8 then raise exception 'Room is full'; end if;
  insert into public.room_members (room_id, user_id, display_name) values (r, auth.uid(), _name) on conflict do nothing;
  return r;
end; $$;

create policy "members see room" on public.study_rooms for select to authenticated using (owner_id = auth.uid() or public.is_room_member(id));
create policy "create room" on public.study_rooms for insert to authenticated with check (owner_id = auth.uid());
create policy "owner updates room" on public.study_rooms for update to authenticated using (owner_id = auth.uid());
create policy "owner deletes room" on public.study_rooms for delete to authenticated using (owner_id = auth.uid());
create policy "members see members" on public.room_members for select to authenticated using (public.is_room_member(room_id));
create policy "join self" on public.room_members for insert to authenticated with check (user_id = auth.uid());
create policy "update self" on public.room_members for update to authenticated using (user_id = auth.uid());
create policy "leave or owner removes" on public.room_members for delete to authenticated using (user_id = auth.uid() or exists (select 1 from public.study_rooms s where s.id = room_id and s.owner_id = auth.uid()));
alter publication supabase_realtime add table public.room_members;

create table public.ai_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  role text not null, content text not null,
  created_at timestamptz not null default now()
);
grant select, insert, delete on public.ai_messages to authenticated;
grant all on public.ai_messages to service_role;
alter table public.ai_messages enable row level security;
create policy "own msgs" on public.ai_messages for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
