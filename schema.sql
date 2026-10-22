-- EduTrack · esquema para Supabase. Pégalo completo en SQL Editor y pulsa Run.

create table public.profiles(
  id uuid primary key references auth.users on delete cascade,
  email text, nombre text,
  role text not null default 'student' check (role in ('teacher','student')));

create table public.courses(
  id bigint generated always as identity primary key,
  nombre text not null, grupo text not null, descripcion text default '',
  owner uuid references auth.users default auth.uid());

create table public.students(
  id bigint generated always as identity primary key,
  nombre text not null, email text,
  course_id bigint not null references public.courses on delete cascade);

create table public.assignments(
  id bigint generated always as identity primary key,
  title text not null,
  course_id bigint not null references public.courses on delete cascade,
  due date not null,
  status text not null default 'Borrador' check (status in ('Borrador','Publicado')));

create table public.grades(
  assignment_id bigint references public.assignments on delete cascade,
  student_id bigint references public.students on delete cascade,
  nota numeric(3,1) not null check (nota between 0 and 10),
  primary key (assignment_id, student_id));

-- Funciones auxiliares (security definer evita recursión en las políticas)
create function public.is_teacher() returns boolean
language sql security definer set search_path = public stable as
$$ select exists(select 1 from profiles where id = auth.uid() and role = 'teacher') $$;

create function public.my_student_ids() returns setof bigint
language sql security definer set search_path = public stable as
$$ select id from students where lower(email) = lower(auth.jwt() ->> 'email') $$;

create function public.my_course_ids() returns setof bigint
language sql security definer set search_path = public stable as
$$ select course_id from students where lower(email) = lower(auth.jwt() ->> 'email') $$;

-- Cada cuenta nueva recibe perfil de estudiante (el rol docente lo asignas tú)
create function public.new_user() returns trigger
language plpgsql security definer set search_path = public as
$$ begin
  insert into profiles(id, email, nombre)
  values (new.id, new.email, coalesce(new.raw_user_meta_data ->> 'nombre', new.email));
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users
for each row execute function public.new_user();

-- Seguridad por filas: aquí se decide quién ve qué
alter table public.profiles enable row level security;
alter table public.courses enable row level security;
alter table public.students enable row level security;
alter table public.assignments enable row level security;
alter table public.grades enable row level security;

create policy "perfil propio" on public.profiles for select using (id = auth.uid());

create policy "docente: todo" on public.courses for all using (is_teacher()) with check (is_teacher());
create policy "alumno: sus cursos" on public.courses for select using (id in (select my_course_ids()));

create policy "docente: todo" on public.students for all using (is_teacher()) with check (is_teacher());
create policy "alumno: su ficha" on public.students for select using (id in (select my_student_ids()));

create policy "docente: todo" on public.assignments for all using (is_teacher()) with check (is_teacher());
create policy "alumno: publicadas de sus cursos" on public.assignments for select
  using (status = 'Publicado' and course_id in (select my_course_ids()));

create policy "docente: todo" on public.grades for all using (is_teacher()) with check (is_teacher());
create policy "alumno: sus notas" on public.grades for select using (student_id in (select my_student_ids()));

-- Para convertir una cuenta en docente (ejecútalo después de registrarte en la app):
-- update public.profiles set role = 'teacher' where email = 'TU_CORREO@ejemplo.com';
