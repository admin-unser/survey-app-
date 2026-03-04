-- 既存の Supabase プロジェクトで survey_cases に不足しているカラムを追加するマイグレーション
-- 「Could not find the 'client_contact_name' column」エラーが出る場合、
-- Supabase Dashboard → SQL Editor でこのファイルの内容を実行してください。

ALTER TABLE survey_cases
  ADD COLUMN IF NOT EXISTS client_contact_name text;

-- 念のため他に不足しがちなカラムも追加（既にあればスキップ）
ALTER TABLE survey_cases
  ADD COLUMN IF NOT EXISTS client_phone text,
  ADD COLUMN IF NOT EXISTS client_email text,
  ADD COLUMN IF NOT EXISTS work_type text,
  ADD COLUMN IF NOT EXISTS latitude double precision,
  ADD COLUMN IF NOT EXISTS longitude double precision,
  ADD COLUMN IF NOT EXISTS scheduled_date date,
  ADD COLUMN IF NOT EXISTS scheduled_time_start time,
  ADD COLUMN IF NOT EXISTS scheduled_time_end time,
  ADD COLUMN IF NOT EXISTS notes text;
