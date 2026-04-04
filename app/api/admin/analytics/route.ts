import { auth } from '@/auth';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { generateTrainingPlan } from '@/lib/ai/training-plan';
import { sql } from '@/lib/db';

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const role = ((session.user as Record<string, unknown>).role as string) ?? 'student';
  const instituteId = ((session.user as Record<string, unknown>).institute_id as string) ?? null;

  if (!['tpo', 'admin'].includes(role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  if (!instituteId) {
    return NextResponse.json({ error: 'No institute associated with your account' }, { status: 400 });
  }

  const { searchParams } = new URL(request.url);
  const branch = searchParams.get('branch');

  // Fetch students
  const students = await sql`
    SELECT id, full_name, email, created_at
    FROM users
    WHERE institute_id = ${instituteId} AND role = 'student'
    ${branch ? sql`AND id IN (SELECT user_id FROM profiles WHERE branch = ${branch})` : sql``}
  `;

  const studentIds = students.map((s) => s.id as string);

  if (studentIds.length === 0) {
    return NextResponse.json({
      stats: { total_students: 0, avg_ats: 0, avg_interview: 0, avg_readiness: 0, skill_gaps: {}, top_roles: [] },
      students: [],
    });
  }

  // Aggregate data
  const [profiles, resumes, interviews] = await Promise.all([
    sql`SELECT user_id, target_role, skills_json, branch FROM profiles WHERE user_id = ANY(${studentIds}::uuid[])`,
    sql`SELECT user_id, ats_score FROM resume_feedback WHERE user_id = ANY(${studentIds}::uuid[])`,
    sql`SELECT user_id, overall_score FROM mock_interviews WHERE status = 'completed' AND user_id = ANY(${studentIds}::uuid[])`,
  ]);

  const avgAts = resumes.length > 0
    ? Math.round(resumes.reduce((a, b) => a + ((b.ats_score as number) ?? 0), 0) / resumes.length)
    : 0;

  const avgInterview = interviews.length > 0
    ? Math.round(interviews.reduce((a, b) => a + ((b.overall_score as number) ?? 0), 0) / interviews.length)
    : 0;

  // Skill gap analysis
  const skillCounts: Record<string, number> = {};
  profiles.forEach((p) => {
    const skills: { name: string; level: number }[] = (p.skills_json as { name: string; level: number }[]) ?? [];
    skills.forEach((s) => {
      if (s.level <= 2) skillCounts[s.name] = (skillCounts[s.name] ?? 0) + 1;
    });
  });
  const skillGaps: Record<string, number> = {};
  for (const [skill, count] of Object.entries(skillCounts)) {
    skillGaps[skill] = Math.round((count / studentIds.length) * 100);
  }

  const roleCounts: Record<string, number> = {};
  profiles.forEach((p) => {
    if (p.target_role) roleCounts[p.target_role as string] = (roleCounts[p.target_role as string] ?? 0) + 1;
  });
  const topRoles = Object.entries(roleCounts).sort(([, a], [, b]) => b - a).slice(0, 5).map(([r]) => r);

  const avgReadiness = Math.round(avgAts * 0.35 + avgInterview * 0.35 + 30);

  const enrichedStudents = students.map((s) => {
    const profile = profiles.find((p) => p.user_id === s.id);
    const resume = resumes.filter((r) => r.user_id === s.id).sort((a, b) => ((b.ats_score as number) ?? 0) - ((a.ats_score as number) ?? 0))[0];
    const interview = interviews.filter((i) => i.user_id === s.id).sort((a, b) => ((b.overall_score as number) ?? 0) - ((a.overall_score as number) ?? 0))[0];
    return {
      ...s,
      target_role: profile?.target_role ?? null,
      branch: profile?.branch ?? null,
      ats_score: resume?.ats_score ?? null,
      interview_score: interview?.overall_score ?? null,
    };
  });

  return NextResponse.json({
    stats: { total_students: studentIds.length, avg_ats: avgAts, avg_interview: avgInterview, avg_readiness: avgReadiness, skill_gaps: skillGaps, top_roles: topRoles },
    students: enrichedStudents,
  });
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const role = ((session.user as Record<string, unknown>).role as string) ?? 'student';
  const instituteId = ((session.user as Record<string, unknown>).institute_id as string) ?? null;

  if (!['tpo', 'admin'].includes(role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json();

  if (body.action === 'generate_training_plan') {
    const { stats, filters } = body;
    const weeks = await generateTrainingPlan({
      branch: filters?.branch ?? 'CSE',
      batch: filters?.batch ?? '2025',
      total_students: stats.total_students,
      avg_readiness: stats.avg_readiness,
      skill_gaps: stats.skill_gaps,
      avg_ats: stats.avg_ats,
      avg_interview: stats.avg_interview,
      top_roles: stats.top_roles,
    });

    const [plan] = await sql`
      INSERT INTO tpo_training_plans (institute_id, created_by, filters_json, cohort_stats, plan_json)
      VALUES (${instituteId}, ${session.user.id}, ${JSON.stringify(filters ?? {})}::jsonb, ${JSON.stringify(stats)}::jsonb, ${JSON.stringify(weeks)}::jsonb)
      RETURNING *
    `;

    return NextResponse.json({ success: true, plan });
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
}
