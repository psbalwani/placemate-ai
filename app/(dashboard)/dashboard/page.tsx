import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { ReadinessScore } from '@/components/dashboard/readiness-score';
import { MetricsCards } from '@/components/dashboard/metrics-cards';
import { NextActions } from '@/components/dashboard/next-actions';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatRelativeTime } from '@/lib/utils';
import {
  Clock, Sparkles, Map, FileText, MessageSquare, TrendingUp,
  Activity, Target, Zap, ArrowUpRight,
} from 'lucide-react';
import Link from 'next/link';
import { sql } from '@/lib/db';

function calcReadiness(atsScore: number, interviewScore: number, roadmapPct: number, profileDone: boolean): number {
  const base = profileDone ? 10 : 0;
  return Math.round(base + roadmapPct * 0.35 + atsScore * 0.3 + interviewScore * 0.25);
}

const ACTION_LABELS: Record<string, { label: string; icon: typeof Map; color: string }> = {
  profile_updated:          { label: 'Updated profile',          icon: Sparkles,      color: 'text-blue-400 bg-blue-500/15' },
  roadmap_generated:        { label: 'Generated AI roadmap',     icon: Map,           color: 'text-emerald-400 bg-emerald-500/15' },
  roadmap_progress_updated: { label: 'Completed a roadmap week', icon: TrendingUp,    color: 'text-amber-400 bg-amber-500/15' },
  resume_analyzed:          { label: 'Analysed resume',          icon: FileText,      color: 'text-violet-400 bg-violet-500/15' },
  interview_completed:      { label: 'Completed mock interview', icon: MessageSquare, color: 'text-rose-400 bg-rose-500/15' },
};

