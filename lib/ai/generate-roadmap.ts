import { generateJSON } from './client';
import { buildRoadmapPrompt } from './prompts';
import type { GenerateRoadmapInput, RoadmapAIResponse } from '@/types/ai';
import type { WeekPlan } from '@/types/database';

export async function generateRoadmap(input: GenerateRoadmapInput): Promise<WeekPlan[]> {
  const prompt = buildRoadmapPrompt(input);
  const weeks = await generateJSON<WeekPlan[]>(prompt);

  if (!Array.isArray(weeks)) {
    throw new Error('AI returned invalid roadmap format');
  }

  // Normalise and validate
  return weeks.map((w, idx) => ({
    week: w.week ?? idx + 1,
    focus_area: w.focus_area ?? 'General',
    topics: Array.isArray(w.topics) ? w.topics : [],
    practice_tasks: Array.isArray(w.practice_tasks) ? w.practice_tasks : [],
    project_suggestion: w.project_suggestion ?? '',
    soft_skill_task: w.soft_skill_task ?? '',
  }));
}
