'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { Sparkles, Loader2, TrendingUp, FileText, MessageSquare, Users } from 'lucide-react';

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

export default function AnalyticsPage() {
  const [stats, setStats] = useState<CohortStats | null>(null);
  const [trainingPlan, setTrainingPlan] = useState<TrainingWeek[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/admin/analytics')
      .then((r) => r.json())
      .then((d) => setStats(d.stats ?? null))
      .catch(() => setError('Failed to load analytics'))
      .finally(() => setLoading(false));
  }, []);

  async function generatePlan() {
    if (!stats) return;
    setGenerating(true);
    setError('');
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
        .slice(0, 10)
        .map(([skill, pct]) => ({ skill: skill.split(' ').slice(0, 2).join(' '), pct }))
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
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Cohort Analytics</h1>
          <p className="mt-1 text-muted-foreground">
            Deep-dive into placement readiness metrics across your batch
          </p>
        </div>
        <Button
          onClick={generatePlan}
          disabled={generating || !stats}
          className="bg-primary text-primary-foreground"
          id="analytics-generate-plan"
        >
          {generating ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Generating AI Plan…</>
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

      {stats && (
        <>
          {/* KPI row */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              { label: 'Students', value: stats.total_students, icon: Users, color: 'text-blue-500', bg: 'bg-blue-500/10' },
              { label: 'Avg ATS', value: `${stats.avg_ats}/100`, icon: FileText, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
              { label: 'Avg Interview', value: `${stats.avg_interview}/100`, icon: MessageSquare, color: 'text-purple-500', bg: 'bg-purple-500/10' },
              { label: 'Avg Readiness', value: `${stats.avg_readiness}/100`, icon: TrendingUp, color: 'text-amber-500', bg: 'bg-amber-500/10' },
            ].map(({ label, value, icon: Icon, color, bg }) => (
              <Card key={label}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">{label}</p>
                      <p className={`mt-1 text-2xl font-bold ${color}`}>{value}</p>
                    </div>
                    <div className={`rounded-xl p-2.5 ${bg}`}>
                      <Icon className={`h-5 w-5 ${color}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Score progress bars */}
          <Card>
            <CardHeader className="pb-3">
              <h3 className="font-semibold text-foreground">Cohort Score Breakdown</h3>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { label: 'Average ATS Score', value: stats.avg_ats, color: 'bg-emerald-500' },
                { label: 'Average Interview Score', value: stats.avg_interview, color: 'bg-purple-500' },
                { label: 'Average Placement Readiness', value: stats.avg_readiness, color: 'bg-amber-500' },
              ].map(({ label, value }) => (
                <div key={label} className="space-y-1.5">
                  <div className="flex justify-between text-sm">
                    <span className="text-foreground">{label}</span>
                    <span className="font-semibold text-foreground">{value}%</span>
                  </div>
                  <Progress value={value} className="h-2.5" />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Skill gaps chart */}
          {skillGapData.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <h3 className="font-semibold text-foreground">Skill Gap Heatmap</h3>
                <p className="text-xs text-muted-foreground">
                  % of students with weak proficiency (level ≤ 2) in each skill
                </p>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={skillGapData} layout="vertical" margin={{ left: 0, right: 20, top: 4, bottom: 4 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                    <XAxis
                      type="number"
                      domain={[0, 100]}
                      tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
                      tickFormatter={(v) => `${v}%`}
                    />
                    <YAxis
                      type="category"
                      dataKey="skill"
                      tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
                      width={80}
                    />
                    <Tooltip
                      formatter={(val) => [`${val}%`, 'Students Weak']}
                      contentStyle={{
                        background: 'var(--card)',
                        border: '1px solid var(--border)',
                        borderRadius: '0.75rem',
                        color: 'var(--foreground)',
                      }}
                    />
                    <Bar
                      dataKey="pct"
                      fill="var(--primary)"
                      radius={[0, 4, 4, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Top target roles */}
          {stats.top_roles.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <h3 className="font-semibold text-foreground">Top Target Roles</h3>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {stats.top_roles.map((role, i) => (
                    <Badge key={role} variant="secondary" className="text-sm px-3 py-1">
                      <span className="mr-2 text-xs font-black text-muted-foreground">#{i + 1}</span>
                      {role}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Generated Training Plan */}
      {trainingPlan && (
        <div>
          <div className="mb-4 flex items-center gap-3">
            <h2 className="text-lg font-bold text-foreground">AI-Generated 4-Week Training Plan</h2>
            <Badge className="bg-primary/10 text-primary">Just generated</Badge>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {trainingPlan.map((week) => (
              <Card key={week.week} className="overflow-hidden">
                <CardHeader className="bg-primary/5 pb-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-foreground">Week {week.week}</span>
                    <Badge variant="secondary" className="text-xs capitalize">
                      {week.suggested_format}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {week.focus_areas.map((a) => (
                      <span key={a} className="text-xs text-muted-foreground">#{a}</span>
                    ))}
                  </div>
                </CardHeader>
                <CardContent className="p-4 space-y-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">Topics</p>
                    <ul className="space-y-1">
                      {week.topics.map((t, i) => (
                        <li key={i} className="flex items-start gap-1.5 text-xs text-foreground">
                          <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />{t}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">Activities</p>
                    <ul className="space-y-1">
                      {week.activities.map((a, i) => (
                        <li key={i} className="flex items-start gap-1.5 text-xs text-foreground">
                          <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />{a}
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

      {!stats && !loading && (
        <div className="py-16 text-center">
          <TrendingUp className="mx-auto mb-4 h-14 w-14 text-muted-foreground/30" />
          <p className="font-medium text-foreground">No cohort data yet</p>
          <p className="text-sm text-muted-foreground mt-1">
            Analytics will appear once students complete their profiles and use the platform
          </p>
        </div>
      )}
    </div>
  );
}
