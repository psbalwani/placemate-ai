'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Briefcase, Plus, Building2, MapPin, Calendar, Users,
  ChevronRight, Loader2, Sparkles, X, CalendarDays, IndianRupee,
} from 'lucide-react';
import Link from 'next/link';

interface ParsedJd {
  required_skills?: string[];
  preferred_skills?: string[];
  role_category?: string;
  role_summary?: string;
  eligibility_hints?: { branches?: string[]; min_cgpa?: number | null; batch_year?: string | null };
}

interface Drive {
  id: string;
  company_name: string;
  role_title: string;
  status: string;
  ctc?: string;
  location?: string;
  drive_date?: string;
  shortlist_count: number;
  invited_count: number;
  parsed_jd_json: ParsedJd;
  created_at: string;
}

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-white/5 text-white/40 border-white/10',
  active: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25',
  closed: 'bg-red-500/10 text-red-400 border-red-500/20',
};

const ROLE_LABELS: Record<string, string> = {
  service_MNC: 'Service MNC', product_SDE: 'Product SDE',
  data_analyst: 'Data Analyst', devops: 'DevOps',
  frontend: 'Frontend', fullstack: 'Full Stack', other: 'Other',
};

/* ─── Create Drive Modal ─────────────────────────────────────────────────── */
function CreateDriveModal({ onClose, onCreated }: { onClose: () => void; onCreated: (d: Drive) => void }) {
  const [step, setStep] = useState<'form' | 'parsing' | 'review'>('form');
  const [form, setForm] = useState({
    company_name: '', role_title: '', jd_text: '', ctc: '', location: '', drive_date: '',
  });
  const [parsed, setParsed] = useState<ParsedJd | null>(null);
  const [eligibility, setEligibility] = useState<{ branches: string[]; min_cgpa_band: string; batch_year: string }>({
    branches: ['CSE', 'IT', 'ECE'], min_cgpa_band: '6.0', batch_year: '2025',
  });
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  const BRANCHES = ['CSE', 'IT', 'ECE', 'EE', 'ME', 'CE', 'CH'];

  async function analyseJD() {
    if (!form.company_name || !form.role_title || !form.jd_text.trim()) {
      setError('Company, role title and JD text are required'); return;
    }
    setStep('parsing'); setError('');
    try {
      const res = await fetch('/api/tpo/drives', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, _parse_only: true }),
      });
      // We create the drive directly and get parsed data back
      const data = await res.json();
      if (!data.success) { setError(data.error ?? 'Failed'); setStep('form'); return; }
      onCreated(data.drive as Drive);
      onClose();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error');
      setStep('form');
    }
  }

  const update = (k: keyof typeof form, v: string) => setForm((p) => ({ ...p, [k]: v }));
  const toggleBranch = (b: string) =>
    setEligibility((p) => ({
      ...p,
      branches: p.branches.includes(b) ? p.branches.filter((x) => x !== b) : [...p.branches, b],
    }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-2xl bg-[#0d1120] border border-white/10 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/8">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-emerald-500/15 flex items-center justify-center">
              <Briefcase className="h-4 w-4 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">New Placement Drive</h2>
              <p className="text-xs text-white/40">Paste JD → AI parses everything</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-white/40 hover:bg-white/8 hover:text-white transition-all">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {error && (
            <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-2 text-sm text-red-400">{error}</div>
          )}

          {/* Row 1: Company + Role */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-white/50 uppercase tracking-wider">Company Name</label>
              <input value={form.company_name} onChange={(e) => update('company_name', e.target.value)}
                className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-sm text-white placeholder:text-white/25 outline-none focus:border-emerald-500/40 transition-all"
                placeholder="e.g. TCS, Infosys" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-white/50 uppercase tracking-wider">Role Title</label>
              <input value={form.role_title} onChange={(e) => update('role_title', e.target.value)}
                className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-sm text-white placeholder:text-white/25 outline-none focus:border-emerald-500/40 transition-all"
                placeholder="e.g. Software Engineer" />
            </div>
          </div>

          {/* Row 2: CTC + Location + Date */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { k: 'ctc', label: 'CTC', placeholder: 'e.g. ₹3.5 LPA' },
              { k: 'location', label: 'Location', placeholder: 'e.g. Bangalore' },
              { k: 'drive_date', label: 'Drive Date', placeholder: '', type: 'date' },
            ].map(({ k, label, placeholder, type }) => (
              <div key={k} className="space-y-1.5">
                <label className="text-xs font-semibold text-white/50 uppercase tracking-wider">{label}</label>
                <input
                  type={type ?? 'text'}
                  value={form[k as keyof typeof form]}
                  onChange={(e) => update(k as keyof typeof form, e.target.value)}
                  className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-sm text-white placeholder:text-white/25 outline-none focus:border-emerald-500/40 transition-all"
                  placeholder={placeholder}
                />
              </div>
            ))}
          </div>

          {/* JD Textarea */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-white/50 uppercase tracking-wider">
              Job Description <span className="text-emerald-400/60 normal-case">— paste full JD, AI will parse it</span>
            </label>
            <textarea
              value={form.jd_text}
              onChange={(e) => update('jd_text', e.target.value)}
              rows={8}
              className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-sm text-white placeholder:text-white/25 outline-none focus:border-emerald-500/40 transition-all resize-none font-mono text-xs leading-relaxed"
              placeholder="Paste the full job description here…&#10;&#10;We are looking for a Software Engineer with 0-2 years of experience…&#10;Skills: Java, Python, SQL, Problem Solving…&#10;Eligibility: B.Tech CSE/IT, CGPA ≥ 6.5, 2025 batch"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-white/8 bg-white/2">
          <Button onClick={onClose} variant="outline" className="text-white/60 border-white/15 hover:bg-white/8">
            Cancel
          </Button>
          <Button
            onClick={analyseJD}
            disabled={step === 'parsing' || !form.jd_text.trim() || !form.company_name || !form.role_title}
            className="bg-emerald-500 hover:bg-emerald-400 text-white"
          >
            {step === 'parsing' ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Analysing JD…</>
            ) : (
              <><Sparkles className="mr-2 h-4 w-4" />Analyse & Create Drive</>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ─── Main Drives Page ───────────────────────────────────────────────────── */
export default function DrivesPage() {
  const [drives, setDrives] = useState<Drive[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    fetch('/api/tpo/drives')
      .then((r) => r.json())
      .then((d) => setDrives(d.drives ?? []))
      .finally(() => setLoading(false));
  }, []);

  function handleCreated(drive: Drive) {
    setDrives((prev) => [drive, ...prev]);
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Placement Drives</h1>
          <p className="mt-1 text-muted-foreground text-sm">
            Create drives from JDs — AI ranks eligible students automatically
          </p>
        </div>
        <Button onClick={() => setShowCreate(true)} className="bg-emerald-500 hover:bg-emerald-400 text-white" id="create-drive">
          <Plus className="mr-2 h-4 w-4" /> New Drive
        </Button>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Drives', value: drives.length, icon: Briefcase },
          { label: 'Active', value: drives.filter((d) => d.status === 'active').length, icon: Users },
          { label: 'Students Invited', value: drives.reduce((s, d) => s + Number(d.invited_count), 0), icon: CalendarDays },
        ].map(({ label, value, icon: Icon }) => (
          <Card key={label}>
            <CardContent className="p-5 flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                <Icon className="h-5 w-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="text-2xl font-bold text-foreground">{value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Drive list */}
      {loading ? (
        <div className="flex h-40 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : drives.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 gap-4">
            <div className="h-16 w-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
              <Briefcase className="h-8 w-8 text-emerald-400/50" />
            </div>
            <div className="text-center">
              <p className="font-semibold text-foreground">No drives yet</p>
              <p className="text-sm text-muted-foreground mt-1">Create your first drive by pasting a job description</p>
            </div>
            <Button onClick={() => setShowCreate(true)} className="bg-emerald-500 hover:bg-emerald-400 text-white">
              <Plus className="mr-2 h-4 w-4" /> Create First Drive
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {drives.map((drive) => {
            const parsed = drive.parsed_jd_json;
            const category = parsed?.role_category ?? 'other';
            return (
              <Link key={drive.id} href={`/admin/drives/${drive.id}`}>
                <Card className="hover:border-primary/30 transition-all cursor-pointer group">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      {/* Left */}
                      <div className="flex items-start gap-4 flex-1 min-w-0">
                        <div className="h-11 w-11 shrink-0 rounded-xl bg-blue-500/10 flex items-center justify-center">
                          <Building2 className="h-5 w-5 text-blue-400" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-semibold text-foreground">{drive.company_name}</h3>
                            <Badge className={`text-xs border ${STATUS_COLORS[drive.status]}`}>{drive.status}</Badge>
                            <Badge className="text-xs bg-blue-500/10 text-blue-400 border border-blue-500/20">
                              {ROLE_LABELS[category] ?? category}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-0.5">{drive.role_title}</p>
                          {parsed?.role_summary && (
                            <p className="text-xs text-muted-foreground/70 mt-1 line-clamp-1">{parsed.role_summary}</p>
                          )}
                          {/* Skills chips */}
                          {(parsed?.required_skills ?? []).slice(0, 5).length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {(parsed?.required_skills ?? []).slice(0, 5).map((s) => (
                                <span key={s} className="rounded-full bg-white/5 border border-white/8 px-2 py-0.5 text-[10px] text-white/50">{s}</span>
                              ))}
                              {(parsed?.required_skills?.length ?? 0) > 5 && (
                                <span className="text-[10px] text-white/30">+{(parsed?.required_skills?.length ?? 0) - 5}</span>
                              )}
                            </div>
                          )}
                          {/* Meta */}
                          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                            {drive.ctc && <span className="flex items-center gap-1"><IndianRupee className="h-3 w-3" />{drive.ctc}</span>}
                            {drive.location && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{drive.location}</span>}
                            {drive.drive_date && <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{new Date(drive.drive_date).toLocaleDateString('en-IN')}</span>}
                          </div>
                        </div>
                      </div>

                      {/* Right */}
                      <div className="shrink-0 flex items-center gap-6 text-center">
                        <div>
                          <p className="text-xl font-bold text-foreground">{drive.shortlist_count}</p>
                          <p className="text-xs text-muted-foreground">Shortlisted</p>
                        </div>
                        <div>
                          <p className="text-xl font-bold text-emerald-500">{drive.invited_count}</p>
                          <p className="text-xs text-muted-foreground">Invited</p>
                        </div>
                        <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}

      {showCreate && <CreateDriveModal onClose={() => setShowCreate(false)} onCreated={handleCreated} />}
    </div>
  );
}
