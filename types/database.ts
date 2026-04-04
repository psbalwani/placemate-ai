// ============================================================
// Database Entity Types – mirrors Supabase Postgres schema
// ============================================================

export type UserRole = 'student' | 'tpo' | 'admin';
export type InterviewMode = 'text' | 'video_beta';
export type InterviewStatus = 'in_progress' | 'completed' | 'abandoned';

export interface WebcamMetrics {
  brightness: number;
  blur: number;
  presence: number;
  captured_at: string;
}

export interface WebcamMetricsSummary {
  samples: number;
  avg_brightness: number;
  avg_blur: number;
  avg_presence: number;
  low_light_events: number;
  low_presence_events: number;
  last_sample_at?: string;
}

// ---- Institute ----
export interface Institute {
  id: string;
  name: string;
  slug: string;
  logo_url?: string;
  created_at: string;
}

// ---- User ----
export interface User {
  id: string;
  auth_id: string;
  institute_id: string;
  role: UserRole;
  email: string;
  full_name?: string;
  avatar_url?: string;
  created_at: string;
}

// ---- Profile ----
export interface SkillEntry {
  name: string;
  level: number; // 1–5 self-rated
}

export interface Profile {
  user_id: string;
  branch?: string;
  semester?: number;
  cgpa_band?: string;
  target_role?: string;
  skills_json: SkillEntry[];
  hours_per_week: number;
  onboarding_done: boolean;
  updated_at: string;
}

// ---- Roadmap ----
export interface WeekPlan {
  week: number;
  focus_area: string;
  topics: string[];
  practice_tasks: string[];
  project_suggestion: string;
  soft_skill_task: string;
}

export interface Roadmap {
  id: string;
  user_id: string;
  institute_id: string;
  plan_json: WeekPlan[];
  duration_months: number;
  status: 'active' | 'archived';
  created_at: string;
  updated_at: string;
}

export interface RoadmapProgress {
  id: string;
  roadmap_id: string;
  user_id: string;
  week_number: number;
  completed: boolean;
  notes?: string;
  updated_at: string;
}

// ---- Resume ----
export interface ParsedResume {
  name: string;
  summary: string;
  skills: string[];
  education: { degree: string; institution: string; year: string; gpa?: string }[];
  experience: { title: string; company: string; duration: string; bullets: string[] }[];
  projects: { name: string; description: string; tech: string[] }[];
}

export interface ResumeFeedback {
  id: string;
  user_id: string;
  institute_id: string;
  raw_resume_text: string;
  target_role?: string;
  job_description?: string;
  ats_score: number;
  parsed_json: ParsedResume;
  strengths_json: string[];
  weaknesses_json: string[];
  improvement_actions_json: string[];
  improved_resume_text: string;
  created_at: string;
}

// ---- Mock Interview ----
export interface TranscriptEntry {
  role: 'interviewer' | 'candidate';
  content: string;
  timestamp: string;
}

export interface QuestionScore {
  question_index: number;
  question: string;
  score: number; // 0–10
  feedback: string;
}

export interface MockInterview {
  id: string;
  user_id: string;
  institute_id: string;
  mode: InterviewMode;
  status: InterviewStatus;
  target_role?: string;
  transcript_json: TranscriptEntry[];
  question_scores_json: QuestionScore[];
  webcam_metrics_json?: WebcamMetricsSummary;
  overall_score?: number;
  summary?: string;
  strengths?: string[];
  weaknesses?: string[];
  created_at: string;
  completed_at?: string;
}

// ---- TPO ----
export interface CohortFilters {
  batch?: string;
  branch?: string;
  year?: number;
}

export interface WeeklyTrainingPlan {
  week: number;
  topics: string[];
  activities: string[];
  suggested_format: string;
  focus_areas: string[];
}

export interface TrainingPlan {
  id: string;
  institute_id: string;
  created_by: string;
  filters_json: CohortFilters;
  cohort_stats: Record<string, unknown>;
  plan_json: WeeklyTrainingPlan[];
  created_at: string;
}

// ---- Activity Log ----
export interface ActivityLog {
  id: string;
  user_id: string;
  action: string;
  metadata?: Record<string, unknown>;
  created_at: string;
}
