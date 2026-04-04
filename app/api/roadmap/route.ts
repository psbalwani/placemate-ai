import { auth } from '@/auth';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { generateRoadmap } from '@/lib/ai/generate-roadmap';
import { AIQuotaError } from '@/lib/ai/client';
import {
  getActiveRoadmap,
  archiveUserRoadmaps,
  createRoadmap,
  updateRoadmapProgress,
  getProfile,
  logActivity,
} from '@/lib/db/queries';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const roadmap = await getActiveRoadmap(session.user.id);
    return NextResponse.json({ roadmap: roadmap ?? null });
  } catch (err) {
    console.error('[GET /api/roadmap]', err);
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { action } = body;
    const userId = session.user.id;
    const instituteId = ((session.user as Record<string, unknown>).institute_id as string) ?? null;

    if (action === 'generate') {
      const profile = await getProfile(userId);
      if (!profile) return NextResponse.json({ error: 'Profile not found. Complete onboarding first.' }, { status: 400 });
      if (!profile.target_role) return NextResponse.json({ error: 'Please set a target role in your profile' }, { status: 400 });

      await archiveUserRoadmaps(userId);

      const duration = body.duration_months ?? 3;
      const weeks = await generateRoadmap({
        branch: profile.branch ?? 'CSE',
        semester: profile.semester ?? 6,
        cgpa_band: profile.cgpa_band ?? '7.0-8.0',
        target_role: profile.target_role,
        skills_json: profile.skills_json ?? [],
        hours_per_week: profile.hours_per_week ?? 10,
        duration_months: duration,
      });

      const roadmap = await createRoadmap(userId, instituteId, weeks, duration);
      await logActivity(userId, 'roadmap_generated', { weeks: weeks.length, target_role: profile.target_role });

      return NextResponse.json({ success: true, roadmap });
    }

    if (action === 'update_progress') {
      const { roadmap_id, week_number, completed, notes } = body;
      await updateRoadmapProgress(roadmap_id, userId, week_number, completed, notes);
      if (completed) await logActivity(userId, 'roadmap_progress_updated', { week_number, roadmap_id });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (err) {
    console.error('[POST /api/roadmap]', err);
    if (err instanceof AIQuotaError) {
      return NextResponse.json(
        { error: err.message, retryAfterSeconds: err.retryAfterSeconds },
        { status: 429 },
      );
    }
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
