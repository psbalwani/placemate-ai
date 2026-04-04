'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Sparkles, Loader2, CheckCircle2, Circle, ChevronDown, ChevronUp,
  BookOpen, Code2, FolderOpen, MessageSquare, Calendar, RefreshCw,
} from 'lucide-react';
import type { WeekPlan } from '@/types/database';

interface RoadmapData {
  id: string;
  plan_json: WeekPlan[];
  duration_months: number;
  created_at: string;
  roadmap_progress?: { week_number: number; completed: boolean }[];
}

const FOCUS_COLORS: Record<string, string> = {
  'DSA': 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  'Web Dev': 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
  'DBMS': 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  'OS': 'bg-orange-500/10 text-orange-600 dark:text-orange-400',
  'System Design': 'bg-rose-500/10 text-rose-600 dark:text-rose-400',
  'Soft Skills': 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  'Projects': 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400',
  'General': 'bg-muted text-muted-foreground',
};

function getFocusColor(area: string) {
  for (const [key, val] of Object.entries(FOCUS_COLORS)) {
    if (area.toLowerCase().includes(key.toLowerCase())) return val;
  }
  return FOCUS_COLORS.General;
}

function WeekCard({
  week,
  isCompleted,
  onToggle,
}: {
  week: WeekPlan;
  isCompleted: boolean;
  onToggle: () => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className={`rounded-xl border transition-all ${isCompleted ? 'border-primary/30 bg-primary/5' : 'border-border bg-card'}`}>
      {/* Header */}
      <div className="flex items-center gap-3 p-4">
        <button onClick={onToggle} className="shrink-0">
          {isCompleted ? (
            <CheckCircle2 className="h-6 w-6 text-primary" />
          ) : (
            <Circle className="h-6 w-6 text-muted-foreground hover:text-primary transition-colors" />
          )}
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold text-muted-foreground">WEEK {week.week}</span>
            <Badge variant="secondary" className={`text-xs ${getFocusColor(week.focus_area)}`}>
              {week.focus_area}
            </Badge>
          </div>
        </div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="rounded-lg p-1 text-muted-foreground hover:bg-muted"
        >
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
      </div>

      {/* Topics preview */}
      <div className="px-4 pb-3">
        <p className="text-sm text-foreground font-medium truncate">
          {week.topics.slice(0, 2).join(' · ')}
          {week.topics.length > 2 && ` +${week.topics.length - 2} more`}
        </p>
      </div>

      {/* Expanded content */}
      {expanded && (
        <div className="border-t border-border px-4 pb-4 pt-3 animate-fade-in space-y-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <BookOpen className="h-4 w-4 text-primary" />
              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Topics</span>
            </div>
            <ul className="space-y-1">
              {week.topics.map((t, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                  {t}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-2">
              <Code2 className="h-4 w-4 text-purple-500" />
              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Practice Tasks</span>
            </div>
            <ul className="space-y-1">
              {week.practice_tasks.map((t, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-purple-500" />
                  {t}
                </li>
              ))}
            </ul>
          </div>

          {week.project_suggestion && (
            <div className="rounded-lg bg-amber-500/10 px-3 py-2 text-sm">
              <span className="font-medium text-amber-600 dark:text-amber-400">
                <FolderOpen className="inline h-3.5 w-3.5 mr-1" />
                Mini Project:
              </span>
              <span className="ml-1 text-foreground">{week.project_suggestion}</span>
            </div>
          )}

          {week.soft_skill_task && (
            <div className="rounded-lg bg-emerald-500/10 px-3 py-2 text-sm">
              <span className="font-medium text-emerald-600 dark:text-emerald-400">
                <MessageSquare className="inline h-3.5 w-3.5 mr-1" />
                Soft Skill:
              </span>
              <span className="ml-1 text-foreground">{week.soft_skill_task}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function RoadmapPage() {
  const [roadmap, setRoadmap] = useState<RoadmapData | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [completedWeeks, setCompletedWeeks] = useState<Set<number>>(new Set());
  const [error, setError] = useState('');
  const [duration, setDuration] = useState(3);
  const [activeView, setActiveView] = useState('timeline');

  async function loadRoadmap() {
    setLoading(true);
    try {
      const res = await fetch('/api/roadmap');
      const data = await res.json();
      if (data.roadmap) {
        setRoadmap(data.roadmap);
        const done = new Set<number>(
          (data.roadmap.roadmap_progress ?? [])
            .filter((p: { completed: boolean }) => p.completed)
            .map((p: { week_number: number }) => p.week_number)
        );
        setCompletedWeeks(done);
      }
    } catch {
      setError('Failed to load roadmap');
    } finally {
      setLoading(false);
    }
  }

  async function generateRoadmap() {
    setGenerating(true);
    setError('');
    try {
      const res = await fetch('/api/roadmap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'generate', duration_months: duration }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      setRoadmap(data.roadmap);
      setCompletedWeeks(new Set());
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to generate roadmap');
    } finally {
      setGenerating(false);
    }
  }

  async function toggleWeek(weekNumber: number) {
    if (!roadmap) return;
    const isNowComplete = !completedWeeks.has(weekNumber);

    setCompletedWeeks((prev) => {
      const next = new Set(prev);
      isNowComplete ? next.add(weekNumber) : next.delete(weekNumber);
      return next;
    });

    await fetch('/api/roadmap', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'update_progress',
        roadmap_id: roadmap.id,
        week_number: weekNumber,
        completed: isNowComplete,
      }),
    });
  }

  useEffect(() => { loadRoadmap(); }, []);

  const weeks: WeekPlan[] = Array.isArray(roadmap?.plan_json) ? roadmap.plan_json : [];
  const totalWeeks = weeks.length;
  const doneCount = completedWeeks.size;
  const progressPct = totalWeeks > 0 ? Math.round((doneCount / totalWeeks) * 100) : 0;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Career Roadmap</h1>
          <p className="mt-1 text-muted-foreground">
            AI-personalised weekly study plan for your placement goals
          </p>
        </div>
        <div className="flex items-center gap-3">
          {roadmap && (
            <Button
              variant="outline"
              onClick={generateRoadmap}
              disabled={generating}
              id="regenerate-roadmap"
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${generating ? 'animate-spin' : ''}`} />
              Regenerate
            </Button>
          )}
          {!roadmap && !loading && (
            <div className="flex items-center gap-2">
              <select
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="rounded-lg border border-border bg-input px-3 py-2 text-sm text-foreground focus:outline-none"
              >
                {[1, 2, 3, 6].map((m) => <option key={m} value={m}>{m} {m === 1 ? 'month' : 'months'}</option>)}
              </select>
              <Button
                onClick={generateRoadmap}
                disabled={generating}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
                id="generate-roadmap"
              >
                {generating ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Generating…</>
                ) : (
                  <><Sparkles className="mr-2 h-4 w-4" />Generate Roadmap</>
                )}
              </Button>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-900 dark:bg-red-950/50 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Generating state */}
      {generating && (
        <Card className="py-16 text-center">
          <CardContent>
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                <div className="h-16 w-16 rounded-full border-4 border-primary/20" />
                <div className="absolute inset-0 h-16 w-16 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                <Sparkles className="absolute inset-0 m-auto h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-foreground">Building your personalised roadmap…</p>
                <p className="text-sm text-muted-foreground mt-1">This may take 15–30 seconds</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Loading state */}
      {loading && !generating && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      {/* Empty state */}
      {!loading && !generating && !roadmap && (
        <Card className="py-16 text-center">
          <CardContent>
            <Calendar className="mx-auto mb-4 h-14 w-14 text-muted-foreground/40" />
            <h2 className="text-lg font-semibold text-foreground">No roadmap yet</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Generate your personalised study plan and start your placement journey
            </p>
          </CardContent>
        </Card>
      )}

      {/* Roadmap loaded */}
      {roadmap && !generating && (
        <>
          {/* Progress summary */}
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-sm font-medium text-foreground">Overall Progress</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {doneCount} of {totalWeeks} weeks completed
                  </p>
                </div>
                <span className="text-2xl font-bold text-primary">{progressPct}%</span>
              </div>
              <Progress value={progressPct} className="h-3" />
            </CardContent>
          </Card>

          {/* Tabs: Timeline vs Calendar */}
          <div>
            <Tabs defaultValue="timeline" onValueChange={setActiveView}>
              <TabsList className="mb-4">
                <TabsTrigger value="timeline">Timeline View</TabsTrigger>
                <TabsTrigger value="month">Month Groups</TabsTrigger>
              </TabsList>

              <TabsContent value="timeline">
                <div className="space-y-3">
                  {weeks.map((week) => (
                    <WeekCard
                      key={week.week}
                      week={week}
                      isCompleted={completedWeeks.has(week.week)}
                      onToggle={() => toggleWeek(week.week)}
                    />
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="month">
                {Array.from({ length: roadmap.duration_months ?? 3 }, (_, mi) => {
                  const monthWeeks = weeks.filter(
                    (w) => w.week > mi * 4 && w.week <= (mi + 1) * 4
                  );
                  const monthDone = monthWeeks.filter((w) => completedWeeks.has(w.week)).length;
                  return (
                    <div key={mi} className="mb-6">
                      <div className="mb-3 flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-foreground">Month {mi + 1}</h3>
                        <span className="text-xs text-muted-foreground">
                          {monthDone}/{monthWeeks.length} done
                        </span>
                      </div>
                      <div className="space-y-3">
                        {monthWeeks.map((week) => (
                          <WeekCard
                            key={week.week}
                            week={week}
                            isCompleted={completedWeeks.has(week.week)}
                            onToggle={() => toggleWeek(week.week)}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </TabsContent>
            </Tabs>
          </div>
        </>
      )}
    </div>
  );
}
