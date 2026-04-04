-- ==========================================
-- Placemate AI – Neon Postgres Schema
-- Run this in Neon SQL Editor
-- ==========================================

-- 1. Institutes (Multi-tenant)
CREATE TABLE IF NOT EXISTS institutes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  logo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Users (with password hash – no Supabase Auth dependency)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name TEXT,
  role TEXT CHECK (role IN ('student', 'tpo', 'admin')) DEFAULT 'student',
  institute_id UUID REFERENCES institutes(id) ON DELETE SET NULL,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Student Profiles
CREATE TABLE IF NOT EXISTS profiles (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  branch TEXT,
  semester INT,
  cgpa_band TEXT,
  target_role TEXT,
  skills_json JSONB DEFAULT '[]',
  hours_per_week INT DEFAULT 10,
  onboarding_done BOOLEAN DEFAULT false,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Roadmaps
CREATE TABLE IF NOT EXISTS roadmaps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  institute_id UUID REFERENCES institutes(id) ON DELETE SET NULL,
  plan_json JSONB NOT NULL,
  duration_months INT DEFAULT 3,
  status TEXT CHECK (status IN ('active', 'archived')) DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Roadmap Progress
CREATE TABLE IF NOT EXISTS roadmap_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  roadmap_id UUID REFERENCES roadmaps(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  week_number INT NOT NULL,
  completed BOOLEAN DEFAULT false,
  notes TEXT,
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (roadmap_id, user_id, week_number)
);

-- 6. Resume Feedback & ATS Scores
CREATE TABLE IF NOT EXISTS resume_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  institute_id UUID REFERENCES institutes(id) ON DELETE SET NULL,
  raw_resume_text TEXT NOT NULL,
  target_role TEXT,
  job_description TEXT,
  ats_score INT CHECK (ats_score BETWEEN 0 AND 100),
  parsed_json JSONB,
  strengths_json JSONB DEFAULT '[]',
  weaknesses_json JSONB DEFAULT '[]',
  improvement_actions_json JSONB DEFAULT '[]',
  improved_resume_text TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 7. Mock Interviews
CREATE TABLE IF NOT EXISTS mock_interviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  institute_id UUID REFERENCES institutes(id) ON DELETE SET NULL,
  mode TEXT CHECK (mode IN ('text', 'video_beta')) DEFAULT 'text',
  status TEXT CHECK (status IN ('in_progress', 'completed', 'abandoned')) DEFAULT 'in_progress',
  target_role TEXT,
  transcript_json JSONB DEFAULT '[]',
  question_scores_json JSONB DEFAULT '[]',
  webcam_metrics_json JSONB DEFAULT '{}',
  overall_score INT,
  summary TEXT,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 8. TPO Training Plans
CREATE TABLE IF NOT EXISTS tpo_training_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institute_id UUID REFERENCES institutes(id) ON DELETE CASCADE,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  filters_json JSONB DEFAULT '{}',
  cohort_stats_json JSONB DEFAULT '{}',
  plan_json JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 9. Activity Log
CREATE TABLE IF NOT EXISTS activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ==========================================
-- INDEXES for performance
-- ==========================================
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_institute ON users(institute_id);
CREATE INDEX IF NOT EXISTS idx_roadmaps_user ON roadmaps(user_id, status);
CREATE INDEX IF NOT EXISTS idx_resume_feedback_user ON resume_feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_mock_interviews_user ON mock_interviews(user_id, status);
CREATE INDEX IF NOT EXISTS idx_activity_log_user ON activity_log(user_id, created_at DESC);
