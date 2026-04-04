import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getCohortStats, saveTrainingPlan, listTrainingPlans } from '@/lib/db/queries';
import { generateJSON } from '@/lib/ai/client';
import { buildTrainingPlanPrompt } from '@/lib/ai/prompts';
import type { GenerateTrainingPlanInput } from '@/types/ai';

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const user = session.user as Record<string, unknown>;
  if (!['tpo', 'admin'].includes(String(user.role ?? '')))
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const instituteId = String(user.institute_id ?? '');
  const plans = await listTrainingPlans(instituteId);
  return NextResponse.json({ plans });
}

// POST — generate a new 4-week training plan from cohort stats
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const user = session.user as Record<string, unknown>;
  if (!['tpo', 'admin'].includes(String(user.role ?? '')))
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const instituteId = String(user.institute_id ?? '');
  const userId = String(user.id ?? '');
  const body = await req.json().catch(() => ({}));
  const filters = body.filters ?? {};

  // Fetch live cohort stats
  const { avgScores, skillCounts, topRoles } = await getCohortStats(instituteId);

  const skillGaps: Record<string, number> = {};
  for (const row of skillCounts as Array<{ skill_name: string; avg_level: string }>) {
    const pct = Math.max(0, Math.round(((5 - parseFloat(row.avg_level)) / 5) * 100));
    skillGaps[row.skill_name] = pct;
  }

  const statsInput: GenerateTrainingPlanInput = {
    branch: filters.branch ?? 'All',
    batch: filters.batch ?? '2025',
    total_students: Number(avgScores?.total_students ?? 0),
    avg_readiness: Math.round((Number(avgScores?.avg_ats ?? 50) + Number(avgScores?.avg_interview ?? 50)) / 2),
    avg_ats: Number(avgScores?.avg_ats ?? 0),
    avg_interview: Number(avgScores?.avg_interview ?? 0),
    skill_gaps: skillGaps,
    top_roles: (topRoles as Array<{ target_role: string }>).map((r) => r.target_role),
  };

  // Call AI
  const planJson = await generateJSON<unknown[]>(buildTrainingPlanPrompt(statsInput));

  // Save to DB
  const plan = await saveTrainingPlan({
    instituteId,
    createdBy: userId,
    filtersJson: filters,
    cohortStatsJson: statsInput as unknown as Record<string, unknown>,
    planJson,
  });

  return NextResponse.json({ success: true, plan });
}
