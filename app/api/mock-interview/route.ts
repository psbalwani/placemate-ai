import { auth } from '@/auth';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { runInterviewTurn } from '@/lib/ai/mock-interview';
import { AIQuotaError } from '@/lib/ai/client';
import {
  createInterview,
  getInterview,
  updateInterview,
  updateInterviewWebcamMetrics,
  getUserInterviews,
  getProfile,
  getLatestResumeFeedback,
  logActivity,
} from '@/lib/db/queries';
import type { WebcamMetricsSummary } from '@/types/database';
import type { InterviewConfig } from '@/types/ai';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const userId = session.user.id;
    const instituteId = ((session.user as Record<string, unknown>).institute_id as string) ?? null;
    const body = await request.json();
    const { action } = body;

    // ── START ──────────────────────────────────────────────────
    if (action === 'start') {
      const {
        target_role = 'Software Engineer',
        interview_type = 'mixed',
        tech_questions = 3,
        hr_questions = 3,
        company_type = 'any',
      } = body;

      const profile = await getProfile(userId);
      const resume = await getLatestResumeFeedback(userId);
      const role = target_role || profile?.target_role || 'Software Engineer';

      // Build user context from profile + resume for personalised questions
      const parsedResume = resume?.parsed_json as Record<string, unknown> | null ?? null;
      const userContext = {
        skills: Array.isArray(profile?.skills_json) ? profile.skills_json as Array<{ name: string; level: number }> : undefined,
        branch: profile?.branch as string | undefined,
        cgpa_band: profile?.cgpa_band as string | undefined,
        interests: Array.isArray(profile?.interests_json) ? profile.interests_json as string[] : undefined,
        projects: parsedResume?.projects
          ? (parsedResume.projects as Array<{ name: string }>).map(p => p.name).filter(Boolean)
          : undefined,
        resume_summary: parsedResume?.summary as string | undefined
          ?? (resume?.raw_resume_text as string | undefined)?.slice(0, 800),
      };

      const config: InterviewConfig = {
        interview_type,
        tech_questions: Number(tech_questions),
        hr_questions: Number(hr_questions),
        company_type,
        target_role: role,
      };

      const interview = await createInterview(userId, instituteId, role);
      const aiResponse = await runInterviewTurn(role, [], undefined, config, userContext);

      await updateInterview(interview.id, {
        transcript_json: [{ role: 'interviewer', content: aiResponse.next_question, timestamp: new Date().toISOString() }],
        question_scores_json: [],
        status: 'in_progress',
        webcam_metrics_json: { config, userContext } as unknown as Record<string, unknown>,
      });

      return NextResponse.json({ success: true, interview_id: interview.id, ai: aiResponse, config });
    }

    // ── ANSWER ─────────────────────────────────────────────────
    if (action === 'answer') {
      const { interview_id, answer } = body;
      const interview = await getInterview(interview_id, userId);

      if (!interview) return NextResponse.json({ error: 'Interview not found' }, { status: 404 });
      if (interview.status !== 'in_progress') return NextResponse.json({ error: 'Interview already completed' }, { status: 400 });

      const transcript = (interview.transcript_json as unknown[]) ?? [];
      const scores = (interview.question_scores_json as unknown[]) ?? [];

      // Extract config + userContext stored at interview start
      const storedMeta = (interview.webcam_metrics_json as Record<string, unknown> | null) ?? {};
      const config = (storedMeta.config as Partial<InterviewConfig>) ?? {};
      const userContext = storedMeta.userContext as Parameters<typeof runInterviewTurn>[4] | undefined;

      const updatedTranscript = [
        ...transcript,
        { role: 'candidate', content: answer, timestamp: new Date().toISOString() },
      ];

      const aiResponse = await runInterviewTurn(
        interview.target_role as string,
        (transcript as { role: string; content: string }[]).map((t) => ({
          role: t.role as 'interviewer' | 'candidate',
          content: t.content,
        })),
        answer,
        config,
        userContext,
      );

      if (aiResponse.next_question) {
        updatedTranscript.push({
          role: 'interviewer',
          content: aiResponse.next_question,
          timestamp: new Date().toISOString(),
        });
      }

      const updatedScores = aiResponse.previous_score > 0
        ? [...scores, {
            question_index: scores.length,
            question: (transcript as { role: string; content: string }[]).filter((t) => t.role === 'interviewer').pop()?.content ?? '',
            score: aiResponse.previous_score,
            feedback: aiResponse.feedback_on_previous,
            multi_score: aiResponse.multi_score ?? null,
          }]
        : scores;

      const updateData: Record<string, unknown> = {
        transcript_json: updatedTranscript,
        question_scores_json: updatedScores,
        status: aiResponse.is_complete ? 'completed' : 'in_progress',
        overall_score: aiResponse.is_complete && aiResponse.overall_result ? aiResponse.overall_result.score : null,
        summary: aiResponse.is_complete && aiResponse.overall_result ? aiResponse.overall_result.summary : null,
        completed_at: aiResponse.is_complete ? new Date().toISOString() : null,
      };

      await updateInterview(interview_id, updateData);

      if (aiResponse.is_complete) {
        await logActivity(userId, 'interview_completed', {
          interview_id,
          score: aiResponse.overall_result?.score,
        });
      }

      return NextResponse.json({ success: true, ai: aiResponse });
    }

    if (action === 'update_webcam_metrics') {
      const { interview_id, metrics } = body as {
        interview_id: string;
        metrics: { brightness: number; blur: number; presence: number; captured_at: string };
      };

      if (!interview_id || !metrics) {
        return NextResponse.json({ error: 'Missing interview_id or metrics' }, { status: 400 });
      }

      const interview = await getInterview(interview_id, userId);
      if (!interview) return NextResponse.json({ error: 'Interview not found' }, { status: 404 });

      const prev = ((interview.webcam_metrics_json as WebcamMetricsSummary | null) ?? {
        samples: 0,
        avg_brightness: 0,
        avg_blur: 0,
        avg_presence: 0,
        low_light_events: 0,
        low_presence_events: 0,
      }) as WebcamMetricsSummary;

      const sampleCount = (prev.samples ?? 0) + 1;

      const next: WebcamMetricsSummary = {
        samples: sampleCount,
        avg_brightness: (((prev.avg_brightness ?? 0) * (sampleCount - 1)) + metrics.brightness) / sampleCount,
        avg_blur: (((prev.avg_blur ?? 0) * (sampleCount - 1)) + metrics.blur) / sampleCount,
        avg_presence: (((prev.avg_presence ?? 0) * (sampleCount - 1)) + metrics.presence) / sampleCount,
        low_light_events: (prev.low_light_events ?? 0) + (metrics.brightness < 30 ? 1 : 0),
        low_presence_events: (prev.low_presence_events ?? 0) + (metrics.presence < 40 ? 1 : 0),
        last_sample_at: metrics.captured_at,
      };

      await updateInterviewWebcamMetrics(interview_id, userId, next as unknown as Record<string, unknown>);
      return NextResponse.json({ success: true, webcam_metrics: next });
    }

    // ── GET RESULT ─────────────────────────────────────────────
    if (action === 'get_result') {
      const { interview_id } = body;
      const interview = await getInterview(interview_id, userId);
      if (!interview) return NextResponse.json({ error: 'Not found' }, { status: 404 });
      return NextResponse.json({ interview });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (err) {
    console.error('[POST /api/mock-interview]', err);
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

    const interviews = await getUserInterviews(session.user.id);
    return NextResponse.json({ interviews });
  } catch (err) {
    console.error('[GET /api/mock-interview]', err);
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
