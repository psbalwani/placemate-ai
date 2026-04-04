import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Map, FileText, MessageSquare, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

interface Action {
  title: string;
  description: string;
  href: string;
  icon: React.ElementType;
  priority: 'high' | 'medium' | 'low';
  badge?: string;
  done?: boolean;
}

interface NextActionsProps {
  hasRoadmap: boolean;
  hasResume: boolean;
  hasInterview: boolean;
  roadmapWeeksDone: number;
  atsScore: number;
}

const PRIORITY_CONFIG = {
  high:   { dot: 'bg-red-500',    ring: 'ring-red-500/20',    label: 'Priority',  labelClass: 'bg-red-500/15 text-red-400' },
  medium: { dot: 'bg-amber-500',  ring: 'ring-amber-500/20',  label: 'Suggested', labelClass: 'bg-amber-500/15 text-amber-400' },
  low:    { dot: 'bg-emerald-500',ring: 'ring-emerald-500/20',label: 'Optional',  labelClass: 'bg-emerald-500/15 text-emerald-400' },
};

const ICON_STYLES = {
  Map:           { bg: 'bg-blue-500/15',   icon: 'text-blue-400',   ring: 'ring-blue-500/20' },
  FileText:      { bg: 'bg-emerald-500/15',icon: 'text-emerald-400',ring: 'ring-emerald-500/20' },
  MessageSquare: { bg: 'bg-violet-500/15', icon: 'text-violet-400', ring: 'ring-violet-500/20' },
};

export function NextActions({ hasRoadmap, hasResume, hasInterview, roadmapWeeksDone, atsScore }: NextActionsProps) {
  const actions: Action[] = [];

  if (!hasRoadmap) {
    actions.push({ title: 'Generate Your AI Roadmap', description: 'Get a personalised week-by-week study plan based on your profile', href: '/roadmap', icon: Map, priority: 'high', badge: 'Start here' });
  } else {
    actions.push({ title: `Continue Week ${roadmapWeeksDone + 1}`, description: 'Pick up where you left off in your personalised study plan', href: '/roadmap', icon: Map, priority: 'medium' });
  }

  if (!hasResume) {
    actions.push({ title: 'Analyse Your Resume', description: 'Upload your resume for an instant ATS score and improvement tips', href: '/resume', icon: FileText, priority: 'high', badge: 'Boost ATS score' });
  } else if (atsScore < 70) {
    actions.push({ title: 'Improve Your ATS Score', description: `Your resume scored ${atsScore}/100. Apply the suggested improvements`, href: '/resume', icon: FileText, priority: 'medium', badge: `${atsScore}/100` });
  } else {
    actions.push({ title: 'Resume Looks Great!', description: `ATS score ${atsScore}/100 — consider refreshing it after new experience`, href: '/resume', icon: FileText, priority: 'low', done: true });
  }

  if (!hasInterview) {
    actions.push({ title: 'Take a Mock Interview', description: 'Practice with our AI interviewer and get instant personalised feedback', href: '/interview', icon: MessageSquare, priority: hasRoadmap && hasResume ? 'high' : 'low', badge: 'New' });
  } else {
    actions.push({ title: 'Retake Mock Interview', description: 'Keep practising to improve your score and confidence', href: '/interview', icon: MessageSquare, priority: 'low' });
  }

  const sorted = actions.sort((a, b) => ({ high: 0, medium: 1, low: 2 }[a.priority] - { high: 0, medium: 1, low: 2 }[b.priority]));

  return (
    <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-foreground">Recommended Actions</h3>
            <p className="mt-0.5 text-sm text-muted-foreground">Prioritised next steps for your placement prep</p>
          </div>
          <Badge variant="secondary" className="text-xs">{sorted.filter(a => a.priority === 'high').length} urgent</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {sorted.map((action) => {
          const Icon = action.icon;
          // Map icon component to style using a WeakMap-safe identity check
          const iconStyle =
            Icon === Map            ? ICON_STYLES.Map :
            Icon === FileText       ? ICON_STYLES.FileText :
            Icon === MessageSquare  ? ICON_STYLES.MessageSquare :
            ICON_STYLES.Map;
          const pConfig = PRIORITY_CONFIG[action.priority];

          return (
            <Link
              key={action.href}
              href={action.href}
              className="group flex items-center gap-4 rounded-xl border border-border/40 bg-muted/20 p-4 transition-all hover:border-border hover:bg-muted/50 hover:shadow-sm"
            >
              {/* Icon */}
              <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ring-1 ${iconStyle.bg} ${iconStyle.ring} transition-transform group-hover:scale-105`}>
                {action.done
                  ? <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                  : <Icon className={`h-5 w-5 ${iconStyle.icon}`} />
                }
              </div>

              {/* Text */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-semibold text-foreground">{action.title}</p>
                  {action.badge && (
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ${pConfig.labelClass} ring-current/20`}>
                      {action.badge}
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">{action.description}</p>
              </div>

              {/* Priority dot + arrow */}
              <div className="flex shrink-0 flex-col items-end gap-2">
                <div className={`h-2 w-2 rounded-full ${pConfig.dot}`} />
                <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" />
              </div>
            </Link>
          );
        })}

        {sorted.filter(a => a.priority !== 'low' || !a.done).length === 0 && (
          <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-6 text-center">
            <CheckCircle2 className="mx-auto mb-2 h-8 w-8 text-emerald-400" />
            <p className="text-sm font-semibold text-emerald-400">You&apos;re fully on track!</p>
            <p className="mt-1 text-xs text-muted-foreground">Keep doing mock interviews to sharpen your skills</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
