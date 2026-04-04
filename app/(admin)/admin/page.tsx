'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import {
  Users, TrendingUp, FileText, MessageSquare, Sparkles, Loader2,
  ChevronRight, Briefcase, BookOpen, Target, History, BarChart3,
} from 'lucide-react';
import Link from 'next/link';

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

interface SavedPlan {
  id: string;
  title: string;
  filters_json: Record<string, unknown>;
  created_at: string;
}

const FORMAT_STYLES: Record<string, string> = {
  lecture: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  lab: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  workshop: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  'peer-session': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
};

const WEEK_COLORS = ['from-blue-500/10', 'from-purple-500/10', 'from-amber-500/10', 'from-emerald-500/10'];

/* ─── Heatmap cell ─── */
function HeatCell({ value, max }: { value: number; max: number }) {
  const pct = max > 0 ? value / max : 0;
  const bg = pct > 0.7 ? 'bg-red-500' : pct > 0.4 ? 'bg-amber-500' : 'bg-emerald-500';
  return (
    <div className={`h-8 rounded flex items-center justify-center text-[10px] font-semibold text-white ${bg}`}
      style={{ opacity: 0.3 + pct * 0.7 }}>
      {value}%
    </div>
  );
}

export default function AdminPage() {
  const [stats, setStats] = useState<CohortStats | null>(null);
  const [students, setStudents] = useState<Record<string, unknown>[]>([]);
  const [trainingPlan, setTrainingPlan] = useState<TrainingWeek[] | null>(null);
  const [savedPlans, setSavedPlans] = useState<SavedPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'analytics' | 'training'>('analytics');

  useEffect(() => {
    Promise.all([
      fetch('/api/admin/analytics').then((r) => r.json()),
      fetch('/api/tpo/analytics/training-plan').then((r) => r.json()).catch(() => ({ plans: [] })),
    ]).then(([analyticsData, plansData]) => {
      setStats(analyticsData.stats);
      setStudents(analyticsData.students ?? []);
      setSavedPlans(plansData.plans ?? []);
    }).catch(() => setError('Failed to load analytics')).finally(() => setLoading(false));
  }, []);

  async function generatePlan() {
    if (!stats) return;
    setGenerating(true);
    try {
      const res = await fetch('/api/tpo/analytics/training-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filters: { batch: '2025' } }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      setTrainingPlan(data.plan.plan_json);
      setActiveTab('training');
      setSavedPlans((p) => [data.plan, ...p]);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to generate plan');
    } finally { setGenerating(false); }
  }

  const skillGapData = stats
    ? Object.entries(stats.skill_gaps)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 8)
        .map(([skill, pct]) => ({ skill: skill.split(' ')[0], pct }))
    : [];

  const heatmapSkills = skillGapData.slice(0, 6);

  if (loading) return (
    <div className="flex h-64 items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">TPO Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">Cohort analytics, skill gaps, and AI training plans</p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline" className="border-border text-foreground hover:bg-muted">
            <Link href="/admin/drives"><Briefcase className="mr-2 h-4 w-4" />Placement Drives</Link>
          </Button>
          <Button onClick={generatePlan} disabled={generating || !stats} className="bg-primary text-primary-foreground" id="generate-training-plan">
            {generating ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Generating…</> : <><Sparkles className="mr-2 h-4 w-4" />Generate Training Plan</>}
          </Button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-900 dark:bg-red-950/50 dark:text-red-400">{error}</div>
      )}

      {/* KPI Cards */}
      {stats && (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[
            { label: 'Total Students', value: stats.total_students, icon: Users, color: 'text-blue-400', bg: 'bg-blue-500/10', suffix: '' },
            { label: 'Avg ATS Score', value: stats.avg_ats, icon: FileText, color: 'text-emerald-400', bg: 'bg-emerald-500/10', suffix: '/100' },
            { label: 'Avg Interview', value: stats.avg_interview, icon: MessageSquare, color: 'text-purple-400', bg: 'bg-purple-500/10', suffix: '/100' },
            { label: 'Avg Readiness', value: stats.avg_readiness, icon: TrendingUp, color: 'text-amber-400', bg: 'bg-amber-500/10', suffix: '/100' },
          ].map(({ label, value, icon: Icon, color, bg, suffix }) => (
            <Card key={label}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">{label}</p>
                    <p className={`mt-1 text-2xl font-bold ${color}`}>
                      {value ?? '—'}<span className="text-sm font-normal text-muted-foreground ml-0.5">{suffix}</span>
                    </p>
                  </div>
                  <div className={`rounded-xl p-2.5 ${bg}`}><Icon className={`h-5 w-5 ${color}`} /></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl bg-muted/50 w-fit">
        {(['analytics', 'training'] as const).map((t) => {
          const Icon = t === 'analytics' ? BarChart3 : BookOpen;
          const label = t === 'analytics' ? 'Analytics' : 'Training Plans';
          return (
            <button key={t} onClick={() => setActiveTab(t)}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${activeTab === t ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
              <Icon className="h-3.5 w-3.5" />
              {label}
            </button>
          );
        })}
      </div>

      {activeTab === 'analytics' && (
        <div className="space-y-6">
          {stats && skillGapData.length > 0 && (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {/* Skill gap bar */}
              <Card>
                <CardHeader className="pb-2">
                  <h3 className="font-semibold text-foreground">Skill Gap Distribution</h3>
                  <p className="text-xs text-muted-foreground">% of students weak in each skill</p>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={skillGapData} layout="vertical" margin={{ left: 0, right: 16, top: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                      <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} tickFormatter={(v) => `${v}%`} />
                      <YAxis type="category" dataKey="skill" tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} width={60} />
                      <Tooltip formatter={(v) => [`${v}%`, 'Students Weak']}
                        contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '0.75rem' }}
                        labelStyle={{ color: 'var(--foreground)' }} />
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
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold text-muted-foreground">{i + 1}</span>
                      <span className="flex-1 text-sm text-foreground truncate">{role}</span>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  ))}
                  {stats.top_roles.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No role data yet</p>}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Skill Heatmap */}
          {heatmapSkills.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <h3 className="font-semibold text-foreground">Skill Weakness Heatmap</h3>
                <p className="text-xs text-muted-foreground">Red = large gap · Green = students are strong here</p>
              </CardHeader>
              <CardContent>
                <div className="grid gap-2" style={{ gridTemplateColumns: `140px repeat(${heatmapSkills.length}, 1fr)` }}>
                  <div />
                  {heatmapSkills.map(({ skill }) => (
                    <div key={skill} className="text-[10px] font-semibold text-muted-foreground text-center truncate">{skill}</div>
                  ))}
                  {['All Students'].map((row) => (
                    <>
                      <div key={`${row}-label`} className="text-xs text-muted-foreground flex items-center">{row}</div>
                      {heatmapSkills.map(({ pct }) => (
                        <HeatCell key={pct} value={pct} max={100} />
                      ))}
                    </>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-3">
                  <span className="inline-block h-2 w-2 rounded-full bg-emerald-500 mr-1" />Strong &nbsp;
                  <span className="inline-block h-2 w-2 rounded-full bg-amber-500 mr-1" />Moderate &nbsp;
                  <span className="inline-block h-2 w-2 rounded-full bg-red-500 mr-1" />Weak
                </p>
              </CardContent>
            </Card>
          )}

          {/* Student list preview */}
          {students.length > 0 && (
            <Card>
              <CardHeader className="pb-3 flex-row items-center justify-between">
                <h3 className="font-semibold text-foreground">Students ({students.length})</h3>
                <Button variant="outline" size="sm" asChild><Link href="/admin/students">View All →</Link></Button>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        {['Student', 'Branch', 'Target Role', 'ATS', 'Interview'].map((h) => (
                          <th key={h} className="pb-2 text-left font-medium text-muted-foreground first:text-left text-center first:text-left last:text-center">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {students.slice(0, 8).map((s) => (
                        <tr key={String(s.id)} className="border-b border-border/50 last:border-0">
                          <td className="py-2.5">
                            <div className="flex items-center gap-2">
                              <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                                {String(s.full_name ?? s.email)?.[0]?.toUpperCase()}
                              </div>
                              <span className="font-medium text-foreground truncate max-w-32">{String(s.full_name ?? s.email ?? '')}</span>
                            </div>
                          </td>
                          <td className="py-2.5 text-muted-foreground">{String(s.branch ?? '—')}</td>
                          <td className="py-2.5 text-muted-foreground truncate max-w-32">{String(s.target_role ?? '—')}</td>
                          <td className="py-2.5 text-center">
                            {s.ats_score != null ? <span className={`font-semibold ${Number(s.ats_score) >= 70 ? 'text-emerald-500' : Number(s.ats_score) >= 50 ? 'text-amber-500' : 'text-red-500'}`}>{String(s.ats_score)}</span> : <span className="text-muted-foreground">—</span>}
                          </td>
                          <td className="py-2.5 text-center">
                            {s.interview_score != null ? <span className={`font-semibold ${Number(s.interview_score) >= 70 ? 'text-emerald-500' : Number(s.interview_score) >= 50 ? 'text-amber-500' : 'text-red-500'}`}>{String(s.interview_score)}</span> : <span className="text-muted-foreground">—</span>}
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
      )}

      {activeTab === 'training' && (
        <div className="space-y-6">
          {!trainingPlan && savedPlans.length === 0 && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16 gap-4">
                <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <BookOpen className="h-8 w-8 text-primary/50" />
                </div>
                <div className="text-center">
                  <p className="font-semibold text-foreground">No training plans yet</p>
                  <p className="text-sm text-muted-foreground mt-1">Click "Generate Training Plan" to create an AI-powered 4-week plan</p>
                </div>
                <Button onClick={generatePlan} disabled={generating || !stats} className="bg-primary text-primary-foreground" id="generate-plan-empty">
                  {generating ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Generating…</> : <><Sparkles className="mr-2 h-4 w-4" />Generate Now</>}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Live generated plan */}
          {trainingPlan && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <h2 className="text-lg font-bold text-foreground">Latest Plan</h2>
                <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/25 text-xs border">Just Generated</Badge>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {trainingPlan.map((week, idx) => (
                  <Card key={week.week} className="overflow-hidden">
                    <div className={`h-1.5 w-full bg-gradient-to-r ${WEEK_COLORS[idx]} to-transparent`} />
                    <CardHeader className="pb-2 pt-4">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-foreground">Week {week.week}</h3>
                        <Badge className={`text-xs border capitalize ${FORMAT_STYLES[week.suggested_format] ?? 'bg-muted text-muted-foreground border-border'}`}>
                          {week.suggested_format}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {week.focus_areas.map((area) => (
                          <span key={area} className="text-[10px] text-muted-foreground/70">#{area}</span>
                        ))}
                      </div>
                    </CardHeader>
                    <CardContent className="p-4 pt-0 space-y-3">
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-1.5">Topics</p>
                        <ul className="space-y-1">
                          {week.topics.map((t, i) => (
                            <li key={i} className="flex items-start gap-1.5 text-xs text-foreground">
                              <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />{t}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-1.5">Activities</p>
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

          {/* Saved plans history */}
          {savedPlans.length > 0 && (
            <Card>
              <CardHeader className="pb-3 flex-row items-center gap-2">
                <History className="h-4 w-4 text-muted-foreground" />
                <h3 className="font-semibold text-foreground">Saved Training Plans</h3>
              </CardHeader>
              <CardContent className="space-y-2">
                {savedPlans.map((plan) => (
                  <div key={plan.id} className="flex items-center justify-between rounded-xl border border-border bg-muted/30 px-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-foreground">{plan.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {new Date(plan.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {plan.filters_json?.batch != null && (
                        <Badge className="bg-white/5 text-white/40 border-white/10 border text-xs">
                          Batch {String(plan.filters_json.batch)}
                        </Badge>
                      )}
                      <Target className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
