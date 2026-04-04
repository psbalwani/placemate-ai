import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Map, FileText, MessageSquare } from 'lucide-react';
import Link from 'next/link';

interface Action {
  title: string;
  description: string;
  href: string;
  icon: React.ElementType;
  priority: 'high' | 'medium' | 'low';
  badge?: string;
}

interface NextActionsProps {
  hasRoadmap: boolean;
  hasResume: boolean;
  hasInterview: boolean;
  roadmapWeeksDone: number;
  atsScore: number;
}

export function NextActions({
  hasRoadmap,
  hasResume,
  hasInterview,
  roadmapWeeksDone,
  atsScore,
}: NextActionsProps) {
  const actions: Action[] = [];

  if (!hasRoadmap) {
    actions.push({
      title: 'Generate Your AI Roadmap',
      description: 'Get a personalised week-by-week study plan based on your profile',
      href: '/roadmap',
      icon: Map,
      priority: 'high',
      badge: 'Start here',
    });
  } else {
    actions.push({
      title: `Continue Week ${roadmapWeeksDone + 1}`,
      description: 'Pick up where you left off in your personalised study plan',
      href: '/roadmap',
      icon: Map,
      priority: 'medium',
    });
  }

  if (!hasResume) {
    actions.push({
      title: 'Analyse Your Resume',
      description: 'Upload your resume for an instant ATS score and improvement tips',
      href: '/resume',
      icon: FileText,
      priority: 'high',
      badge: 'Boost ATS score',
    });
  } else if (atsScore < 70) {
    actions.push({
      title: 'Improve Your ATS Score',
      description: `Your resume scored ${atsScore}/100. Apply the suggested improvements`,
      href: '/resume',
      icon: FileText,
      priority: 'medium',
      badge: `${atsScore}/100`,
    });
  }

  if (!hasInterview) {
    actions.push({
      title: 'Take a Mock Interview',
      description: 'Practice with our AI interviewer and get instant feedback',
      href: '/interview',
      icon: MessageSquare,
      priority: hasRoadmap && hasResume ? 'high' : 'low',
      badge: 'New',
    });
  }

  const priorityOrder = { high: 0, medium: 1, low: 2 };
  const sorted = actions.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  const priorityStyles = {
    high: 'border-l-primary bg-primary/5',
    medium: 'border-l-amber-500 bg-amber-500/5',
    low: 'border-l-border',
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <h3 className="font-semibold text-foreground">Recommended Next Steps</h3>
        <p className="text-sm text-muted-foreground">Prioritised actions to accelerate your preparation</p>
      </CardHeader>
      <CardContent className="space-y-3">
        {sorted.map((action) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.href}
              href={action.href}
              className={`group flex items-start gap-4 rounded-xl border-l-4 p-4 transition-all hover:shadow-sm ${priorityStyles[action.priority]}`}
            >
              <div className="rounded-lg bg-muted p-2 transition-all group-hover:bg-primary/10">
                <Icon className="h-5 w-5 text-muted-foreground group-hover:text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-foreground">{action.title}</p>
                  {action.badge && (
                    <Badge variant="secondary" className="text-xs shrink-0">
                      {action.badge}
                    </Badge>
                  )}
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">{action.description}</p>
              </div>
              <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" />
            </Link>
          );
        })}

        {sorted.length === 0 && (
          <div className="rounded-xl bg-emerald-500/10 p-6 text-center">
            <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
              🎉 You&apos;re on track! Keep up the great work.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
