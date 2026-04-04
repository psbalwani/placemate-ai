// AI request/response types for Placemate AI

import type { WeekPlan, ParsedResume, WeeklyTrainingPlan } from './database';

// ---- Roadmap AI ----
export interface GenerateRoadmapInput {
  branch: string;
  semester: number;
  cgpa_band: string;
  target_role: string;
  skills_json: Array<{ name: string; level: number }>;
  hours_per_week: number;
  duration_months?: number;
}

export interface RoadmapAIResponse {
  weeks: WeekPlan[];
}

// ---- Resume ATS AI ----
export interface AnalyseResumeInput {
  resume_text: string;
  target_role: string;
  job_description?: string;
}

export interface ResumeAIResponse {
  parsed_sections: ParsedResume;
  ats_score: number;
  strengths: string[];
  weaknesses: string[];
  improvement_actions: string[];
  improved_resume_text: string;
}

// ---- Mock Interview Config ----
export type InterviewType = 'tech' | 'hr' | 'mixed';
export type CompanyType = 'product' | 'service' | 'startup' | 'any';

export interface InterviewConfig {
  interview_type: InterviewType;
  tech_questions: number;
  hr_questions: number;
  company_type: CompanyType;
  target_role: string;
}

// ---- Multi-Dimensional Score ----
export interface MultiDimensionalScore {
  technical: number;    // 0-10: correctness, depth
  clarity: number;      // 0-10: how clearly communicated
  structure: number;    // 0-10: logical flow, STAR format
  confidence: number;   // 0-10: assertiveness, no hedging
  relevance: number;    // 0-10: on-topic, addresses the question
}

// ---- Mock Interview AI ----
export interface InterviewTurnInput {
  target_role: string;
  transcript: Array<{ role: 'interviewer' | 'candidate'; content: string }>;
  candidate_answer?: string;
  config?: InterviewConfig;
}

export interface InterviewTurnResponse {
  question_type?: 'main' | 'followup' | 'transition'; // natural interview flow
  next_question: string | null;
  feedback_on_previous: string;
  previous_score: number;
  multi_score?: MultiDimensionalScore | null;
  is_complete: boolean;
  overall_result?: {
    score: number;
    summary: string;
    strengths: string[];
    weaknesses: string[];
    avg_multi_score?: MultiDimensionalScore;
  };
}

// ---- Copilot Hints ----
export interface CopilotHint {
  type: 'warning' | 'suggestion' | 'positive';
  text: string;
}

// ---- TPO Training Plan AI ----
export interface GenerateTrainingPlanInput {
  branch: string;
  batch: string;
  total_students: number;
  avg_readiness: number;
  skill_gaps: Record<string, number>; // skill -> % weak
  avg_ats: number;
  avg_interview: number;
  top_roles: string[];
}

export interface TrainingPlanAIResponse {
  weeks: WeeklyTrainingPlan[];
}
