import { auth } from '@/auth';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getProfile, upsertProfile, logActivity } from '@/lib/db/queries';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const profile = await getProfile(session.user.id);
  return NextResponse.json({ profile });
}

export async function PUT(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const { branch, semester, cgpa_band, target_role, skills_json, hours_per_week } = body;

  const profile = await upsertProfile(session.user.id, {
    branch,
    semester,
    cgpa_band,
    target_role,
    skills_json: skills_json ?? [],
    hours_per_week: hours_per_week ?? 10,
    onboarding_done: true,
  });

  await logActivity(session.user.id, 'profile_updated', { branch, target_role });

  return NextResponse.json({ success: true, profile });
}
