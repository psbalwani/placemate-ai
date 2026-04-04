'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Slider } from '@/components/ui/slider';
import { VoiceWaveform } from '@/components/interview/voice-waveform';
import { InterviewerAvatar } from '@/components/interview/interviewer-avatar';
import { ScoreRadarChart, ScoreTrendChart } from '@/components/charts/interview-charts';
import type { InterviewType, CompanyType, MultiDimensionalScore, CopilotHint } from '@/types/ai';
import {
  Sparkles, Loader2, Send, Star, MessageSquare, CheckCircle2,
  Mic, MicOff, RotateCcw, User, Bot, Camera, CameraOff,
  Code2, Users, Building2, Rocket, Briefcase, ChevronRight,
  ChevronLeft, Lightbulb, AlertTriangle, TrendingUp, History,
  Zap, Volume2, VolumeX,
} from 'lucide-react';

/* --- Types --- */
interface Message {
  role: 'interviewer' | 'candidate';
  content: string;
  timestamp: string;
  score?: number;
  feedback?: string;
  multi_score?: MultiDimensionalScore;
  question_type?: 'main' | 'followup' | 'transition';
}

interface QuestionScore {
  question_index: number;
  score: number;
  feedback: string;
  multi_score?: MultiDimensionalScore;
}

interface InterviewResult {
  score: number;
  summary: string;
  strengths: string[];
  weaknesses: string[];
  avg_multi_score?: MultiDimensionalScore;
}

/* ─── Constants ────────────────────────────────────────────────────────── */
type CompanyOption = { id: CompanyType; label: string; desc: string; icon: React.ElementType };
const COMPANY_OPTIONS: CompanyOption[] = [
  { id: 'product', label: 'Product', desc: 'Flipkart, Razorpay, Zepto', icon: Code2 },
  { id: 'service', label: 'Service', desc: 'TCS, Infosys, Wipro', icon: Building2 },
  { id: 'startup', label: 'Startup', desc: 'Fast-paced, ownership-first', icon: Rocket },
  { id: 'any', label: 'General', desc: 'Mixed difficulty', icon: Briefcase },
];

type TypeOption = { id: InterviewType; label: string; desc: string; icon: React.ElementType };
const TYPE_OPTIONS: TypeOption[] = [
  { id: 'tech', label: 'Technical Only', desc: 'DSA, system design, projects', icon: Code2 },
  { id: 'hr', label: 'HR Only', desc: 'Behavioral, STAR format', icon: Users },
  { id: 'mixed', label: 'Mixed (Both)', desc: 'HR + Technical balance', icon: Sparkles },
];

function StarRating({ score }: { score: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 10 }, (_, i) => (
        <Star key={i} className={`h-2.5 w-2.5 ${i < score ? 'fill-amber-400 text-amber-400' : 'text-white/20'}`} />
      ))}
      <span className="ml-1 text-xs font-medium text-white/50">{score}/10</span>
    </div>
  );
}

