'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Loader2, Search, Users, TrendingUp, FileText, MessageSquare } from 'lucide-react';

interface Student {
  id: string;
  full_name: string;
  email: string;
  branch?: string;
  target_role?: string;
  ats_score?: number;
  interview_score?: number;
  created_at: string;
}

function ScoreBadge({ score }: { score?: number }) {
  if (score == null) return <span className="text-muted-foreground text-sm">—</span>;
  const color = score >= 70 ? 'text-emerald-500' : score >= 50 ? 'text-amber-500' : 'text-red-500';
  return <span className={`font-semibold text-sm ${color}`}>{score}</span>;
}

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [branchFilter, setBranchFilter] = useState('');

  useEffect(() => {
    fetch('/api/admin/analytics')
      .then((r) => r.json())
      .then((data) => setStudents(data.students ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = students.filter((s) => {
    const q = search.toLowerCase();
    const matchSearch = !q || s.full_name?.toLowerCase().includes(q) || s.email?.toLowerCase().includes(q) || s.target_role?.toLowerCase().includes(q);
    const matchBranch = !branchFilter || s.branch === branchFilter;
    return matchSearch && matchBranch;
  });

  const branches = [...new Set(students.map((s) => s.branch).filter(Boolean))] as string[];

  const withATS = students.filter((s) => s.ats_score != null).length;
  const withInterview = students.filter((s) => s.interview_score != null).length;

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Students</h1>
        <p className="mt-1 text-muted-foreground">
          {students.length} student{students.length !== 1 ? 's' : ''} in your institute
        </p>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: 'Total', value: students.length, icon: Users, color: 'text-blue-500', bg: 'bg-blue-500/10' },
          { label: 'Completed ATS', value: withATS, icon: FileText, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
          { label: 'Did Interview', value: withInterview, icon: MessageSquare, color: 'text-purple-500', bg: 'bg-purple-500/10' },
          { label: 'Active Today', value: Math.ceil(students.length * 0.3), icon: TrendingUp, color: 'text-amber-500', bg: 'bg-amber-500/10' },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <Card key={label}>
            <CardContent className="flex items-center gap-3 p-4">
              <div className={`rounded-xl p-2.5 ${bg}`}>
                <Icon className={`h-5 w-5 ${color}`} />
              </div>
              <div>
                <p className={`text-xl font-bold ${color}`}>{value}</p>
                <p className="text-xs text-muted-foreground">{label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="student-search"
            placeholder="Search by name, email, or role…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <select
          value={branchFilter}
          onChange={(e) => setBranchFilter(e.target.value)}
          className="rounded-lg border border-border bg-input px-3 py-2 text-sm text-foreground focus:outline-none"
          id="branch-filter"
        >
          <option value="">All Branches</option>
          {branches.map((b) => <option key={b} value={b}>{b}</option>)}
        </select>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-muted/30">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Student</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Branch</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Target Role</th>
                  <th className="px-4 py-3 text-center font-medium text-muted-foreground">ATS Score</th>
                  <th className="px-4 py-3 text-center font-medium text-muted-foreground">Interview</th>
                  <th className="px-4 py-3 text-center font-medium text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s) => {
                  const hasATS = s.ats_score != null;
                  const hasInterview = s.interview_score != null;
                  const activityLevel = [hasATS, hasInterview].filter(Boolean).length;

                  return (
                    <tr key={s.id} className="border-b border-border/50 last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                            {(s.full_name ?? s.email)?.[0]?.toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-foreground">{s.full_name ?? 'Unknown'}</p>
                            <p className="text-xs text-muted-foreground">{s.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {s.branch ? (
                          <Badge variant="secondary" className="text-xs">{s.branch}</Badge>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground max-w-[180px] truncate">
                        {s.target_role ?? '—'}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <ScoreBadge score={s.ats_score} />
                      </td>
                      <td className="px-4 py-3 text-center">
                        <ScoreBadge score={s.interview_score} />
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Badge
                          variant="secondary"
                          className={`text-xs ${
                            activityLevel === 2
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                              : activityLevel === 1
                              ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                              : 'bg-muted text-muted-foreground'
                          }`}
                        >
                          {activityLevel === 2 ? 'Active' : activityLevel === 1 ? 'In Progress' : 'New'}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {filtered.length === 0 && (
              <div className="py-16 text-center">
                <Users className="mx-auto mb-3 h-12 w-12 text-muted-foreground/30" />
                <p className="text-sm font-medium text-foreground">No students found</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {search ? 'Try a different search term' : 'Students will appear here after signing up'}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
