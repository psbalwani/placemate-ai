import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { ReadinessScore } from '@/components/dashboard/readiness-score';
import { MetricsCards } from '@/components/dashboard/metrics-cards';
import { NextActions } from '@/components/dashboard/next-actions';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatRelativeTime } from '@/lib/utils';
import { Clock, Sparkles } from 'lucide-react';
import { sql } from '@/lib/db';

function calcReadiness(
  atsScore: number,
  interviewScore: number,
  roadmapPct: number,
  profileDone: boolean
): number {
  const base = profileDone ? 10 : 0;
  return Math.round(base + roadmapPct * 0.35 + atsScore * 0.3 + interviewScore * 0.25);
}

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const userId = session.user.id;
  const role = ((session.user as Record<string, unknown>).role as string) ?? 'student';

  // Redirect TPO/admin to admin dashboard
  if (role === 'tpo' || role === 'admin') redirect('/admin');

  const [profiles, roadmaps, interviews, resumes, activities] = await Promise.all([
    sql`SELECT * FROM profiles WHERE user_id = ${userId} LIMIT 1`,
    sql`SELECT id, plan_json, created_at FROM roadmaps WHERE user_id = ${userId} AND status = 'active' ORDER BY created_at DESC LIMIT 1`,
    sql`SELECT overall_score FROM mock_interviews WHERE user_id = ${userId} AND status = 'completed' ORDER BY created_at DESC LIMIT 1`,
    sql`SELECT ats_score FROM resume_feedback WHERE user_id = ${userId} ORDER BY created_at DESC LIMIT 1`,
    sql`SELECT action, metadata, created_at FROM activity_log WHERE user_id = ${userId} ORDER BY created_at DESC LIMIT 8`,
  ]);

  const profile = profiles[0] ?? null;
  const roadmap = roadmaps[0] ?? null;
  const interview = interviews[0] ?? null;
  const resume = resumes[0] ?? null;

  if (!profile?.onboarding_done) redirect('/profile');

  const atsScore = (resume?.ats_score as number) ?? 0;
  const interviewScore = (interview?.overall_score as number) ?? 0;

  // Roadmap progress
  let roadmapWeeksDone = 0;
  let totalWeeks = 0;
  let roadmapPct = 0;
  if (roadmap) {
    const weeks = Array.isArray(roadmap.plan_json) ? roadmap.plan_json : [];
    totalWeeks = weeks.length;
    const progress = await sql`
      SELECT week_number, completed FROM roadmap_progress WHERE roadmap_id = ${roadmap.id as string}
    `;
    roadmapWeeksDone = progress.filter((p) => p.completed).length;
    roadmapPct = totalWeeks > 0 ? Math.round((roadmapWeeksDone / totalWeeks) * 100) : 0;
  }

  const readinessScore = calcReadiness(atsScore, interviewScore, roadmapPct, !!profile?.onboarding_done);

  const ACTION_LABELS: Record<string, string> = {
    profile_updated: 'Updated profile',
    roadmap_generated: 'Generated roadmap',
    roadmap_progress_updated: 'Completed a roadmap week',
    resume_analyzed: 'Analysed resume',
    interview_completed: 'Completed mock interview',
  };

  const firstName = (session.user.name ?? session.user.email ?? 'there').split(' ')[0];
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Hero greeting */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {greeting}, {firstName}! 👋
          </h1>
          <p className="mt-1 text-muted-foreground">
            {profile.target_role
              ? `Preparing for ${profile.target_role as string} placements`
              : 'Your placement journey starts here'}
          </p>
        </div>
        <Badge variant="secondary" className="hidden sm:flex items-center gap-1.5">
          <Sparkles className="h-3 w-3" />
          {(profile.branch as string) ?? 'Engineering'}
        </Badge>
      </div>

      {/* Readiness + Metrics row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        <Card className="lg:col-span-1">
          <CardContent className="flex h-full items-center justify-center p-8">
            <ReadinessScore score={readinessScore} />
          </CardContent>
        </Card>
        <div className="lg:col-span-3">
          <MetricsCards
            roadmapProgress={roadmapPct}
            atsScore={atsScore}
            interviewScore={interviewScore}
            streakDays={activities.length > 0 ? Math.min(activities.length, 7) : 0}
          />
        </div>
      </div>

      {/* Actions + Activity */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <NextActions
            hasRoadmap={!!roadmap}
            hasResume={!!resume}
            hasInterview={!!interview}
            roadmapWeeksDone={roadmapWeeksDone}
            atsScore={atsScore}
          />
        </div>
        <div className="lg:col-span-2">
          <Card className="h-full">
            <CardHeader className="pb-3">
              <h3 className="font-semibold text-foreground">Recent Activity</h3>
            </CardHeader>
            <CardContent>
              {activities.length === 0 ? (
                <div className="py-8 text-center">
                  <Clock className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
                  <p className="text-sm text-muted-foreground">No activity yet</p>
                  <p className="text-xs text-muted-foreground mt-1">Start your journey above</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {activities.map((act, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-foreground">
                          {ACTION_LABELS[act.action as string] ?? (act.action as string)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatRelativeTime(act.created_at as string)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
