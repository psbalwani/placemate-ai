'use client';

import { useState, useEffect, use } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Loader2, ArrowLeft, Users, Zap, Download, Building2,
  CheckCircle2, XCircle, Clock, Star,
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
  parsed_jd_json: ParsedJd;
  eligibility_json: { branches?: string[]; min_cgpa_band?: string; batch_year?: string };
  jd_text: string;
}

interface ShortlistEntry {
  id: string;
  student_user_id: string;
  drive_score: number;
  reasons_json: string[];
  status: string;
  full_name: string;
  email: string;
  branch: string;
  cgpa_band: string;
  semester: string;
  target_role: string | null;
}

const STATUS_OPTIONS = ['pending', 'invited', 'rejected', 'waitlist'];
const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-white/5 text-white/40 border-white/10',
  invited: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25',
  rejected: 'bg-red-500/10 text-red-400 border-red-500/20',
  waitlist: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
};
const STATUS_ICONS: Record<string, React.ReactNode> = {
  invited: <CheckCircle2 className="h-3 w-3" />,
  rejected: <XCircle className="h-3 w-3" />,
  waitlist: <Clock className="h-3 w-3" />,
  pending: <Clock className="h-3 w-3 opacity-30" />,
};

function ScoreBadge({ score }: { score: number }) {
  const color = score >= 70 ? 'text-emerald-400' : score >= 50 ? 'text-amber-400' : 'text-red-400';
  return <span className={`font-bold text-sm ${color}`}>{score}</span>;
}

