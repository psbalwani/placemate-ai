import type {
  SkillEntry,
  Profile,
  Roadmap,
  ResumeFeedback,
  MockInterview,
  CohortFilters,
  WeeklyTrainingPlan,
  WebcamMetrics,
} from './database';

// ============================================================
// API Request / Response Types
// ============================================================

// ---- Profile ----
export interface UpdateProfileRequest {
  branch: string;
  semester: number;
  cgpa_band: string;
  target_role: string;
  skills_json: SkillEntry[];
  hours_per_week: number;
}

export interface ProfileResponse {
  success: boolean;
  profile?: Profile;
  error?: string;
}

// ---- Roadmap ----
export interface GenerateRoadmapRequest {
  action: 'generate';
  duration_months?: number; // default 3
}

export interface RoadmapResponse {
  success: boolean;
  roadmap?: Roadmap;
  error?: string;
}

// ---- Resume ATS ----
export interface ATSCheckRequest {
  resume_text?: string;
  target_role?: string;
  job_description?: string;
}

export interface ATSCheckResponse {
  success: boolean;
  feedback?: ResumeFeedback;
  error?: string;
}

// ---- Mock Interview ----
export interface StartInterviewRequest {
  action: 'start';
  target_role?: string;
}

export interface AnswerInterviewRequest {
  action: 'answer';
  interview_id: string;
  answer: string;
}

export interface EndInterviewRequest {
  action: 'end';
  interview_id: string;
}

export interface UpdateWebcamMetricsRequest {
  action: 'update_webcam_metrics';
  interview_id: string;
  metrics: WebcamMetrics;
}

export type MockInterviewRequest =
  | StartInterviewRequest
  | AnswerInterviewRequest
  | EndInterviewRequest
  | UpdateWebcamMetricsRequest;

export interface TruGenConfigResponse {
  enabled: boolean;
  agentId: string | null;
  embedUrl: string | null;
}

export interface InterviewTurnResponse {
  success: boolean;
  interview_id?: string;
  question?: string;
  feedback_on_previous?: string;
  previous_score?: number;
  is_complete?: boolean;
  interview?: MockInterview;
  error?: string;
}

// ---- Admin Analytics ----
export interface CohortStatsResponse {
  total_students: number;
  avg_readiness: number;
  avg_ats_score: number;
  avg_interview_score: number;
  skill_gaps: { skill: string; weak_percentage: number }[];
  top_target_roles: { role: string; count: number }[];
  readiness_distribution: { band: string; count: number }[];
}

export interface GenerateTrainingPlanRequest {
  action: 'generate_training_plan';
  filters: CohortFilters;
}

export interface TrainingPlanResponse {
  success: boolean;
  stats?: CohortStatsResponse;
  plan?: WeeklyTrainingPlan[];
  error?: string;
}

// ---- Dashboard ----
export interface DashboardData {
  readiness_score: number;
  roadmap_progress: number;
  latest_ats_score: number | null;
  latest_interview_score: number | null;
  next_actions: string[];
  recent_activity: { action: string; date: string }[];
}

// ---- Auth ----
export interface AuthUser {
  id: string;
  email: string;
  role: 'student' | 'tpo' | 'admin';
  institute_id: string;
  full_name?: string;
  onboarding_done: boolean;
}