const QUICK_LINKS = [
  { href: '/roadmap',   label: 'AI Roadmap',   icon: Map,           color: 'from-blue-500/20 to-blue-600/5',   iconColor: 'text-blue-400',   iconBg: 'bg-blue-500/15 ring-blue-500/20' },
  { href: '/resume',    label: 'Resume ATS',   icon: FileText,      color: 'from-emerald-500/20 to-emerald-600/5', iconColor: 'text-emerald-400', iconBg: 'bg-emerald-500/15 ring-emerald-500/20' },
  { href: '/interview', label: 'Mock Interview',icon: MessageSquare, color: 'from-violet-500/20 to-violet-600/5',  iconColor: 'text-violet-400',  iconBg: 'bg-violet-500/15 ring-violet-500/20' },
];

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const userId = session.user.id;
  const role = ((session.user as Record<string, unknown>).role as string) ?? 'student';
  if (role === 'tpo' || role === 'admin') redirect('/admin');

  const [profiles, roadmaps, interviews, resumes, activities] = await Promise.all([
    sql`SELECT * FROM profiles WHERE user_id = ${userId} LIMIT 1`,
    sql`SELECT id, plan_json, created_at FROM roadmaps WHERE user_id = ${userId} AND status = 'active' ORDER BY created_at DESC LIMIT 1`,
    sql`SELECT overall_score FROM mock_interviews WHERE user_id = ${userId} AND status = 'completed' ORDER BY created_at DESC LIMIT 1`,
    sql`SELECT ats_score FROM resume_feedback WHERE user_id = ${userId} ORDER BY created_at DESC LIMIT 1`,
    sql`SELECT action, metadata, created_at FROM activity_log WHERE user_id = ${userId} ORDER BY created_at DESC LIMIT 8`,
  ]);

  const profile   = profiles[0] ?? null;
  const roadmap   = roadmaps[0] ?? null;
  const interview = interviews[0] ?? null;
  const resume    = resumes[0] ?? null;

  if (!profile?.onboarding_done) redirect('/profile');

  const atsScore       = (resume?.ats_score as number)       ?? 0;
  const interviewScore = (interview?.overall_score as number) ?? 0;

  let roadmapWeeksDone = 0;
  let totalWeeks       = 0;
  let roadmapPct       = 0;
  if (roadmap) {
    const weeks = Array.isArray(roadmap.plan_json) ? roadmap.plan_json : [];
    totalWeeks = weeks.length;
    const progress = await sql`SELECT week_number, completed FROM roadmap_progress WHERE roadmap_id = ${roadmap.id as string}`;
    roadmapWeeksDone = progress.filter((p) => p.completed).length;
    roadmapPct = totalWeeks > 0 ? Math.round((roadmapWeeksDone / totalWeeks) * 100) : 0;
  }

  const readinessScore = calcReadiness(atsScore, interviewScore, roadmapPct, !!profile?.onboarding_done);
  const firstName = (session.user.name ?? session.user.email ?? 'there').split(' ')[0];
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="mx-auto max-w-7xl space-y-6">

      {/* ── Header row ──────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-foreground">{greeting}, {firstName}</h1>
            <Sparkles className="h-5 w-5 text-amber-400" />
          </div>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {profile.target_role
              ? `Preparing for ${profile.target_role as string} · ${(profile.branch as string) ?? 'Engineering'}`
              : 'Your placement journey starts here'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="hidden sm:flex items-center gap-1.5 border-border/60 text-muted-foreground">
            <Activity className="h-3 w-3" />
            {activities.length} recent actions
          </Badge>
          <Badge className="bg-primary/15 text-primary border-primary/20 hover:bg-primary/20">
            <Sparkles className="mr-1 h-3 w-3" /> AI Ready
          </Badge>
        </div>
      </div>

      {/* ── Metrics row ─────────────────────────────────────── */}
      <MetricsCards
        roadmapProgress={roadmapPct}
        atsScore={atsScore}
        interviewScore={interviewScore}
        streakDays={activities.length > 0 ? Math.min(activities.length, 7) : 0}
      />

      {/* ── Main content: Readiness + Actions + Activity ────── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">

        {/* Readiness ring */}
        <Card className="lg:col-span-3 border-border/50 bg-card/80 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground">Placement Readiness</h3>
              <Target className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4 pb-6">
            <ReadinessScore score={readinessScore} size={160} />
            {/* Score breakdown */}
            <div className="w-full space-y-2 border-t border-border/50 pt-4">
              {[
                { label: 'Resume ATS',  value: atsScore,       color: 'bg-emerald-500' },
                { label: 'Interview',   value: interviewScore, color: 'bg-violet-500'  },
                { label: 'Roadmap',     value: roadmapPct,     color: 'bg-blue-500'    },
              ].map(({ label, value, color }) => (
                <div key={label} className="flex items-center gap-3">
                  <span className="w-20 text-xs text-muted-foreground shrink-0">{label}</span>
                  <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                    <div className={`h-full rounded-full ${color} transition-all duration-700`} style={{ width: `${value}%` }} />
                  </div>
                  <span className="w-8 text-right text-xs font-medium text-foreground tabular-nums">{value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Next Actions */}
        <div className="lg:col-span-6">
          <NextActions
            hasRoadmap={!!roadmap}
            hasResume={!!resume}
            hasInterview={!!interview}
            roadmapWeeksDone={roadmapWeeksDone}
            atsScore={atsScore}
          />
        </div>

        {/* Activity feed */}
        <Card className="lg:col-span-3 border-border/50 bg-card/80 backdrop-blur-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground">Recent Activity</h3>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            {activities.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                  <Zap className="h-5 w-5 text-muted-foreground/50" />
                </div>
                <p className="text-sm text-muted-foreground">No activity yet</p>
                <p className="mt-1 text-xs text-muted-foreground/60">Start above to see your history</p>
              </div>
            ) : (
              <div className="space-y-1">
                {activities.map((act, i) => {
                  const meta = ACTION_LABELS[act.action as string] ?? { label: act.action as string, icon: Activity, color: 'text-muted-foreground bg-muted' };
                  const Icon = meta.icon;
                  return (
                    <div key={i} className="flex items-start gap-3 rounded-lg px-2 py-2.5 transition-colors hover:bg-muted/40">
                      <div className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${meta.color}`}>
                        <Icon className="h-3.5 w-3.5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium text-foreground leading-snug">{meta.label}</p>
                        <p className="text-[11px] text-muted-foreground">{formatRelativeTime(act.created_at as string)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Quick access strip ───────────────────────────────── */}
      <div className="grid grid-cols-3 gap-4">
        {QUICK_LINKS.map(({ href, label, icon: Icon, color, iconColor, iconBg }) => (
          <Link key={href} href={href}
            className="group relative overflow-hidden rounded-2xl border border-border/50 bg-card/80 p-5 transition-all hover:border-border hover:shadow-lg hover:shadow-black/10 hover:-translate-y-0.5">
            <div className={`absolute inset-0 bg-gradient-to-br ${color} opacity-70 pointer-events-none`} />
            <div className="relative flex items-center justify-between">
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl ring-1 ${iconBg}`}>
                <Icon className={`h-5 w-5 ${iconColor}`} />
              </div>
              <ArrowUpRight className="h-4 w-4 text-muted-foreground transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-foreground" />
            </div>
            <p className="relative mt-3 text-sm font-semibold text-foreground">{label}</p>
          </Link>
        ))}
      </div>

    </div>
  );
}
