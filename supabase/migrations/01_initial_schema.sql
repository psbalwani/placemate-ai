-- ==========================================
-- Placemate AI – Database Schema (Postgres)
-- ==========================================

-- 1. Institutes (Multi-tenant)
CREATE TABLE IF NOT EXISTS institutes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  logo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Users (Mapping Supabase Auth to Roles/Institutes)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  institute_id UUID REFERENCES institutes(id) ON DELETE SET NULL,
  role TEXT CHECK (role IN ('student', 'tpo', 'admin')) DEFAULT 'student',
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Profiles (Student Specific Details)
CREATE TABLE IF NOT EXISTS profiles (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  branch TEXT,
  semester INT,
  cgpa_band TEXT,
  target_role TEXT,
  skills_json JSONB DEFAULT '[]', -- Array of {name, level}
  hours_per_week INT DEFAULT 10,
  onboarding_done BOOLEAN DEFAULT false,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Roadmaps (AI Generated Plans)
CREATE TABLE IF NOT EXISTS roadmaps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  institute_id UUID REFERENCES institutes(id) ON DELETE CASCADE,
  plan_json JSONB NOT NULL, -- Nested week structure
  duration_months INT DEFAULT 3,
  status TEXT CHECK (status IN ('active', 'archived')) DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Resume Feedback & ATS Scores
CREATE TABLE IF NOT EXISTS resume_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  institute_id UUID REFERENCES institutes(id) ON DELETE CASCADE,
  raw_resume_text TEXT NOT NULL,
  target_role TEXT,
  job_description TEXT,
  ats_score INT CHECK (ats_score BETWEEN 0 AND 100),
  parsed_json JSONB, -- { name, summary, skills, education, experience, projects }
  strengths_json JSONB DEFAULT '[]',
  weaknesses_json JSONB DEFAULT '[]',
  improvement_actions_json JSONB DEFAULT '[]',
  improved_resume_text TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Mock Interviews
CREATE TABLE IF NOT EXISTS mock_interviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  institute_id UUID REFERENCES institutes(id) ON DELETE CASCADE,
  mode TEXT CHECK (mode IN ('text', 'video_beta')) DEFAULT 'text',
  status TEXT CHECK (status IN ('in_progress', 'completed', 'abandoned')) DEFAULT 'completed',
  transcript_json JSONB DEFAULT '[]',
  question_scores_json JSONB DEFAULT '[]',
  overall_score INT,
  summary TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ
);

-- 7. Activity Logs
CREATE TABLE IF NOT EXISTS activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ==========================================
-- AUTOMATION: TRIGGERS FOR NEW USERS
-- ==========================================

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    new_user_id UUID;
    inst_id UUID;
BEGIN
    -- 1. Try to find or create institute (if provided in metadata)
    IF (new.raw_user_meta_data->>'institute_name') IS NOT NULL THEN
        INSERT INTO public.institutes (name, slug)
        VALUES (
            new.raw_user_meta_data->>'institute_name',
            lower(regexp_replace(new.raw_user_meta_data->>'institute_name', '[^a-zA-Z0-9]', '-', 'g'))
        )
        ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
        RETURNING id INTO inst_id;
    END IF;

    -- 2. Create entry in public.users
    INSERT INTO public.users (auth_id, email, full_name, role, institute_id)
    VALUES (
        new.id,
        new.email,
        new.raw_user_meta_data->>'full_name',
        COALESCE(new.raw_user_meta_data->>'role', 'student'),
        inst_id
    )
    RETURNING id INTO new_user_id;

    -- 3. Create entry in public.profiles (if student)
    IF (new.raw_user_meta_data->>'role' = 'student' OR new.raw_user_meta_data->>'role' IS NULL) THEN
        INSERT INTO public.profiles (user_id, onboarding_done)
        VALUES (new_user_id, false);
    END IF;

    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==========================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==========================================

ALTER TABLE institutes ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE roadmaps ENABLE ROW LEVEL SECURITY;
ALTER TABLE resume_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE mock_interviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

-- Institutes (Public read, no direct write)
CREATE POLICY "Institutes are readable by all" ON institutes FOR SELECT USING (true);

-- Users (Can see own row, TPOs see students in same institute)
CREATE POLICY "Users see themselves" ON users FOR SELECT USING (auth.uid() = auth_id);
CREATE POLICY "TPOs see students in institute" ON users FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM users WHERE auth_id = auth.uid() AND role = 'tpo' AND institute_id = users.institute_id
  )
);

-- Profiles (Can see own profile, TPOs see students in same institute)
CREATE POLICY "Users see own profile" ON profiles FOR SELECT USING (
  EXISTS (SELECT 1 FROM users WHERE auth_id = auth.uid() AND id = profiles.user_id)
);
CREATE POLICY "TPOs see profiles in institute" ON profiles FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM users AS me 
    JOIN users AS student ON student.institute_id = me.institute_id
    WHERE me.auth_id = auth.uid() AND me.role = 'tpo' AND student.id = profiles.user_id
  )
);

-- Roadmaps (Can see own roadmap, TPOs see student roadmaps)
CREATE POLICY "Users see own roadmaps" ON roadmaps FOR SELECT USING (
  EXISTS (SELECT 1 FROM users WHERE auth_id = auth.uid() AND id = roadmaps.user_id)
);
CREATE POLICY "TPOs see student roadmaps" ON roadmaps FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM users WHERE auth_id = auth.uid() AND role = 'tpo' AND institute_id = roadmaps.institute_id
  )
);

-- Resume Feedback & Mock Interviews (Similar logic)
CREATE POLICY "Users see own resume feedback" ON resume_feedback FOR SELECT USING (
  EXISTS (SELECT 1 FROM users WHERE auth_id = auth.uid() AND id = resume_feedback.user_id)
);
CREATE POLICY "Users see own mock interviews" ON mock_interviews FOR SELECT USING (
  EXISTS (SELECT 1 FROM users WHERE auth_id = auth.uid() AND id = mock_interviews.user_id)
);
