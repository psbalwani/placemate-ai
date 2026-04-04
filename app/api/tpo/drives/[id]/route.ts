import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getDriveById, updateDriveEligibility } from '@/lib/db/queries';

// GET /api/tpo/drives/[id]
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const user = session.user as Record<string, unknown>;
  if (!['tpo', 'admin'].includes(String(user.role ?? '')))
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await params;
  const instituteId = String(user.institute_id ?? '');
  const drive = await getDriveById(id, instituteId);
  if (!drive) return NextResponse.json({ error: 'Drive not found' }, { status: 404 });

  return NextResponse.json({ drive });
}

// PATCH /api/tpo/drives/[id] — update eligibility / status
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const user = session.user as Record<string, unknown>;
  if (!['tpo', 'admin'].includes(String(user.role ?? '')))
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await params;
  const instituteId = String(user.institute_id ?? '');
  const body = await req.json();
  const { eligibility_json, scoring_config_json, status } = body;

  const drive = await updateDriveEligibility(id, instituteId, eligibility_json, scoring_config_json, status);
  if (!drive) return NextResponse.json({ error: 'Drive not found' }, { status: 404 });

  return NextResponse.json({ success: true, drive });
}