/* ─── Main Component ─────────────────────────────────────────────────────── */
export default function InterviewPage() {
  /* setup */
  const [step, setStep] = useState(1);
  const [targetRole, setTargetRole] = useState('Software Engineer');
  const [companyType, setCompanyType] = useState<CompanyType>('any');
  const [interviewType, setInterviewType] = useState<InterviewType>('mixed');
  const [techQuestions, setTechQuestions] = useState(3);
  const [hrQuestions, setHrQuestions] = useState(3);

  /* session */
  const [interviewId, setInterviewId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [questionScores, setQuestionScores] = useState<QuestionScore[]>([]);
  const [answer, setAnswer] = useState('');
  const [liveTranscript, setLiveTranscript] = useState('');
  const [loading, setLoading] = useState(false);
  const [starting, setStarting] = useState(false);
  const [result, setResult] = useState<InterviewResult | null>(null);
  const [error, setError] = useState('');
  const [totalQuestions, setTotalQuestions] = useState(6);
  const [currentAIQuestion, setCurrentAIQuestion] = useState('');

  /* voice/camera */
  const [listening, setListening] = useState(false);
  const [sttEnabled, setSttEnabled] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [cameraError, setCameraError] = useState('');

  /* copilot */
  const [hints, setHints] = useState<CopilotHint[]>([]);
  const [previousScores, setPreviousScores] = useState<{ label: string; score: number }[]>([]);

  const bottomRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<{ stop: () => void } | null>(null);
  const silenceTimerRef = useRef<number | null>(null);
  const lastVoiceDraftRef = useRef('');
  const sttWantedRef = useRef(false);
  const sttRestartTimerRef = useRef<number | null>(null);
  const sttLastErrorRef = useRef<string | null>(null);
  const loadingRef = useRef(false);
  const interviewIdRef = useRef<string | null>(null);
  const resultRef = useRef<InterviewResult | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const hintsTimerRef = useRef<number | null>(null);
  const lastResultIndexRef = useRef(0); // tracks processed STT result index

  useEffect(() => { loadingRef.current = loading; }, [loading]);
  useEffect(() => { resultRef.current = result; }, [result]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  /* FIX: Bind camera stream to video element AFTER React renders the video tag */
  useEffect(() => {
    if (cameraEnabled && streamRef.current && videoRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch(() => {});
    }
  }, [cameraEnabled]);

  const effectiveTechQ = interviewType === 'hr' ? 0 : techQuestions;
  const effectiveHrQ = interviewType === 'tech' ? 0 : hrQuestions;
  const effectiveTotal = Math.max(1, effectiveTechQ + effectiveHrQ);

  /* Load history */
  useEffect(() => {
    fetch('/api/mock-interview')
      .then(r => r.json())
      .then(d => {
        if (Array.isArray(d.interviews)) {
          const done = d.interviews.filter((i: { status: string; overall_score?: number }) =>
            i.status === 'completed' && i.overall_score != null
          ).slice(0, 6).reverse();
          setPreviousScores(done.map((i: { overall_score: number }, idx: number) => ({
            label: `#${idx + 1}`,
            score: i.overall_score,
          })));
        }
      })
      .catch(() => {});
  }, []);

  /* Cleanup */
  useEffect(() => () => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    if (sttRestartTimerRef.current) clearTimeout(sttRestartTimerRef.current);
    if (hintsTimerRef.current) clearTimeout(hintsTimerRef.current);
    window.speechSynthesis?.cancel();
  }, []);

  /* Copilot hints */
  const fetchHints = useCallback(async (text: string) => {
    if (!text.trim() || text.length < 20 || !currentAIQuestion) return;
    try {
      const res = await fetch('/api/mock-interview/hints', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: currentAIQuestion, partial_answer: text, target_role: targetRole }),
      });
      const data = await res.json();
      if (data.hints?.length) setHints(data.hints);
    } catch { /* silent */ }
  }, [currentAIQuestion, targetRole]);

  useEffect(() => {
    if (!interviewId || !answer.trim()) { setHints([]); return; }
    /* Require 8 words min + 5s debounce to avoid hammering the AI with rapid STT fragments */
    const wordCount = answer.trim().split(/\s+/).filter(Boolean).length;
    if (wordCount < 8) return;
    if (hintsTimerRef.current) clearTimeout(hintsTimerRef.current);
    hintsTimerRef.current = window.setTimeout(() => void fetchHints(answer), 5000);
    return () => { if (hintsTimerRef.current) clearTimeout(hintsTimerRef.current); };
  }, [answer, interviewId, fetchHints]);

  /* TTS */
  function stopSpeaking() { window.speechSynthesis?.cancel(); setSpeaking(false); }

  function speak(text: string) {
    if (!voiceEnabled || !text || typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    stopSpeaking();
    const u = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();
    const v = voices.find(v => v.lang.startsWith('en-IN')) || voices.find(v => v.lang.startsWith('en')) || voices[0];
    if (v) u.voice = v;
    u.onstart = () => setSpeaking(true);
    u.onend = () => setSpeaking(false);
    u.onerror = () => setSpeaking(false);
    setTimeout(() => window.speechSynthesis.speak(u), 100);
  }

  /* STT */
  function scheduleAutoSubmit(transcript: string) {
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    silenceTimerRef.current = window.setTimeout(() => {
      const draft = transcript.trim();
      /* Require at least 10 words before auto-submitting — prevents fragments like "what is" */
      const wordCount = draft.split(/\s+/).filter(Boolean).length;
      if (!draft || wordCount < 10 || draft === lastVoiceDraftRef.current) return;
      lastVoiceDraftRef.current = draft;
      setLiveTranscript('');
      void submitAnswer(draft);
    }, 4000); // 4s of silence before auto-submit
  }

  function startVoice() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { setError('Speech recognition not supported in this browser (use Chrome)'); return; }

    sttWantedRef.current = true;
    setSttEnabled(true);

    const rec = new SR();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = 'en-US';

    rec.onresult = (e: { results: { length: number; [i: number]: { [j: number]: { transcript: string }; isFinal: boolean } } }) => {
      /* FIX: Only process results from lastResultIndexRef onwards — prevents old answers replaying */
      let interim = '';
      let final = '';
      const startIdx = lastResultIndexRef.current;
      for (let i = startIdx; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) final += t;
        else interim += t;
      }
      const combined = (final + interim).trim();
      if (!combined) return;
      setLiveTranscript(combined);
      setAnswer(combined);
      if (!loadingRef.current) scheduleAutoSubmit(combined);
    };

    rec.onspeechstart = () => stopSpeaking();
    rec.onstart = () => { setError(''); sttLastErrorRef.current = null; setListening(true); };
    rec.onend = () => {
      setListening(false);
      /* restart if still wanted, interview active, not complete */
      if (sttWantedRef.current && interviewIdRef.current && !resultRef.current &&
          sttLastErrorRef.current !== 'not-allowed' && sttLastErrorRef.current !== 'audio-capture') {
        sttRestartTimerRef.current = window.setTimeout(() => {
          if (sttWantedRef.current) startVoice();
        }, 700);
      }
    };
    rec.onerror = (e: { error: string }) => {
      setListening(false);
      sttLastErrorRef.current = e.error;
      if (e.error === 'not-allowed') {
        sttWantedRef.current = false; setSttEnabled(false);
        setError('Microphone permission denied. Allow mic access in browser settings.');
      } else if (e.error === 'audio-capture') {
        sttWantedRef.current = false; setSttEnabled(false);
        setError('No microphone device detected.');
      }
    };

    try { rec.start(); setListening(true); } catch { sttWantedRef.current = false; setSttEnabled(false); }
    recognitionRef.current = rec;
  }

  function stopVoice() {
    sttWantedRef.current = false; setSttEnabled(false);
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    if (sttRestartTimerRef.current) clearTimeout(sttRestartTimerRef.current);
    recognitionRef.current?.stop();
    setListening(false); setLiveTranscript('');
  }

  /* Camera — FIX: just store stream and flip state; useEffect will bind to video element after render */
  async function enableCamera() {
    setCameraError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false });
      streamRef.current = stream;
      setCameraEnabled(true); // triggers useEffect which sets videoRef.current.srcObject
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Camera denied';
      setCameraError(msg.includes('Permission') || msg.includes('allow') ? 'Camera permission denied' : 'Could not access camera');
    }
  }

  function disableCamera() {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraEnabled(false);
  }

  /* Submit answer */
  async function submitAnswer(text: string) {
    const trimmed = text.trim();
    if (!trimmed || !interviewIdRef.current || loadingRef.current) return;

    /* FIX: clear timers & mark as submitted immediately to block any duplicate submission */
    if (silenceTimerRef.current) { clearTimeout(silenceTimerRef.current); silenceTimerRef.current = null; }
    lastVoiceDraftRef.current = trimmed;

    /* FIX: stop recognition now → onend will restart it fresh (clears accumulated results) */
    recognitionRef.current?.stop();

    setMessages(prev => [...prev, { role: 'candidate', content: trimmed, timestamp: new Date().toISOString() }]);
    setAnswer(''); setLiveTranscript(''); setHints([]);
    setLoading(true);
    lastResultIndexRef.current = 0; // reset for the new recognition session that will start

    try {
      const res = await fetch('/api/mock-interview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'answer', interview_id: interviewIdRef.current, answer: trimmed }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      const ai = data.ai;
      const qType: 'main' | 'followup' | 'transition' = ai.question_type ?? 'main';

      /* Only score main-type answers (follow-ups don't add to score history) */
      if (ai.previous_score > 0 && qType === 'main') {
        setMessages(prev => {
          const msgs = [...prev];
          const idx = msgs.slice().reverse().findIndex(m => m.role === 'candidate');
          if (idx >= 0) msgs[msgs.length - 1 - idx] = { ...msgs[msgs.length - 1 - idx], score: ai.previous_score, feedback: ai.feedback_on_previous, multi_score: ai.multi_score ?? undefined };
          return msgs;
        });
        setQuestionScores(prev => [...prev, { question_index: prev.length, score: ai.previous_score, feedback: ai.feedback_on_previous, multi_score: ai.multi_score ?? undefined }]);
      } else if (ai.feedback_on_previous && qType === 'followup') {
        /* For follow-ups, just update feedback on the last candidate message without scoring */
        setMessages(prev => {
          const msgs = [...prev];
          const idx = msgs.slice().reverse().findIndex(m => m.role === 'candidate');
          if (idx >= 0) msgs[msgs.length - 1 - idx] = { ...msgs[msgs.length - 1 - idx], feedback: ai.feedback_on_previous };
          return msgs;
        });
      }

      if (ai.next_question) {
        setCurrentAIQuestion(ai.next_question);
        setMessages(prev => [...prev, {
          role: 'interviewer',
          content: ai.next_question,
          timestamp: new Date().toISOString(),
          question_type: qType,
        }]);
        speak(ai.next_question);
      }

      if (ai.is_complete && ai.overall_result) { stopSpeaking(); setResult(ai.overall_result); }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to submit');
    } finally { setLoading(false); }
  }

  /* Start interview */
  async function startInterview() {
    setStarting(true); setError('');
    try {
      const res = await fetch('/api/mock-interview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'start', target_role: targetRole,
          interview_type: interviewType, tech_questions: effectiveTechQ,
          hr_questions: effectiveHrQ, company_type: companyType,
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      /* FIX: Set ref immediately before startVoice to avoid race condition */
      interviewIdRef.current = data.interview_id;
      setInterviewId(data.interview_id);
      setTotalQuestions(effectiveTotal);

      if (data.ai.next_question) {
        const q = data.ai.next_question as string;
        setCurrentAIQuestion(q);
        setMessages([{ role: 'interviewer', content: q, timestamp: new Date().toISOString() }]);
        speak(q);
      }
      startVoice();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to start');
    } finally { setStarting(false); }
  }

  function resetInterview() {
    stopVoice(); stopSpeaking(); disableCamera();
    setInterviewId(null); interviewIdRef.current = null;
    setMessages([]); setQuestionScores([]);
    setAnswer(''); setLiveTranscript(''); setResult(null);
    setError(''); setHints([]); setCurrentAIQuestion(''); setStep(1);
  }

  useEffect(() => { if (result) stopVoice(); }, [result]);

  const avgScore = questionScores.length > 0
    ? Math.round(questionScores.reduce((a, b) => a + b.score, 0) / questionScores.length * 10)
    : 0;

  const hintIcons: Record<string, React.ElementType> = { warning: AlertTriangle, suggestion: Lightbulb, positive: CheckCircle2 };
  const hintColors: Record<string, string> = {
    warning: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    suggestion: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
    positive: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  };

  /* ── RESULTS ─────────────────────────────────────────────────────────── */
  if (result) {
    const trendData = [...previousScores, { label: 'Now', score: result.score }];
    return (
      <div className="mx-auto max-w-4xl space-y-6 animate-fade-in">
        <div className="relative overflow-hidden rounded-3xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 via-card to-card p-8 text-center">
          <div className="absolute left-1/2 top-0 -translate-x-1/2 h-40 w-80 bg-emerald-500/8 blur-3xl rounded-full pointer-events-none" />
          <div className="relative">
            <div className="inline-flex h-24 w-24 items-center justify-center rounded-full bg-emerald-500/15 ring-4 ring-emerald-500/20 mb-4">
              <span className="text-4xl font-black text-emerald-400">{result.score}</span>
            </div>
            <h1 className="text-2xl font-bold text-foreground">Interview Complete!</h1>
            <p className="mt-2 text-muted-foreground max-w-lg mx-auto">{result.summary}</p>
            <div className="mt-3 flex items-center justify-center gap-2">
              <Badge variant={result.score >= 70 ? 'default' : 'secondary'} className="text-sm px-3 py-1">
                {result.score >= 75 ? '🏆 Excellent' : result.score >= 55 ? '👍 Good' : '📈 Keep Practicing'}
              </Badge>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {result.avg_multi_score && (
            <Card><CardHeader className="pb-2"><h3 className="text-sm font-semibold">Performance Breakdown</h3></CardHeader>
              <CardContent><ScoreRadarChart score={result.avg_multi_score} color="#10b981" size={220} /></CardContent>
            </Card>
          )}
          <Card><CardHeader className="pb-2"><h3 className="text-sm font-semibold flex items-center gap-2"><TrendingUp className="h-4 w-4 text-primary" />Score Trend</h3></CardHeader>
            <CardContent>
              {trendData.length > 1 ? <ScoreTrendChart data={trendData} height={200} /> :
                <div className="flex h-[200px] items-center justify-center text-sm text-muted-foreground">Complete more interviews to see trend</div>}
            </CardContent>
          </Card>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Card><CardContent className="p-5">
            <h3 className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 mb-3 flex items-center gap-2"><CheckCircle2 className="h-4 w-4" />Strengths</h3>
            <ul className="space-y-2">{result.strengths.map((s, i) => <li key={i} className="flex items-start gap-2 text-sm"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />{s}</li>)}</ul>
          </CardContent></Card>
          <Card><CardContent className="p-5">
            <h3 className="text-sm font-semibold text-amber-600 dark:text-amber-400 mb-3 flex items-center gap-2"><AlertTriangle className="h-4 w-4" />Areas to Improve</h3>
            <ul className="space-y-2">{result.weaknesses.map((w, i) => <li key={i} className="flex items-start gap-2 text-sm"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />{w}</li>)}</ul>
          </CardContent></Card>
        </div>
        <Card><CardHeader className="pb-3"><h3 className="font-semibold">Question Scores</h3></CardHeader>
          <CardContent className="space-y-3">
            {questionScores.map((qs, i) => (
              <div key={i} className="rounded-xl bg-muted/50 p-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">{i + 1}</div>
                  <div className="flex-1"><StarRating score={qs.score} /><p className="mt-1 text-xs text-muted-foreground italic">{qs.feedback}</p></div>
                </div>
                {qs.multi_score && (
                  <div className="grid grid-cols-5 gap-1 mt-2">
                    {Object.entries(qs.multi_score).map(([k, v]) => (
                      <div key={k} className="text-center">
                        <div className="text-[10px] text-muted-foreground capitalize">{k.slice(0, 4)}</div>
                        <div className="text-xs font-semibold">{v}/10</div>
                        <div className="mt-0.5 h-1 rounded-full bg-muted overflow-hidden">
                          <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${(v / 10) * 100}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
        <div className="flex gap-3">
          <Button onClick={resetInterview} className="flex-1" id="retry-interview"><RotateCcw className="mr-2 h-4 w-4" />New Interview</Button>
          <Button variant="outline" asChild><a href="/interview/history"><History className="mr-2 h-4 w-4" />History</a></Button>
        </div>
      </div>
    );
  }

  /* ── ACTIVE INTERVIEW ────────────────────────────────────────────────── */
  if (interviewId) {
    return (
      <div className="fixed inset-0 bg-[#080b14] text-white flex flex-col" style={{ zIndex: 10 }}>

        {/* ── TOP BAR ─────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-5 py-2.5 border-b border-white/8 bg-[#0d1120]/90 backdrop-blur shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={resetInterview} title="End Interview"
              className="flex items-center gap-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 px-2.5 py-1.5 text-xs text-red-400 transition-all">
              <RotateCcw className="h-3 w-3" /> End
            </button>
            <div>
              <p className="text-sm font-bold text-white leading-tight">{targetRole}</p>
              <p className="text-[11px] text-white/40 capitalize">{companyType} · {interviewType === 'mixed' ? 'HR + Tech' : interviewType}</p>
            </div>
          </div>
          {/* Progress pills */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              {Array.from({ length: totalQuestions }, (_, i) => (
                <div key={i} className={`h-1.5 w-6 rounded-full transition-all ${
                  i < questionScores.length ? 'bg-emerald-500' : 'bg-white/10'
                }`} />
              ))}
            </div>
            <span className="text-xs text-white/40">{questionScores.length}<span className="text-white/20">/{totalQuestions}</span></span>
            {avgScore > 0 && (
              <div className="flex items-center gap-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1">
                <Star className="h-3 w-3 text-emerald-400 fill-emerald-400" />
                <span className="text-sm font-bold text-emerald-400">{avgScore}</span>
                <span className="text-xs text-white/30">/100</span>
              </div>
            )}
            {/* Voice toggle */}
            <button
              onClick={() => { if (voiceEnabled) stopSpeaking(); setVoiceEnabled(v => !v); }}
              className={`rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all border ${voiceEnabled ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20' : 'bg-white/5 text-white/30 border-white/10'}`}
            >
              {voiceEnabled ? <Volume2 className="h-3.5 w-3.5 inline" /> : <VolumeX className="h-3.5 w-3.5 inline" />}
            </button>
          </div>
        </div>

        {/* ── MAIN BODY ────────────────────────────────────────────────────── */}
        <div className="flex flex-1 overflow-hidden min-h-0">

          {/* ── LEFT: Interviewer Avatar ─── */}
          <div className="flex flex-col w-[300px] shrink-0 border-r border-white/8 bg-[#090c18]">
            {/* Avatar panel — fills most of left column */}
            <div className="relative flex-1 flex flex-col items-center justify-center min-h-0 overflow-hidden">
              {/* Ambient glow */}
              <div className={`absolute inset-0 transition-opacity duration-700 ${speaking ? 'opacity-100' : 'opacity-0'}`}
                style={{ background: 'radial-gradient(circle at 50% 40%, rgba(16,185,129,0.08) 0%, transparent 70%)' }} />
              {/* Avatar — contained, never clipped */}
              <div className="relative z-10 flex items-center justify-center w-full" style={{ height: 'min(320px, 55vh)' }}>
                <InterviewerAvatar speaking={speaking} listening={listening} size="lg" name="Priya · AI Interviewer" />
              </div>
              {/* State badge */}
              <div className={`relative z-10 mt-1 flex items-center gap-2 rounded-full px-3 py-1.5 border text-xs font-semibold transition-all ${
                speaking ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25' :
                loading  ? 'bg-amber-500/15  text-amber-400  border-amber-500/25'  :
                listening ? 'bg-blue-500/15 text-blue-400 border-blue-500/25' :
                'bg-white/5 text-white/30 border-white/10'
              }`}>
                <span className={`h-1.5 w-1.5 rounded-full ${
                  speaking ? 'bg-emerald-400 animate-pulse' : loading ? 'bg-amber-400 animate-pulse' : listening ? 'bg-blue-400 animate-pulse' : 'bg-white/20'
                }`} />
                {speaking ? 'Speaking…' : loading ? 'Thinking…' : listening ? 'Listening…' : 'Ready'}
              </div>
              {/* Live waveform */}
              <div className="relative z-10 mt-3 px-4 w-full">
                <VoiceWaveform listening={listening} speaking={speaking} size="sm" />
              </div>
            </div>

            {/* User camera — fixed height at bottom */}
            <div className="shrink-0 m-3 relative rounded-xl overflow-hidden bg-[#0d1120] border border-white/8" style={{ height: '130px' }}>
              <video ref={videoRef} className={`w-full h-full object-cover ${cameraEnabled ? 'block' : 'hidden'}`} playsInline muted autoPlay />
              {!cameraEnabled && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                  <User className="h-5 w-5 text-white/15" />
                  <button onClick={enableCamera}
                    className="flex items-center gap-1.5 rounded-lg bg-white/8 hover:bg-white/12 border border-white/10 px-3 py-1.5 text-xs text-white/60 hover:text-white transition-all">
                    <Camera className="h-3 w-3" /> Enable Camera
                  </button>
                  {cameraError && <p className="text-[10px] text-amber-400">{cameraError}</p>}
                </div>
              )}
              {cameraEnabled && (
                <>
                  <div className="absolute top-1.5 left-1.5 flex items-center gap-1 rounded px-1.5 py-0.5 bg-black/60 text-[10px] text-white/60">
                    <span className="h-1 w-1 rounded-full bg-red-400 animate-pulse" /> You
                  </div>
                  <button onClick={disableCamera}
                    className="absolute top-1.5 right-1.5 rounded bg-black/50 p-1 text-white/50 hover:text-white transition-all">
                    <CameraOff className="h-3 w-3" />
                  </button>
                </>
              )}
            </div>

            {/* Score mini-bars */}
            {questionScores.length > 0 && (
              <div className="shrink-0 mx-3 mb-3 rounded-xl border border-white/8 bg-[#0d1120] p-3 space-y-1.5">
                <p className="text-[10px] text-white/30 font-semibold uppercase tracking-wider mb-2">Q Scores</p>
                {questionScores.map((qs, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="text-[10px] text-white/30 w-3 shrink-0">{i + 1}</span>
                    <div className="flex-1 h-1 rounded-full bg-white/8 overflow-hidden">
                      <div className={`h-full rounded-full transition-all ${qs.score >= 7 ? 'bg-emerald-500' : qs.score >= 4 ? 'bg-amber-500' : 'bg-red-500'}`}
                        style={{ width: `${(qs.score / 10) * 100}%` }} />
                    </div>
                    <span className="text-[10px] font-bold text-white/50">{qs.score}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── RIGHT: Chat area ──────────────────────────────────── */}
          <div className="flex flex-1 flex-col overflow-hidden min-h-0">

            {/* Current question pinned header */}
            {currentAIQuestion && (
              <div className="shrink-0 px-5 py-3 border-b border-white/8 bg-[#0d1120]/70 backdrop-blur">
                <div className="flex items-start gap-3">
                  <div className="shrink-0 mt-0.5 h-7 w-7 flex items-center justify-center rounded-full bg-emerald-500/15 ring-1 ring-emerald-500/30">
                    <Bot className="h-4 w-4 text-emerald-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Current Question</p>
                      {questionScores.length < totalQuestions && (
                        <span className="text-[10px] text-white/25">Q{questionScores.length + 1} of {totalQuestions}</span>
                      )}
                    </div>
                    <p className="text-sm font-medium text-white leading-relaxed">{currentAIQuestion}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Copilot hints */}
            {hints.length > 0 && (
              <div className="shrink-0 px-4 pt-2 pb-1 flex gap-2 flex-wrap border-b border-white/5">
                {hints.map((h, i) => {
                  const Icon = hintIcons[h.type] ?? Lightbulb;
                  return (
                    <div key={i} className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs ${hintColors[h.type]}`}>
                      <Icon className="h-3 w-3 shrink-0" />{h.text}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Chat messages */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 min-h-0">
              {messages.map((msg, i) => {
                const isFollowup = msg.role === 'interviewer' && msg.question_type === 'followup';
                const isTransition = msg.role === 'interviewer' && msg.question_type === 'transition';
                return (
                  <div key={i} className={`flex gap-3 ${msg.role === 'candidate' ? 'flex-row-reverse' : ''}`}>
                    <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs ${
                      msg.role === 'interviewer'
                        ? isFollowup ? 'bg-blue-500/15 text-blue-400' : 'bg-emerald-500/15 text-emerald-400'
                        : 'bg-white/10 text-white/60'
                    }`}>
                      {msg.role === 'interviewer' ? <Bot className="h-3.5 w-3.5" /> : <User className="h-3.5 w-3.5" />}
                    </div>
                    <div className={`max-w-[70%] flex flex-col gap-1.5 ${msg.role === 'candidate' ? 'items-end' : 'items-start'}`}>
                      {isFollowup && <span className="text-[10px] font-semibold text-blue-400/70 tracking-wide">↳ Follow-up</span>}
                      {isTransition && <span className="text-[10px] font-semibold text-amber-400/60 tracking-wide">→ Next Question</span>}
                      <div className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                        msg.role === 'interviewer'
                          ? isFollowup   ? 'bg-blue-500/8 border border-blue-500/15 text-white/85'
                          : isTransition ? 'bg-amber-500/8 border border-amber-500/15 text-white/70 italic'
                          :                'bg-white/6 border border-white/8 text-white/85'
                          : 'bg-emerald-600/25 border border-emerald-500/20 text-white'
                      }`}>
                        {msg.content}
                      </div>
                      {msg.score !== undefined && (
                        <div className="px-1 space-y-1">
                          <StarRating score={msg.score} />
                          {msg.feedback && <p className="text-xs text-white/35 italic">{msg.feedback}</p>}
                          {msg.multi_score && (
                            <div className="flex gap-1.5 flex-wrap">
                              {Object.entries(msg.multi_score).map(([k, v]) => (
                                <span key={k} className="text-[10px] bg-white/5 rounded px-1.5 py-0.5 text-white/40">
                                  {k.slice(0, 4)}: <span className="text-white/65 font-semibold">{v}</span>
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              {loading && (
                <div className="flex gap-3">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500/15">
                    <Bot className="h-3.5 w-3.5 text-emerald-400" />
                  </div>
                  <div className="rounded-2xl bg-white/5 border border-white/8 px-4 py-2.5 flex items-center gap-2">
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-white/40" />
                    <span className="text-sm text-white/35">Evaluating…</span>
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Error */}
            {error && (
              <div className="shrink-0 mx-4 mb-2 rounded-lg border border-red-500/20 bg-red-500/8 px-3 py-2 text-xs text-red-400">{error}</div>
            )}

            {/* ── Answer input bar ─────────────────────────────── */}
            <div className="shrink-0 p-4 border-t border-white/8 bg-[#0d1120]/60">
              {/* Live transcript preview */}
              {liveTranscript && (
                <div className="mb-2 flex items-center gap-2 text-xs text-white/40 italic">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                  {liveTranscript}
                </div>
              )}
              <div className="flex items-center gap-2">
                {/* Mic button */}
                <button
                  onClick={sttEnabled ? stopVoice : startVoice}
                  title={sttEnabled ? 'Stop mic' : 'Start mic'}
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition-all ${
                    sttEnabled ? 'bg-red-500/15 border-red-500/30 text-red-400 hover:bg-red-500/20 animate-pulse' : 'bg-white/5 border-white/10 text-white/40 hover:bg-white/10 hover:text-white/70'
                  }`}
                >
                  {sttEnabled ? <MicOff className="h-4.5 w-4.5" /> : <Mic className="h-4.5 w-4.5" />}
                </button>
                {/* Text input */}
                <input
                  id="interview-answer"
                  value={answer}
                  onChange={e => setAnswer(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void submitAnswer(answer); } }}
                  disabled={loading}
                  placeholder={listening ? 'Listening… (or type here)' : 'Type your answer or use mic…'}
                  className="flex-1 h-11 rounded-xl bg-white/5 border border-white/10 px-4 text-sm text-white placeholder:text-white/25 outline-none focus:border-emerald-500/40 focus:bg-white/8 transition-all disabled:opacity-50"
                />
                <button
                  onClick={() => void submitAnswer(answer)}
                  disabled={!answer.trim() || loading}
                  id="send-answer"
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white transition-all"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ── SETUP WIZARD ────────────────────────────────────────────────────── */
  return (
    <div className="mx-auto max-w-2xl space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Mock Interview</h1>
        <p className="mt-1 text-muted-foreground">Configure your interview, then practice with an AI interviewer</p>
      </div>

      {/* Steps */}
      <div className="flex items-center gap-2">
        {[1, 2, 3].map(s => (
          <div key={s} className="flex items-center gap-2">
            <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold transition-all ${
              s < step ? 'bg-emerald-500 text-white' : s === step ? 'bg-primary text-primary-foreground ring-4 ring-primary/20' : 'bg-muted text-muted-foreground'
            }`}>
              {s < step ? <CheckCircle2 className="h-4 w-4" /> : s}
            </div>
            {s < 3 && <div className={`h-px w-8 transition-colors ${s < step ? 'bg-emerald-500' : 'bg-muted'}`} />}
          </div>
        ))}
        <span className="ml-2 text-sm text-muted-foreground">
          {step === 1 ? 'Role & Company' : step === 2 ? 'Interview Type' : 'Question Count'}
        </span>
      </div>

      <Card>
        <CardContent className="p-8 space-y-6">

          {/* Step 1 */}
          {step === 1 && (
            <div className="space-y-6 animate-fade-in">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Target Role</label>
                <Input
                  id="interview-role"
                  placeholder="e.g. Software Engineer, Data Analyst, Full Stack Dev"
                  value={targetRole}
                  onChange={e => setTargetRole(e.target.value)}
                />
              </div>
              <div className="space-y-3">
                <label className="text-sm font-medium text-foreground">Company Type</label>
                <div className="grid grid-cols-2 gap-3">
                  {COMPANY_OPTIONS.map(({ id, label, desc, icon: Icon }) => (
                    <button key={id} onClick={() => setCompanyType(id)}
                      className={`flex items-start gap-3 rounded-xl border p-3 text-left transition-all ${companyType === id ? 'border-primary bg-primary/5 ring-2 ring-primary/20' : 'border-border hover:bg-muted/50'}`}
                    >
                      <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${companyType === id ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground'}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{label}</p>
                        <p className="text-xs text-muted-foreground">{desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 2 */}
          {step === 2 && (
            <div className="space-y-4 animate-fade-in">
              <label className="text-sm font-medium text-foreground">Interview Type</label>
              <div className="space-y-3">
                {TYPE_OPTIONS.map(({ id, label, desc, icon: Icon }) => (
                  <button key={id} onClick={() => setInterviewType(id)}
                    className={`w-full flex items-center gap-4 rounded-xl border p-4 text-left transition-all ${interviewType === id ? 'border-primary bg-primary/5 ring-2 ring-primary/20' : 'border-border hover:bg-muted/50'}`}
                  >
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${interviewType === id ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground'}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold">{label}</p>
                      <p className="text-xs text-muted-foreground">{desc}</p>
                    </div>
                    {interviewType === id && <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 3 */}
          {step === 3 && (
            <div className="space-y-6 animate-fade-in">
              {interviewType !== 'hr' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium flex items-center gap-2"><Code2 className="h-4 w-4 text-blue-400" />Technical Questions</label>
                    <span className="text-lg font-bold tabular-nums">{techQuestions}</span>
                  </div>
                  <Slider value={[techQuestions]} onValueChange={([v]) => setTechQuestions(v)} min={1} max={10} step={1} />
                  <div className="flex justify-between text-xs text-muted-foreground"><span>1 (quick)</span><span>10 (thorough)</span></div>
                </div>
              )}
              {interviewType !== 'tech' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium flex items-center gap-2"><Users className="h-4 w-4 text-purple-400" />HR Questions</label>
                    <span className="text-lg font-bold tabular-nums">{hrQuestions}</span>
                  </div>
                  <Slider value={[hrQuestions]} onValueChange={([v]) => setHrQuestions(v)} min={1} max={10} step={1} />
                  <div className="flex justify-between text-xs text-muted-foreground"><span>1 (essential)</span><span>10 (in-depth)</span></div>
                </div>
              )}
              <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-3">
                <p className="text-sm font-semibold">Summary</p>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><p className="text-xs text-muted-foreground">Role</p><p className="font-medium">{targetRole}</p></div>
                  <div><p className="text-xs text-muted-foreground">Company</p><p className="font-medium capitalize">{companyType}</p></div>
                  <div><p className="text-xs text-muted-foreground">Type</p><p className="font-medium capitalize">{interviewType}</p></div>
                  <div><p className="text-xs text-muted-foreground">Total Qs</p><p className="text-xl font-black text-primary">{effectiveTotal}</p></div>
                </div>
              </div>
            </div>
          )}

          {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-900 dark:bg-red-950/40 dark:text-red-400">{error}</div>}

          <div className="flex gap-3 pt-2">
            {step > 1 && (
              <Button variant="outline" onClick={() => setStep(s => s - 1)} className="flex-1">
                <ChevronLeft className="mr-2 h-4 w-4" />Back
              </Button>
            )}
            {step < 3 ? (
              <Button onClick={() => setStep(s => s + 1)} disabled={step === 1 && !targetRole.trim()} className="flex-1">
                Next<ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button
                onClick={startInterview}
                disabled={starting || !targetRole.trim()}
                className="flex-1 bg-emerald-600 text-white hover:bg-emerald-500"
                id="start-interview"
              >
                {starting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Starting…</> : <><Sparkles className="mr-2 h-4 w-4" />Begin ({effectiveTotal} Questions)</>}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {previousScores.length > 0 && (
        <Card>
          <CardHeader className="pb-2"><h3 className="text-sm font-semibold flex items-center gap-2"><TrendingUp className="h-4 w-4 text-primary" />Recent Performance</h3></CardHeader>
          <CardContent><ScoreTrendChart data={previousScores} height={120} /></CardContent>
        </Card>
      )}
    </div>
  );
}
