-- ============================================
-- AEC Character Generator 데이터베이스 스키마
-- Supabase PostgreSQL용
-- ============================================

-- UUID 확장 활성화
create extension if not exists "uuid-ossp";

-- ============================================
-- 프로필 테이블
-- ============================================
create table if not exists profiles (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now(),
  unique(user_id)
);

-- 프로필 RLS 정책
alter table profiles enable row level security;

create policy "사용자는 자신의 프로필만 조회 가능"
  on profiles for select
  using (auth.uid() = user_id);

create policy "사용자는 자신의 프로필만 생성 가능"
  on profiles for insert
  with check (auth.uid() = user_id);

create policy "사용자는 자신의 프로필만 수정 가능"
  on profiles for update
  using (auth.uid() = user_id);

-- ============================================
-- 캐릭터 테이블 (베이스 캐릭터: 얼굴, 헤어, 수염, 안경)
-- ============================================
create table if not exists characters (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  face text not null,
  hair text not null,
  mustache text,
  glasses text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id)
);

-- 캐릭터 RLS 정책
alter table characters enable row level security;

create policy "사용자는 자신의 캐릭터만 조회 가능"
  on characters for select
  using (auth.uid() = user_id);

create policy "사용자는 자신의 캐릭터만 생성 가능"
  on characters for insert
  with check (auth.uid() = user_id);

create policy "사용자는 자신의 캐릭터만 수정 가능"
  on characters for update
  using (auth.uid() = user_id);

create policy "사용자는 자신의 캐릭터만 삭제 가능"
  on characters for delete
  using (auth.uid() = user_id);

-- ============================================
-- 무드 다이어리 항목 테이블
-- ============================================
create table if not exists mood_entries (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  character_id uuid not null references characters(id) on delete cascade,
  date date not null,
  mood_category text not null,
  outfit_file text not null,
  expression_file text not null,
  composite_image_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, date)
);

-- 무드 항목 RLS 정책
alter table mood_entries enable row level security;

create policy "사용자는 자신의 무드 항목만 조회 가능"
  on mood_entries for select
  using (auth.uid() = user_id);

create policy "사용자는 자신의 무드 항목만 생성 가능"
  on mood_entries for insert
  with check (auth.uid() = user_id);

create policy "사용자는 자신의 무드 항목만 수정 가능"
  on mood_entries for update
  using (auth.uid() = user_id);

create policy "사용자는 자신의 무드 항목만 삭제 가능"
  on mood_entries for delete
  using (auth.uid() = user_id);

-- ============================================
-- 인덱스
-- ============================================
create index if not exists idx_profiles_user_id on profiles(user_id);
create index if not exists idx_characters_user_id on characters(user_id);
create index if not exists idx_mood_entries_user_id on mood_entries(user_id);
create index if not exists idx_mood_entries_date on mood_entries(user_id, date);
create index if not exists idx_mood_entries_character_id on mood_entries(character_id);

-- ============================================
-- updated_at 자동 갱신 트리거
-- ============================================
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger update_characters_updated_at
  before update on characters
  for each row
  execute function update_updated_at_column();

create trigger update_mood_entries_updated_at
  before update on mood_entries
  for each row
  execute function update_updated_at_column();
