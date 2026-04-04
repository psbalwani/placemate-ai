import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { createDrive, listDrives } from '@/lib/db/queries';
import { generateJSON } from '@/lib/ai/client';
import { buildJDParsePrompt } from '@/lib/ai/prompts';

// GET /api/tpo/drives — list drives for institute
export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const user = session.user as Record<string, unknown>;
  if (!['tpo', 'admin'].includes(String(user.role ?? '')))
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const instituteId = String(user.institute_id ?? '');
  if (!instituteId) return NextResponse.json({ error: 'No institute' }, { status: 400 });

  const drives = await listDrives(instituteId);
  return NextResponse.json({ drives });
}

// POST /api/tpo/drives — create drive: AI parse JD + save
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const user = session.user as Record<string, unknown>;
  if (!['tpo', 'admin'].includes(String(user.role ?? '')))
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const instituteId = String(user.institute_id ?? '');
  const userId = String(user.id ?? '');
  if (!instituteId) return NextResponse.json({ error: 'No institute' }, { status: 400 });

  const body = await req.json();
  const { company_name, role_title, jd_text, ctc, location, drive_date } = body;

  if (!company_name || !role_title || !jd_text)
    return NextResponse.json({ error: 'company_name, role_title, and jd_text are required' }, { status: 400 });

  // AI parse the JD
  let parsedJd: Record<string, unknown> = {};
  try {
    parsedJd = await generateJSON<Record<string, unknown>>(buildJDParsePrompt(jd_text));
  } catch (err) {
    console.error('JD parse failed, using empty:', err);
  }

  // Build default eligibility from AI hints
  const hints = (parsedJd.eligibility_hints ?? {}) as Record<string, unknown>;
  const eligibilityJson = {
    branches: hints.branches ?? ['CSE', 'IT', 'ECE', 'EE', 'ME'],
    min_cgpa_band: hints.min_cgpa ? String(hints.min_cgpa) : '6.0',
    batch_year: hints.batch_year ?? null,
  };
  const scoringConfigJson = {
    ats_weight: 0.30,
    interview_weight: 0.25,
    readiness_weight: 0.25,
    skill_overlap_weight: 0.20,
  };

  const drive = await createDrive({
    instituteId,
    createdBy: userId,
    companyName: company_name,
    roleTitle: role_title,
    jdText: jd_text,
    parsedJdJson: parsedJd,
    eligibilityJson,
    scoringConfigJson,
    ctc,
    location,
    driveDate: drive_date ?? null,
  });

  return NextResponse.json({ success: true, drive });
}
