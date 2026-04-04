import { generateJSON } from './client';
import { buildTrainingPlanPrompt } from './prompts';
import type { GenerateTrainingPlanInput, TrainingPlanAIResponse } from '@/types/ai';
import type { WeeklyTrainingPlan } from '@/types/database';

export async function generateTrainingPlan(
  input: GenerateTrainingPlanInput
): Promise<WeeklyTrainingPlan[]> {
  const prompt = buildTrainingPlanPrompt(input);
  const weeks = await generateJSON<WeeklyTrainingPlan[]>(prompt);

  if (!Array.isArray(weeks)) {
    throw new Error('AI returned invalid training plan format');
  }

  return weeks.map((w, idx) => ({
    week: w.week ?? idx + 1,
    topics: Array.isArray(w.topics) ? w.topics : [],
    activities: Array.isArray(w.activities) ? w.activities : [],
    suggested_format: w.suggested_format ?? 'workshop',
    focus_areas: Array.isArray(w.focus_areas) ? w.focus_areas : [],
  }));
}
