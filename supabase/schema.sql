-- ============================================
-- 現場調査報告アプリ - Supabase スキーマ
-- ============================================

-- Enable necessary extensions
create extension if not exists "uuid-ossp";

-- ============================================
-- ENUM types
-- ============================================
create type user_role as enum ('admin', 'field_worker');
create type case_status as enum ('pending', 'scheduled', 'in_progress', 'completed', 'reported');
create type photo_category as enum ('room', 'existing_ac', 'electrical_panel', 'outdoor_location', 'piping_route', 'wall', 'other');

-- ============================================
-- Profiles table
-- ============================================
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text not null,
  avatar_url text,
  phone text,
  role user_role not null default 'field_worker',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table profiles enable row level security;

create policy "Users can view all profiles"
  on profiles for select
  to authenticated
  using (true);

create policy "Users can insert own profile"
  on profiles for insert
  to authenticated
  with check (auth.uid() = id);

create policy "Users can update own profile"
  on profiles for update
  to authenticated
  using (auth.uid() = id);

create policy "Admins can update any profile"
  on profiles for update
  to authenticated
  using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

-- Auto-create profile on signup
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    coalesce((new.raw_user_meta_data->>'role')::user_role, 'field_worker')
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ============================================
-- Survey Cases table
-- ============================================
create table survey_cases (
  id uuid primary key default uuid_generate_v4(),
  case_number text not null unique,
  client_name text not null,
  client_contact_name text,
  client_phone text,
  client_email text,
  address text not null,
  work_type text,
  latitude double precision,
  longitude double precision,
  scheduled_date date,
  scheduled_time_start time,
  scheduled_time_end time,
  assigned_to uuid references profiles(id),
  status case_status not null default 'pending',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid not null references profiles(id)
);

alter table survey_cases enable row level security;

create policy "Admins can do everything with cases"
  on survey_cases for all
  to authenticated
  using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

create policy "Field workers can view assigned cases"
  on survey_cases for select
  to authenticated
  using (assigned_to = auth.uid());

create policy "Field workers can update assigned cases"
  on survey_cases for update
  to authenticated
  using (assigned_to = auth.uid());

-- Auto-generate case number
create or replace function generate_case_number()
returns trigger as $$
declare
  year_part text;
  seq_num int;
begin
  year_part := to_char(now(), 'YYYY');
  select coalesce(max(cast(substring(case_number from 'INS-[0-9]{4}-([0-9]+)') as int)), 0) + 1
  into seq_num
  from survey_cases
  where case_number like 'INS-' || year_part || '-%';
  
  new.case_number := 'INS-' || year_part || '-' || lpad(seq_num::text, 4, '0');
  return new;
end;
$$ language plpgsql;

create trigger set_case_number
  before insert on survey_cases
  for each row execute function generate_case_number();

-- ============================================
-- Survey Forms table
-- ============================================
create table survey_forms (
  id uuid primary key default uuid_generate_v4(),
  case_id uuid not null references survey_cases(id) on delete cascade unique,
  room_info jsonb not null default '{}',
  existing_ac jsonb not null default '{}',
  electrical_info jsonb not null default '{}',
  piping_info jsonb not null default '{}',
  drain_info jsonb not null default '{}',
  outdoor_unit jsonb not null default '{}',
  wall_info jsonb not null default '{}',
  additional_work jsonb not null default '{}',
  comments text default '',
  submitted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table survey_forms enable row level security;

create policy "Admins can do everything with forms"
  on survey_forms for all
  to authenticated
  using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

create policy "Field workers can manage forms for assigned cases"
  on survey_forms for all
  to authenticated
  using (
    exists (
      select 1 from survey_cases
      where survey_cases.id = survey_forms.case_id
      and survey_cases.assigned_to = auth.uid()
    )
  );

-- ============================================
-- Survey Photos table
-- ============================================
create table survey_photos (
  id uuid primary key default uuid_generate_v4(),
  form_id uuid not null references survey_forms(id) on delete cascade,
  storage_path text not null,
  thumbnail_path text,
  category photo_category not null default 'other',
  caption text default '',
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

alter table survey_photos enable row level security;

create policy "Admins can do everything with photos"
  on survey_photos for all
  to authenticated
  using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

create policy "Field workers can manage photos for assigned cases"
  on survey_photos for all
  to authenticated
  using (
    exists (
      select 1 from survey_forms
      join survey_cases on survey_cases.id = survey_forms.case_id
      where survey_forms.id = survey_photos.form_id
      and survey_cases.assigned_to = auth.uid()
    )
  );

-- ============================================
-- Reports table
-- ============================================
create table reports (
  id uuid primary key default uuid_generate_v4(),
  case_id uuid not null references survey_cases(id) on delete cascade,
  pdf_storage_path text not null,
  version int not null default 1,
  generated_by uuid not null references profiles(id),
  generated_at timestamptz not null default now()
);

alter table reports enable row level security;

create policy "Admins can do everything with reports"
  on reports for all
  to authenticated
  using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

create policy "Field workers can view reports for assigned cases"
  on reports for select
  to authenticated
  using (
    exists (
      select 1 from survey_cases
      where survey_cases.id = reports.case_id
      and survey_cases.assigned_to = auth.uid()
    )
  );

-- ============================================
-- Updated_at trigger
-- ============================================
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger update_profiles_updated_at
  before update on profiles
  for each row execute function update_updated_at();

create trigger update_survey_cases_updated_at
  before update on survey_cases
  for each row execute function update_updated_at();

create trigger update_survey_forms_updated_at
  before update on survey_forms
  for each row execute function update_updated_at();

-- ============================================
-- Storage buckets
-- ============================================
insert into storage.buckets (id, name, public) values ('survey-photos', 'survey-photos', true);
insert into storage.buckets (id, name, public) values ('reports', 'reports', true);

create policy "Authenticated users can upload photos"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'survey-photos');

create policy "Anyone can view photos"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'survey-photos');

create policy "Authenticated users can delete own photos"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'survey-photos');

create policy "Authenticated users can upload reports"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'reports');

create policy "Anyone can view reports"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'reports');

-- ============================================
-- Indexes
-- ============================================
create index idx_survey_cases_status on survey_cases(status);
create index idx_survey_cases_assigned_to on survey_cases(assigned_to);
create index idx_survey_cases_scheduled_date on survey_cases(scheduled_date);
create index idx_survey_cases_created_at on survey_cases(created_at desc);
create index idx_survey_photos_form_id on survey_photos(form_id);
create index idx_reports_case_id on reports(case_id);
