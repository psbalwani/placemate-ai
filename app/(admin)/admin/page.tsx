'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
} from 'recharts';
import { Users, TrendingUp, FileText, MessageSquare, Sparkles, Loader2, ChevronRight } from 'lucide-react';

interface CohortStats {
  total_students: number;
  avg_ats: number;
  avg_interview: number;
  avg_readiness: number;
  skill_gaps: Record<string, number>;
  top_roles: string[];
}

interface TrainingWeek {
  week: number;
  topics: string[];
  activities: string[];
  suggested_format: string;
  focus_areas: string[];
}

const FORMAT_STYLES: Record<string, string> = {
  lecture: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  lab: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
  workshop: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  'peer-session': 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
};

export default function AdminPage() {
  const [stats, setStats] = useState<CohortStats | null>(null);
  const [students, setStudents] = useState<unknown[]>([]);
  const [trainingPlan, setTrainingPlan] = useState<TrainingWeek[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/admin/analytics')
      .then((r) => r.json())
      .then((data) => {
        setStats(data.stats);
        setStudents(data.students ?? []);
      })
      .catch(() => setError('Failed to load analytics'))
      .finally(() => setLoading(false));
  }, []);

  async function generatePlan() {
    if (!stats) return;
    setGenerating(true);
    try {
      const res = await fetch('/api/admin/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate_training_plan',
          stats,
          filters: { batch: '2025' },
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      setTrainingPlan(data.plan.plan_json);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to generate plan');
    } finally {
      setGenerating(false);
    }
  }

  const skillGapData = stats
    ? Object.entries(stats.skill_gaps)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 8)
        .map(([skill, pct]) => ({ skill: skill.split(' ')[0], pct }))
    : [];

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">TPO Dashboard</h1>
          <p className="mt-1 text-muted-foreground">Cohort-level placement analytics and training tools</p>
        </div>
        <Button
          onClick={generatePlan}
          disabled={generating || !stats}
          className="bg-primary text-primary-foreground"
          id="generate-training-plan"
        >
          {generating ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Generating…</>
          ) : (
            <><Sparkles className="mr-2 h-4 w-4" />Generate Training Plan</>
          )}
        </Button>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-900 dark:bg-red-950/50 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Stats cards */}
      {stats && (
        <div className="stagger-children grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[
            { label: 'Total Students', value: stats.total_students, icon: Users, color: 'text-blue-500', bg: 'bg-blue-500/10', suffix: '' },
            { label: 'Avg ATS Score', value: stats.avg_ats, icon: FileText, color: 'text-emerald-500', bg: 'bg-emerald-500/10', suffix: '/100' },
            { label: 'Avg Interview', value: stats.avg_interview, icon: MessageSquare, color: 'text-purple-500', bg: 'bg-purple-500/10', suffix: '/100' },
            { label: 'Avg Readiness', value: stats.avg_readiness, icon: TrendingUp, color: 'text-amber-500', bg: 'bg-amber-500/10', suffix: '/100' },
          ].map(({ label, value, icon: Icon, color, bg, suffix }) => (
            <Card key={label}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">{label}</p>
                    <p className={`mt-1 text-2xl font-bold ${color}`}>
                      {value}
                      <span className="text-sm font-normal text-muted-foreground ml-0.5">{suffix}</span>
                    </p>
                  </div>
                  <div className={`rounded-xl p-2.5 ${bg}`}>
                    <Icon className={`h-5 w-5 ${color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Charts */}
      {stats && skillGapData.length > 0 && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Skill gaps bar chart */}
          <Card>
            <CardHeader className="pb-2">
              <h3 className="font-semibold text-foreground">Skill Gap Distribution</h3>
              <p className="text-xs text-muted-foreground">% of students weak in each skill (level ≤ 2)</p>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={skillGapData} layout="vertical" margin={{ left: 0, right: 16, top: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                  <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} tickFormatter={(v) => `${v}%`} />
                  <YAxis type="category" dataKey="skill" tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} width={60} />
                  <Tooltip
                    formatter={(v) => [`${v}%`, 'Students Weak']}
                    contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '0.75rem' }}
                    labelStyle={{ color: 'var(--foreground)' }}
                  />
                  <Bar dataKey="pct" fill="var(--primary)" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Top target roles */}
          <Card>
            <CardHeader className="pb-2">
              <h3 className="font-semibold text-foreground">Top Target Roles</h3>
              <p className="text-xs text-muted-foreground">Most popular career aspirations</p>
            </CardHeader>
            <CardContent className="space-y-3">
              {stats.top_roles.map((role, i) => (
                <div key={role} className="flex items-center gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold text-muted-foreground">
                    {i + 1}
                  </span>
                  <span className="flex-1 text-sm text-foreground truncate">{role}</span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
              ))}
              {stats.top_roles.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">No role data yet</p>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Training Plan */}
      {trainingPlan && (
        <div>
          <h2 className="text-lg font-bold text-foreground mb-4">AI-Generated 4-Week Training Plan</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {trainingPlan.map((week) => (
              <Card key={week.week} className="overflow-hidden">
                <CardHeader className="pb-2 bg-primary/5">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-foreground">Week {week.week}</h3>
                    <Badge className={`text-xs capitalize ${FORMAT_STYLES[week.suggested_format] ?? 'bg-muted text-muted-foreground'}`}>
                      {week.suggested_format}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {week.focus_areas.map((area) => (
                      <span key={area} className="text-xs text-muted-foreground">#{area}</span>
                    ))}
                  </div>
                </CardHeader>
                <CardContent className="p-4 space-y-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">Topics</p>
                    <ul className="space-y-1">
                      {week.topics.map((t, i) => (
                        <li key={i} className="flex items-start gap-1.5 text-xs text-foreground">
                          <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                          {t}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">Activities</p>
                    <ul className="space-y-1">
                      {week.activities.map((a, i) => (
                        <li key={i} className="flex items-start gap-1.5 text-xs text-foreground">
                          <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                          {a}
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Student list preview */}
      {students && (students as unknown[]).length > 0 && (
        <Card>
          <CardHeader className="pb-3 flex-row items-center justify-between">
            <h3 className="font-semibold text-foreground">Students ({students.length})</h3>
            <Button variant="outline" size="sm" asChild>
              <a href="/admin/students">View All →</a>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="pb-2 text-left font-medium text-muted-foreground">Student</th>
                    <th className="pb-2 text-left font-medium text-muted-foreground">Branch</th>
                    <th className="pb-2 text-left font-medium text-muted-foreground">Target Role</th>
                    <th className="pb-2 text-center font-medium text-muted-foreground">ATS</th>
                    <th className="pb-2 text-center font-medium text-muted-foreground">Interview</th>
                  </tr>
                </thead>
                <tbody>
                  {(students as Record<string, unknown>[]).slice(0, 8).map((s) => (
                    <tr key={String(s.id)} className="border-b border-border/50 last:border-0">
                      <td className="py-2.5">
                        <div className="flex items-center gap-2">
                          <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                            {String(s.full_name ?? s.email)?.[0]?.toUpperCase()}
                          </div>
                          <span className="font-medium text-foreground truncate max-w-32">
                            {String(s.full_name ?? s.email ?? '')}
                          </span>
                        </div>
                      </td>
                      <td className="py-2.5 text-muted-foreground">{String(s.branch ?? '—')}</td>
                      <td className="py-2.5">
                        <span className="truncate max-w-32 block text-muted-foreground">
                          {String(s.target_role ?? '—')}
                        </span>
                      </td>
                      <td className="py-2.5 text-center">
                        {s.ats_score != null ? (
                          <span className={`font-semibold ${Number(s.ats_score) >= 70 ? 'text-emerald-500' : Number(s.ats_score) >= 50 ? 'text-amber-500' : 'text-red-500'}`}>
                            {String(s.ats_score)}
                          </span>
                        ) : <span className="text-muted-foreground">—</span>}
                      </td>
                      <td className="py-2.5 text-center">
                        {s.interview_score != null ? (
                          <span className={`font-semibold ${Number(s.interview_score) >= 70 ? 'text-emerald-500' : Number(s.interview_score) >= 50 ? 'text-amber-500' : 'text-red-500'}`}>
                            {String(s.interview_score)}
                          </span>
                        ) : <span className="text-muted-foreground">—</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
