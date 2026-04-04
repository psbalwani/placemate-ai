'use client';

import { Star, Bot, User, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, RotateCcw } from 'lucide-react';

// ── Types ────────────────────────────────────────────────────────
export interface Message {
  role: 'interviewer' | 'candidate';
  content: string;
  timestamp: string;
  score?: number;
  feedback?: string;
}

export interface InterviewResult {
  score: number;
  summary: string;
  strengths: string[];
  weaknesses: string[];
}

export interface QuestionScore {
  question_index: number;
  score: number;
  feedback: string;
}

// ── StarRating ───────────────────────────────────────────────────
export function StarRating({ score }: { score: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 10 }, (_, i) => (
        <Star
          key={i}
          className={`h-3 w-3 ${i < score ? 'fill-amber-400 text-amber-400' : 'text-muted'}`}
        />
      ))}
      <span className="ml-1 text-xs font-medium text-muted-foreground">{score}/10</span>
    </div>
  );
}

// ── ChatInterface ─────────────────────────────────────────────────
export function ChatInterface({
  messages,
  loading,
  bottomRef,
  questionScores,
}: {
  messages: Message[];
  loading: boolean;
  bottomRef: React.RefObject<HTMLDivElement | null>;
  questionScores: QuestionScore[];
}) {
  return (
    <div className="flex-1 overflow-y-auto rounded-2xl border border-border bg-muted/30 p-4 space-y-4">
      {messages.map((msg, i) => (
        <div key={i} className={`flex gap-3 ${msg.role === 'candidate' ? 'flex-row-reverse' : 'flex-row'}`}>
          <div
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
              msg.role === 'interviewer' ? 'bg-primary/20 text-primary' : 'bg-secondary text-secondary-foreground'
            }`}
          >
            {msg.role === 'interviewer' ? <Bot className="h-4 w-4" /> : <User className="h-4 w-4" />}
          </div>
          <div className={`max-w-md ${msg.role === 'candidate' ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
            <div
              className={`rounded-2xl px-4 py-3 text-sm ${
                msg.role === 'interviewer'
                  ? 'bg-card border border-border text-foreground'
                  : 'bg-primary text-primary-foreground'
              }`}
            >
              {msg.content}
            </div>
            {msg.score !== undefined && (
              <div className="px-1">
                <StarRating score={msg.score} />
                <p className="text-xs text-muted-foreground mt-0.5 italic">{msg.feedback}</p>
              </div>
            )}
          </div>
        </div>
      ))}
      {loading && (
        <div className="flex gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20">
            <Bot className="h-4 w-4 text-primary" />
          </div>
          <div className="rounded-2xl bg-card border border-border px-4 py-3">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        </div>
      )}
      <div ref={bottomRef} />
    </div>
  );
}

// ── InterviewProgressBar ──────────────────────────────────────────
export function InterviewProgressBar({
  questionCount,
  totalQuestions,
  avgScore,
}: {
  questionCount: number;
  totalQuestions: number;
  avgScore: number;
}) {
  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-muted-foreground">
          Question {questionCount} of {totalQuestions}
        </span>
        {avgScore > 0 && (
          <span className="text-xs font-medium text-primary">
            Running Score: {avgScore}/100
          </span>
        )}
      </div>
      <Progress value={(questionCount / totalQuestions) * 100} className="h-1.5" />
    </div>
  );
}

// ── InterviewResults ──────────────────────────────────────────────
export function InterviewResults({
  result,
  questionScores,
  onReset,
}: {
  result: InterviewResult;
  questionScores: QuestionScore[];
  onReset: () => void;
}) {
  return (
    <div className="mx-auto max-w-3xl space-y-6 animate-fade-in">
      <div className="text-center">
        <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 ring-4 ring-primary/20 mb-4">
          <span className="text-3xl font-bold text-primary">{result.score}</span>
        </div>
        <h1 className="text-2xl font-bold text-foreground">Interview Complete!</h1>
        <p className="mt-2 text-muted-foreground">{result.summary}</p>
        <div className="mt-3 inline-flex items-center gap-2">
          <Badge variant={result.score >= 70 ? 'default' : 'secondary'} className="text-sm px-3 py-1">
            {result.score >= 75 ? '🎉 Excellent' : result.score >= 55 ? '👍 Good Job' : '📈 Keep Practicing'}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card>
          <CardContent className="p-5">
            <h3 className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 mb-3 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />Strengths
            </h3>
            <ul className="space-y-2">
              {result.strengths.map((s, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />{s}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <h3 className="text-sm font-semibold text-amber-600 dark:text-amber-400 mb-3">Areas to Improve</h3>
            <ul className="space-y-2">
              {result.weaknesses.map((w, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />{w}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      {questionScores.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <h3 className="font-semibold text-foreground">Question-by-Question Scores</h3>
          </CardHeader>
          <CardContent className="space-y-3">
            {questionScores.map((qs, i) => (
              <div key={i} className="flex items-start gap-4 rounded-xl bg-muted/50 p-3">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <StarRating score={qs.score} />
                  <p className="mt-1 text-xs text-muted-foreground">{qs.feedback}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Button onClick={onReset} className="w-full" id="retry-interview">
        <RotateCcw className="mr-2 h-4 w-4" />
        Start New Interview
      </Button>
    </div>
  );
}
