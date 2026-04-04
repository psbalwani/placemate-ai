import { auth } from '@/auth';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { analyseResume } from '@/lib/ai/analyse-resume';
import { extractTextFromPDF } from '@/lib/pdf-parser';
import { createResumeFeedback, getLatestResumeFeedback, logActivity } from '@/lib/db/queries';
import { sql } from '@/lib/db';
import { AIQuotaError } from '@/lib/ai/client';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const userId = session.user.id;
    const instituteId = ((session.user as Record<string, unknown>).institute_id as string) ?? null;

    let resumeText = '';
    let targetRole = '';
    let jobDescription: string | undefined;

    const contentType = request.headers.get('content-type') ?? '';

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = formData.get('resume_file') as File | null;
      const pastedText = formData.get('resume_text') as string | null;
      targetRole = (formData.get('target_role') as string) ?? '';
      jobDescription = (formData.get('job_description') as string) || undefined;

      if (file && file.size > 0) {
        if (file.type === 'application/pdf') {
          const ab = await file.arrayBuffer();
          resumeText = await extractTextFromPDF(Buffer.from(ab));
        } else {
          resumeText = await file.text();
        }
      } else if (pastedText) {
        resumeText = pastedText;
      }
    } else {
      const body = await request.json();
      resumeText = body.resume_text ?? '';
      targetRole = body.target_role ?? '';
      jobDescription = body.job_description;
    }

    if (!resumeText.trim()) {
      return NextResponse.json({ error: 'No resume text provided' }, { status: 400 });
    }

    const analysis = await analyseResume(resumeText, targetRole || 'Software Engineer', jobDescription);

    const feedback = await createResumeFeedback({
      userId,
      instituteId,
      rawResumeText: resumeText,
      targetRole,
      jobDescription,
      atsScore: analysis.ats_score,
      parsedJson: analysis.parsed_sections,
      strengthsJson: analysis.strengths,
      weaknessesJson: analysis.weaknesses,
      improvementActionsJson: analysis.improvement_actions,
      improvedResumeText: analysis.improved_resume_text,
    });

    await logActivity(userId, 'resume_analyzed', { ats_score: analysis.ats_score, target_role: targetRole });

    return NextResponse.json({ success: true, feedback });
  } catch (err) {
    console.error('[POST /api/resume/ats-check]', err);
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

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const feedbacks = await sql`
      SELECT id, ats_score, target_role, created_at
      FROM resume_feedback
      WHERE user_id = ${session.user.id}
      ORDER BY created_at DESC
      LIMIT 5
    `;

    const latest = await getLatestResumeFeedback(session.user.id);

    return NextResponse.json({ feedbacks, latest });
  } catch (err) {
    console.error('[GET /api/resume/ats-check]', err);
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
