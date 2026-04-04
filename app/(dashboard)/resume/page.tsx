'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Upload, FileText, Sparkles, Loader2, CheckCircle2, XCircle,
  AlertTriangle, ArrowUp, ChevronRight, RotateCcw, Copy, Check, PenLine,
} from 'lucide-react';

interface ResumeFeedback {
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

function ATSGauge({ score }: { score: number }) {
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

export default function ResumePage() {
  const [mode, setMode] = useState<'upload' | 'paste'>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [pastedText, setPastedText] = useState('');
  const [targetRole, setTargetRole] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [feedback, setFeedback] = useState<ResumeFeedback | null>(null);
  const [error, setError] = useState('');
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) setFile(f);
  }

  async function handleAnalyse() {
    setAnalyzing(true);
    setError('');

    try {
      let body: FormData | string;
      const headers: Record<string, string> = {};

      if (mode === 'upload' && file) {
        const fd = new FormData();
        fd.append('resume_file', file);
        fd.append('target_role', targetRole);
        if (jobDescription) fd.append('job_description', jobDescription);
        body = fd;
      } else {
        body = JSON.stringify({ resume_text: pastedText, target_role: targetRole, job_description: jobDescription });
        headers['Content-Type'] = 'application/json';
      }

      const res = await fetch('/api/resume/ats-check', { method: 'POST', body, headers });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      setFeedback(data.feedback);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Analysis failed');
    } finally {
      setAnalyzing(false);
    }
  }

  const canAnalyse = mode === 'upload' ? !!file : pastedText.length > 100;

  if (feedback) {
    return (
      <div className="mx-auto max-w-5xl space-y-6">
        {/* Action bar */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Resume Analysis Results</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Analysed for: <span className="font-medium text-foreground">{feedback.target_role || 'General'}</span>
            </p>
          </div>
          <Button variant="outline" onClick={() => setFeedback(null)} id="new-analysis">
            <RotateCcw className="mr-2 h-4 w-4" />
            New Analysis
          </Button>
        </div>

        {/* Score + breakdown */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Card>
            <CardContent className="flex h-full items-center justify-center p-8">
              <ATSGauge score={feedback.ats_score} />
            </CardContent>
          </Card>

          <div className="lg:col-span-2 grid grid-cols-1 gap-4 sm:grid-cols-3">
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
        </div>

        {/* Parsed sections */}
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
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Resume ATS Analyzer</h1>
        <p className="mt-1 text-muted-foreground">
          Get an instant ATS score, feedback, and an AI-optimised version of your resume
        </p>
      </div>

      <Card>
        <CardContent className="p-6 space-y-6">
          {/* Mode toggle */}
          <div className="flex rounded-xl border border-border p-1 gap-1">
            {(['upload', 'paste'] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`flex-1 rounded-lg py-2 text-sm font-medium transition-all capitalize ${
                  mode === m ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  {m === 'upload'
                    ? <><Upload className="h-4 w-4" /> Upload PDF</>
                    : <><PenLine className="h-4 w-4" /> Paste Text</>}
                </div>
              </button>
            ))}
          </div>

          {/* Upload zone */}
          {mode === 'upload' && (
            <div
              onClick={() => fileRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              className={`cursor-pointer rounded-xl border-2 border-dashed p-8 text-center transition-all ${
                dragging ? 'border-primary bg-primary/5' : file ? 'border-primary/50 bg-primary/5' : 'border-border hover:border-primary/40 hover:bg-muted/50'
              }`}
            >
              <input
                ref={fileRef}
                type="file"
                accept=".pdf,.txt"
                className="hidden"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
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
          )}

          {/* Paste zone */}
          {mode === 'paste' && (
            <div className="space-y-2">
              <Label htmlFor="resume-text">Resume Content</Label>
              <Textarea
                id="resume-text"
                placeholder="Paste your full resume text here…"
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
                className="min-h-48 resize-y font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">{pastedText.length} characters</p>
            </div>
          )}

          {/* Target role + JD */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="target-role">Target Role</Label>
              <Input
                id="target-role"
                placeholder="e.g. Software Engineer"
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="jd">Job Description (optional)</Label>
              <Input
                id="jd"
                placeholder="Paste JD for better analysis"
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
              />
            </div>
          </div>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-900 dark:bg-red-950/50 dark:text-red-400">
              {error}
            </div>
          )}

          <Button
            onClick={handleAnalyse}
            disabled={!canAnalyse || analyzing}
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
            id="analyse-resume"
          >
            {analyzing ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Analysing with AI…</>
            ) : (
              <><Sparkles className="mr-2 h-4 w-4" />Analyse Resume</>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