function exportCSV(entries: ShortlistEntry[], driveName: string) {
  const rows = [
    ['Rank', 'Name', 'Email', 'Branch', 'CGPA Band', 'Drive Score', 'Status', 'Reasons'],
    ...entries.map((e, i) => [
      i + 1, e.full_name, e.email, e.branch, e.cgpa_band, e.drive_score, e.status,
      e.reasons_json.join('; '),
    ]),
  ];
  const csv = rows.map((r) => r.map(String).map((v) => `"${v}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
  a.download = `shortlist-${driveName.toLowerCase().replace(/\s+/g, '-')}.csv`; a.click();
}

export default function DriveDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [drive, setDrive] = useState<Drive | null>(null);
  const [shortlist, setShortlist] = useState<ShortlistEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      fetch(`/api/tpo/drives/${id}`).then((r) => r.json()),
      fetch(`/api/tpo/drives/${id}/shortlist`).then((r) => r.json()),
    ]).then(([driveData, listData]) => {
      setDrive(driveData.drive);
      setShortlist(listData.shortlist ?? []);
    }).catch(() => setError('Failed to load drive')).finally(() => setLoading(false));
  }, [id]);

  async function generateShortlist() {
    setGenerating(true); setError('');
    try {
      const res = await fetch(`/api/tpo/drives/${id}/shortlist`, { method: 'POST' });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      setShortlist(data.shortlist ?? []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to generate shortlist');
    } finally { setGenerating(false); }
  }

  async function updateStatus(studentUserId: string, status: string) {
    setUpdatingId(studentUserId);
    try {
      await fetch(`/api/tpo/drives/${id}/shortlist`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ student_user_id: studentUserId, status }),
      });
      setShortlist((prev) => prev.map((e) => e.student_user_id === studentUserId ? { ...e, status } : e));
    } finally { setUpdatingId(null); }
  }

  if (loading) return <div className="flex h-64 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (!drive) return <div className="text-center py-16 text-muted-foreground">Drive not found</div>;

  const parsed = drive.parsed_jd_json;
  const invited = shortlist.filter((e) => e.status === 'invited').length;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Back + header */}
      <div>
        <Link href="/admin/drives" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back to Drives
        </Link>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
              <Building2 className="h-6 w-6 text-blue-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-foreground">{drive.company_name}</h1>
                <Badge className={`border text-xs capitalize ${
                  drive.status === 'active' ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25' :
                  drive.status === 'closed' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                  'bg-white/5 text-white/40 border-white/10'
                }`}>{drive.status}</Badge>
              </div>
              <p className="text-muted-foreground">{drive.role_title}</p>
              {drive.ctc && <p className="text-xs text-muted-foreground mt-0.5">CTC: {drive.ctc}{drive.location && ` · ${drive.location}`}</p>}
            </div>
          </div>
          <div className="flex gap-2">
            {shortlist.length > 0 && (
              <Button variant="outline" onClick={() => exportCSV(shortlist, drive.company_name)} className="text-white/70 border-white/15 hover:bg-white/8">
                <Download className="mr-2 h-4 w-4" /> Export CSV
              </Button>
            )}
            <Button onClick={generateShortlist} disabled={generating} className="bg-emerald-500 hover:bg-emerald-400 text-white" id="generate-shortlist">
              {generating ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Running…</> : <><Zap className="mr-2 h-4 w-4" />{shortlist.length ? 'Re-run Shortlist' : 'Generate Shortlist'}</>}
            </Button>
          </div>
        </div>
      </div>

      {error && <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT: JD details */}
        <div className="space-y-4">
          {/* Role summary */}
          {parsed?.role_summary && (
            <Card>
              <CardHeader className="pb-2"><h3 className="font-semibold text-foreground text-sm">Role Summary</h3></CardHeader>
              <CardContent><p className="text-sm text-muted-foreground">{parsed.role_summary}</p></CardContent>
            </Card>
          )}

          {/* Required skills */}
          {(parsed?.required_skills ?? []).length > 0 && (
            <Card>
              <CardHeader className="pb-2"><h3 className="font-semibold text-foreground text-sm">Required Skills</h3></CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-1.5">
                  {(parsed?.required_skills ?? []).map((s) => (
                    <span key={s} className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 text-xs text-emerald-400">{s}</span>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Nice to have */}
          {(parsed?.preferred_skills ?? []).length > 0 && (
            <Card>
              <CardHeader className="pb-2"><h3 className="font-semibold text-foreground text-sm">Preferred Skills</h3></CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-1.5">
                  {(parsed?.preferred_skills ?? []).map((s) => (
                    <span key={s} className="rounded-full bg-white/5 border border-white/10 px-2.5 py-0.5 text-xs text-white/50">{s}</span>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Eligibility */}
          <Card>
            <CardHeader className="pb-2"><h3 className="font-semibold text-foreground text-sm">Eligibility Config</h3></CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p><span className="font-medium text-foreground">Branches:</span> {(drive.eligibility_json?.branches ?? []).join(', ') || 'All'}</p>
              <p><span className="font-medium text-foreground">Min CGPA:</span> {drive.eligibility_json?.min_cgpa_band ?? '6.0'}</p>
              {drive.eligibility_json?.batch_year && <p><span className="font-medium text-foreground">Batch:</span> {drive.eligibility_json.batch_year}</p>}
            </CardContent>
          </Card>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Shortlisted', value: shortlist.length, color: 'text-foreground' },
              { label: 'Invited', value: invited, color: 'text-emerald-400' },
              { label: 'Waitlisted', value: shortlist.filter((e) => e.status === 'waitlist').length, color: 'text-amber-400' },
              { label: 'Rejected', value: shortlist.filter((e) => e.status === 'rejected').length, color: 'text-red-400' },
            ].map(({ label, value, color }) => (
              <Card key={label}>
                <CardContent className="p-3 text-center">
                  <p className={`text-xl font-bold ${color}`}>{value}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* RIGHT: Shortlist table */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="pb-3 flex-row items-center justify-between">
              <div>
                <h3 className="font-semibold text-foreground flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" /> Ranked Shortlist
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">Sorted by drive score — update status per student</p>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {shortlist.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 gap-3">
                  <Users className="h-10 w-10 text-muted-foreground/30" />
                  <p className="text-sm text-muted-foreground">No shortlist yet — click Generate Shortlist</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="px-4 py-2.5 text-left text-xs text-muted-foreground font-medium">#</th>
                        <th className="px-4 py-2.5 text-left text-xs text-muted-foreground font-medium">Student</th>
                        <th className="px-4 py-2.5 text-left text-xs text-muted-foreground font-medium">Branch</th>
                        <th className="px-4 py-2.5 text-center text-xs text-muted-foreground font-medium">
                          <Star className="h-3 w-3 inline mr-0.5" />Score
                        </th>
                        <th className="px-4 py-2.5 text-left text-xs text-muted-foreground font-medium">Why</th>
                        <th className="px-4 py-2.5 text-left text-xs text-muted-foreground font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {shortlist.map((entry, i) => (
                        <tr key={entry.id} className="border-b border-border/50 last:border-0 hover:bg-muted/30 transition-colors">
                          <td className="px-4 py-3 text-muted-foreground text-xs">{i + 1}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                                {entry.full_name?.[0]?.toUpperCase()}
                              </div>
                              <div>
                                <p className="font-medium text-foreground truncate max-w-28">{entry.full_name}</p>
                                <p className="text-xs text-muted-foreground truncate max-w-28">{entry.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-xs text-muted-foreground">{entry.branch}</span>
                            <br /><span className="text-[10px] text-muted-foreground/60">{entry.cgpa_band}</span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <ScoreBadge score={entry.drive_score} />
                          </td>
                          <td className="px-4 py-3 max-w-xs">
                            <ul className="space-y-0.5">
                              {entry.reasons_json.map((r, ri) => (
                                <li key={ri} className="text-xs text-muted-foreground line-clamp-1">• {r}</li>
                              ))}
                            </ul>
                          </td>
                          <td className="px-4 py-3">
                            {updatingId === entry.student_user_id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <select
                                value={entry.status}
                                onChange={(e) => void updateStatus(entry.student_user_id, e.target.value)}
                                className={`text-xs rounded-lg border px-2 py-1 outline-none cursor-pointer transition-all ${STATUS_STYLES[entry.status]}`}
                                style={{ background: 'transparent' }}
                              >
                                {STATUS_OPTIONS.map((s) => (
                                  <option key={s} value={s} style={{ background: '#0d1120', color: 'white' }}>{s}</option>
                                ))}
                              </select>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
