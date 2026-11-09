create extension if not exists pgcrypto;

create table if not exists public.schedules (
  id uuid primary key default gen_random_uuid(),
  grade integer not null check (grade between 1 and 3),
  class_no integer,
  subject text not null check (
    subject in (
      '국어', '수학', '영어', '한국사', '통합사회', '통합과학',
      '과학탐구실험', '정보', '체육', '음악', '미술', '기타', '학교'
    )
  ),
  type text not null check (
    type in ('performance', 'exam', 'assignment', 'event', 'holiday', 'other')
  ),
  title text not null check (char_length(title) between 1 and 40),
  start_date date not null,
  end_date date,
  content text not null default '' check (char_length(content) <= 500),
  materials text not null default '' check (char_length(materials) <= 200),
  weight text check (weight is null or char_length(weight) <= 20),
  updated_by_label text not null check (char_length(updated_by_label) between 1 and 30),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint schedules_end_date_after_start
    check (end_date is null or end_date >= start_date),
  constraint schedules_school_subject_for_school_dates
    check ((subject = '학교') = (type in ('event', 'holiday')))
);

create table if not exists public.class_codes (
  grade integer not null check (grade between 1 and 3),
  class_no integer not null,
  code_hash text not null,
  primary key (grade, class_no)
);

alter table public.schedules
  drop constraint if exists schedules_class_no_check;
alter table public.schedules
  drop constraint if exists schedules_class_no_positive;
alter table public.schedules
  add constraint schedules_class_no_positive
  check (class_no is null or class_no >= 1);

update public.schedules
set updated_by_label = '2학년 공동'
where grade = 2 and class_no is not null;

update public.schedules
set class_no = null
where grade = 2 and class_no is not null;

alter table public.schedules
  drop constraint if exists schedules_grade2_no_class;
alter table public.schedules
  add constraint schedules_grade2_no_class
  check (grade <> 2 or class_no is null);

alter table public.class_codes
  drop constraint if exists class_codes_class_no_check;
alter table public.class_codes
  drop constraint if exists class_codes_class_no_positive;
alter table public.class_codes
  add constraint class_codes_class_no_positive
  check (class_no >= 1);

alter table public.schedules
  drop constraint if exists schedules_subject_check;
alter table public.schedules
  drop constraint if exists schedules_subject_length_check;
alter table public.schedules
  add constraint schedules_subject_length_check
  check (char_length(subject) between 1 and 40);

alter table public.schedules
  drop constraint if exists schedules_type_check;
alter table public.schedules
  add constraint schedules_type_check
  check (type in ('performance', 'exam', 'assignment', 'event', 'holiday', 'other'));

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = pg_catalog.now();
  return new;
end;
$$;

drop trigger if exists schedules_set_updated_at on public.schedules;
create trigger schedules_set_updated_at
before update on public.schedules
for each row execute function public.set_updated_at();

alter table public.schedules enable row level security;
alter table public.class_codes enable row level security;

drop policy if exists "Schedules are readable by everyone" on public.schedules;
create policy "Schedules are readable by everyone"
  on public.schedules
  for select
  to anon, authenticated
  using (true);

revoke all on table public.schedules from anon, authenticated;
grant select on table public.schedules to anon, authenticated;

revoke all on table public.class_codes from anon, authenticated;
