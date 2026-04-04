import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getDriveById, getEligibleStudents, upsertShortlistEntry, getDriveShortlist, updateShortlistStatus } from '@/lib/db/queries';

const CGPA_ORDER: Record<string, number> = {
  'below_6': 1, '6_to_7': 2, '7_to_8': 3, '8_to_9': 4, '9_plus': 5,
  '6.0': 2, '7.0': 3, '8.0': 4, '9.0': 5,
};

function cgpaLevel(band: string): number {
  return CGPA_ORDER[band] ?? 2;
}

// Compute skill overlap % between student skills and JD required_skills
function skillOverlap(studentSkills: Array<{ name: string; level: number }>, requiredSkills: string[]): number {
  if (!requiredSkills.length) return 0.5;
  const studentSet = new Set(studentSkills.map((s) => s.name.toLowerCase()));
  const matched = requiredSkills.filter((s) => studentSet.has(s.toLowerCase())).length;
  return matched / requiredSkills.length;
}

// GET /api/tpo/drives/[id]/shortlist — get existing shortlist
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const user = session.user as Record<string, unknown>;
  if (!['tpo', 'admin'].includes(String(user.role ?? '')))
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await params;
  const rows = await getDriveShortlist(id);
  return NextResponse.json({ shortlist: rows });
}

// POST /api/tpo/drives/[id]/shortlist — generate / re-run shortlist
export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const user = session.user as Record<string, unknown>;
  if (!['tpo', 'admin'].includes(String(user.role ?? '')))
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id: driveId } = await params;
  const instituteId = String(user.institute_id ?? '');

  const drive = await getDriveById(driveId, instituteId);
  if (!drive) return NextResponse.json({ error: 'Drive not found' }, { status: 404 });

  const eligibility = (drive.eligibility_json as Record<string, unknown>) ?? {};
  const scoringConfig = (drive.scoring_config_json as Record<string, unknown>) ?? {};
  const parsedJd = (drive.parsed_jd_json as Record<string, unknown>) ?? {};
  const requiredSkills = (parsedJd.required_skills as string[]) ?? [];

  const weights = {
    ats: Number(scoringConfig.ats_weight ?? 0.30),
    interview: Number(scoringConfig.interview_weight ?? 0.25),
    readiness: Number(scoringConfig.readiness_weight ?? 0.25),
    skill: Number(scoringConfig.skill_overlap_weight ?? 0.20),
  };

  // Filter + score all students
  const allStudents = await getEligibleStudents(instituteId, eligibility as { branches?: string[] });

  const allowedBranches = (eligibility.branches as string[]) ?? [];
  const minCgpa = cgpaLevel(String(eligibility.min_cgpa_band ?? '6.0'));

  const scored = allStudents
    .filter((s) => {
      if (allowedBranches.length && !allowedBranches.includes(s.branch)) return false;
      if (cgpaLevel(s.cgpa_band) < minCgpa) return false;
      return true;
    })
    .map((s) => {
      const atsNorm = (s.ats_score ?? 50) / 100;
      const interviewNorm = (s.interview_score ?? 50) / 100;
      // Simple readiness proxy = average of ats + interview
      const readinessNorm = (atsNorm + interviewNorm) / 2;
      const skillPct = skillOverlap(s.skills_json ?? [], requiredSkills);

      const driveScore = Math.round(
        (atsNorm * weights.ats +
          interviewNorm * weights.interview +
          readinessNorm * weights.readiness +
          skillPct * weights.skill) *
          100
      );

      // Build reasons array
      const reasons: string[] = [];
      if (atsNorm >= 0.7) reasons.push(`ATS ${s.ats_score}/100 — strong resume match`);
      if (interviewNorm >= 0.7) reasons.push(`Interview ${s.interview_score}/100 — solid performance`);
      if (skillPct >= 0.5) reasons.push(`${Math.round(skillPct * 100)}% JD skill overlap`);
      if (!reasons.length) reasons.push('Eligible by branch and CGPA');

      return { student: s, driveScore, reasons };
    })
    .sort((a, b) => b.driveScore - a.driveScore);

  // Upsert all entries
  await Promise.all(
    scored.map(({ student, driveScore, reasons }) =>
      upsertShortlistEntry({
        driveId,
        studentUserId: student.id,
        driveScore,
        reasonsJson: reasons,
      })
    )
  );

  const shortlist = await getDriveShortlist(driveId);
  return NextResponse.json({ success: true, shortlist, total: shortlist.length });
}

// PATCH /api/tpo/drives/[id]/shortlist — update a student's status
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const user = session.user as Record<string, unknown>;
  if (!['tpo', 'admin'].includes(String(user.role ?? '')))
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id: driveId } = await params;
  const { student_user_id, status } = await req.json();
  if (!student_user_id || !status) return NextResponse.json({ error: 'student_user_id and status required' }, { status: 400 });

  const VALID = ['pending', 'invited', 'rejected', 'waitlist'];
  if (!VALID.includes(status)) return NextResponse.json({ error: `status must be one of: ${VALID.join(', ')}` }, { status: 400 });

  const row = await updateShortlistStatus(driveId, student_user_id, status);
  return NextResponse.json({ success: true, entry: row });
}
