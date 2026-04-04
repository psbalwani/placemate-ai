'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Upload, FileText, CheckCircle2, XCircle, AlertTriangle,
  ChevronRight, Copy, Check,
} from 'lucide-react';

// ── Re-export types for convenience ─────────────────────────────
export interface ResumeFeedback {
  id: string;
  ats_score: number;
  target_role: string;
  strengths_json: string[];
  weaknesses_json: string[];
  improvement_actions_json: string[];
  improved_resume_text: string;
  parsed_json: {
    name: string;
    summary: string;
    skills: string[];
    education: { degree: string; institution: string; year: string }[];
    experience: { title: string; company: string; duration: string; bullets: string[] }[];
    projects: { name: string; description: string; tech: string[] }[];
  };
}

// ── ATSScoreGauge ───────────────────────────────────────────────
export function ATSScoreGauge({ score }: { score: number }) {
  const color =
    score >= 75 ? '#10b981' : score >= 50 ? '#f59e0b' : score >= 25 ? '#f97316' : '#ef4444';
  const label = score >= 75 ? 'Strong' : score >= 50 ? 'Good' : score >= 25 ? 'Fair' : 'Weak';
  const r = 54;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative h-36 w-36">
        <svg className="-rotate-90" width="144" height="144" viewBox="0 0 144 144">
          <circle cx="72" cy="72" r={r} fill="none" stroke="currentColor" strokeWidth="12" className="text-muted" />
          <circle
            cx="72" cy="72" r={r} fill="none"
            stroke={color} strokeWidth="12" strokeLinecap="round"
            strokeDasharray={circ} strokeDashoffset={offset}
            style={{ transition: 'stroke-dashoffset 1.2s ease', filter: `drop-shadow(0 0 8px ${color}88)` }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold tabular-nums" style={{ color }}>{score}</span>
          <span className="text-xs text-muted-foreground">/100</span>
        </div>
      </div>
      <div className="text-center">
        <p className="text-sm font-semibold" style={{ color }}>{label} ATS Score</p>
        <p className="text-xs text-muted-foreground">Applicant Tracking System</p>
      </div>
    </div>
  );
}

// ── CopyButton ──────────────────────────────────────────────────
function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  function copy() {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }
  return (
    <button onClick={copy} className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
      {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
    </button>
  );
}

// ── FeedbackPanel ───────────────────────────────────────────────
export function FeedbackPanel({ feedback }: { feedback: ResumeFeedback }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">Strengths</span>
          </div>
          <ul className="space-y-2">
            {feedback.strengths_json.map((s, i) => (
              <li key={i} className="text-xs text-foreground flex items-start gap-1.5">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                {s}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <XCircle className="h-4 w-4 text-red-500" />
            <span className="text-sm font-semibold text-red-600 dark:text-red-400">Weaknesses</span>
          </div>
          <ul className="space-y-2">
            {feedback.weaknesses_json.map((w, i) => (
              <li key={i} className="text-xs text-foreground flex items-start gap-1.5">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-red-500" />
                {w}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            <span className="text-sm font-semibold text-amber-600 dark:text-amber-400">Actions</span>
          </div>
          <ul className="space-y-2">
            {feedback.improvement_actions_json.slice(0, 5).map((a, i) => (
              <li key={i} className="text-xs text-foreground flex items-start gap-1.5">
                <ChevronRight className="mt-0.5 h-3 w-3 shrink-0 text-amber-500" />
                {a}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

// ── ResumeComparison ────────────────────────────────────────────
export function ResumeComparison({ feedback }: { feedback: ResumeFeedback }) {
  return (
    <Tabs defaultValue="improved">
      <TabsList>
        <TabsTrigger value="improved">Improved Resume</TabsTrigger>
        <TabsTrigger value="parsed">Parsed Sections</TabsTrigger>
      </TabsList>
      <TabsContent value="improved">
        <Card>
          <CardHeader className="flex-row items-center justify-between pb-2">
            <h3 className="font-semibold text-foreground">AI-Optimised Resume</h3>
            <CopyButton text={feedback.improved_resume_text} />
          </CardHeader>
          <CardContent>
            <pre className="whitespace-pre-wrap rounded-xl bg-muted p-4 text-sm text-foreground font-mono leading-relaxed max-h-96 overflow-y-auto">
              {feedback.improved_resume_text}
            </pre>
          </CardContent>
        </Card>
      </TabsContent>
      <TabsContent value="parsed">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Card>
            <CardContent className="p-4 space-y-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">Name</p>
                <p className="text-sm font-medium text-foreground">{feedback.parsed_json.name}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">Summary</p>
                <p className="text-sm text-foreground">{feedback.parsed_json.summary}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Skills</p>
                <div className="flex flex-wrap gap-1.5">
                  {feedback.parsed_json.skills?.map((s, i) => (
                    <Badge key={i} variant="secondary" className="text-xs">{s}</Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 space-y-3">
              {feedback.parsed_json.education?.map((e, i) => (
                <div key={i}>
                  <p className="text-sm font-medium text-foreground">{e.degree}</p>
                  <p className="text-xs text-muted-foreground">{e.institution} · {e.year}</p>
                </div>
              ))}
              {feedback.parsed_json.projects?.map((p, i) => (
                <div key={i} className="border-t border-border pt-3">
                  <p className="text-sm font-medium text-foreground">{p.name}</p>
                  <p className="text-xs text-muted-foreground line-clamp-2">{p.description}</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {p.tech?.map((t, ti) => <Badge key={ti} variant="secondary" className="text-xs">{t}</Badge>)}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </TabsContent>
    </Tabs>
  );
}

// ── ResumeUploader ──────────────────────────────────────────────
export function ResumeUploader({
  file,
  onFile,
  dragging,
  onDragOver,
  onDragLeave,
  onDrop,
  fileRef,
}: {
  file: File | null;
  onFile: (f: File) => void;
  dragging: boolean;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent) => void;
  fileRef: React.RefObject<HTMLInputElement | null>;
}) {
  return (
    <div
      onClick={() => fileRef.current?.click()}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      className={`cursor-pointer rounded-xl border-2 border-dashed p-8 text-center transition-all ${
        dragging ? 'border-primary bg-primary/5' : file ? 'border-primary/50 bg-primary/5' : 'border-border hover:border-primary/40 hover:bg-muted/50'
      }`}
    >
      <input
        ref={fileRef}
        type="file"
        accept=".pdf,.txt"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); }}
      />
      {file ? (
        <div className="flex flex-col items-center gap-2">
          <FileText className="h-10 w-10 text-primary" />
          <p className="font-medium text-foreground">{file.name}</p>
          <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(0)} KB</p>
          <Badge variant="secondary">Ready to analyse</Badge>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2">
          <Upload className="h-10 w-10 text-muted-foreground/50" />
          <p className="font-medium text-foreground">Drop your resume here</p>
          <p className="text-xs text-muted-foreground">PDF or TXT · Max 5 MB</p>
        </div>
      )}
    </div>
  );
}
