update public.schedules
set updated_by_label = '2학년 공동',
    class_no = null
where grade = 2 and class_no is not null;

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

alter table public.schedules
  drop constraint if exists schedules_grade2_no_class;
alter table public.schedules
  add constraint schedules_grade2_no_class
  check (grade <> 2 or class_no is null);
