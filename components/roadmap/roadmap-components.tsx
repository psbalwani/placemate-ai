'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  CheckCircle2, Circle, ChevronDown, ChevronUp,
  BookOpen, Code2, FolderOpen, MessageSquare,
} from 'lucide-react';
import type { WeekPlan } from '@/types/database';

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

// ── WeekCard ────────────────────────────────────────────────────
export function WeekCard({
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
    <div
      className={`rounded-xl border transition-all ${
        isCompleted ? 'border-primary/30 bg-primary/5' : 'border-border bg-card'
      }`}
    >
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

// ── RoadmapTimeline ─────────────────────────────────────────────
export function RoadmapTimeline({
  weeks,
  completedWeeks,
  durationMonths,
  onToggle,
}: {
  weeks: WeekPlan[];
  completedWeeks: Set<number>;
  durationMonths: number;
  onToggle: (weekNumber: number) => void;
}) {
  return (
    <Tabs defaultValue="timeline">
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
              onToggle={() => onToggle(week.week)}
            />
          ))}
        </div>
      </TabsContent>

      <TabsContent value="month">
        {Array.from({ length: durationMonths }, (_, mi) => {
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
                    onToggle={() => onToggle(week.week)}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </TabsContent>
    </Tabs>
  );
}

// ── RoadmapProgress ─────────────────────────────────────────────
export function RoadmapProgressBar({
  doneCount,
  totalWeeks,
}: {
  doneCount: number;
  totalWeeks: number;
}) {
  const progressPct = totalWeeks > 0 ? Math.round((doneCount / totalWeeks) * 100) : 0;
  return (
    <div className="p-5">
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
    </div>
  );
}
