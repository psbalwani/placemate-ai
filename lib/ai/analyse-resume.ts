import { generateJSON } from './client';
import { buildResumePrompt } from './prompts';
import type { ResumeAIResponse } from '@/types/ai';

export async function analyseResume(
  resumeText: string,
  targetRole: string,
  jobDescription?: string
): Promise<ResumeAIResponse> {
  const prompt = buildResumePrompt(resumeText, targetRole, jobDescription);
  const result = await generateJSON<ResumeAIResponse>(prompt);

  // Validate required fields
  if (typeof result.ats_score !== 'number') result.ats_score = 50;
  if (!Array.isArray(result.strengths)) result.strengths = [];
  if (!Array.isArray(result.weaknesses)) result.weaknesses = [];
  if (!Array.isArray(result.improvement_actions)) result.improvement_actions = [];
  if (!result.improved_resume_text) result.improved_resume_text = resumeText;

  return result;
}
