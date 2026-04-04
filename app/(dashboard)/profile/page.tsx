'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import {
  BRANCHES, SEMESTERS, CGPA_BANDS, TARGET_ROLES, SKILL_OPTIONS, HOURS_OPTIONS
} from '@/lib/constants';
import { Loader2, CheckCircle2, User, Target, Zap, Clock } from 'lucide-react';
import type { Profile, SkillEntry } from '@/types/database';

const STEPS = [
  { icon: User, label: 'Basic Info' },
  { icon: Target, label: 'Career Goal' },
  { icon: Zap, label: 'Skills' },
  { icon: Clock, label: 'Availability' },
];

export default function ProfilePage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [branch, setBranch] = useState('');
  const [semester, setSemester] = useState<number>(6);
  const [cgpaBand, setCgpaBand] = useState('');
  const [targetRole, setTargetRole] = useState('');
  const [customRole, setCustomRole] = useState('');
  const [skills, setSkills] = useState<SkillEntry[]>([]);
  const [hoursPerWeek, setHoursPerWeek] = useState(10);

  // Load existing profile
  useEffect(() => {
    fetch('/api/profile')
      .then((r) => r.json())
      .then(({ profile }: { profile: Profile }) => {
        if (!profile) return;
        setBranch(profile.branch ?? '');
        setSemester(profile.semester ?? 6);
        setCgpaBand(profile.cgpa_band ?? '');
        setTargetRole(profile.target_role ?? '');
        setSkills(profile.skills_json ?? []);
        setHoursPerWeek(profile.hours_per_week ?? 10);
      })
      .catch(() => {});
  }, []);

  function toggleSkill(name: string) {
    setSkills((prev) => {
      const exists = prev.find((s) => s.name === name);
      if (exists) return prev.filter((s) => s.name !== name);
      return [...prev, { name, level: 3 }];
    });
  }

  function updateSkillLevel(name: string, level: number) {
    setSkills((prev) => prev.map((s) => (s.name === name ? { ...s, level } : s)));
  }

  async function handleSave() {
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          branch, semester, cgpa_band: cgpaBand,
          target_role: targetRole === 'Other' ? customRole : targetRole,
          skills_json: skills, hours_per_week: hoursPerWeek,
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      router.push('/dashboard');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  }

  const canProceed = [
    branch && semester && cgpaBand,
    targetRole,
    skills.length >= 2,
    true,
  ][step];

  return (
    <div className="mx-auto max-w-2xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Complete Your Profile</h1>
        <p className="mt-1 text-muted-foreground">
          Help us personalise your placement preparation journey
        </p>
      </div>

      {/* Steps indicator */}
      <div className="mb-8 flex items-center gap-0">
        {STEPS.map((s, i) => {
          const Icon = s.icon;
          const done = i < step;
          const active = i === step;
          return (
            <div key={i} className="flex flex-1 items-center">
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 text-sm font-semibold transition-all ${
                  done
                    ? 'border-primary bg-primary text-primary-foreground'
                    : active
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border bg-muted text-muted-foreground'
                }`}
              >
                {done ? <CheckCircle2 className="h-5 w-5" /> : <Icon className="h-4 w-4" />}
              </div>
              <span className={`ml-2 hidden text-xs font-medium sm:block ${active ? 'text-foreground' : 'text-muted-foreground'}`}>
                {s.label}
              </span>
              {i < STEPS.length - 1 && (
                <div className={`ml-2 flex-1 h-px transition-all ${i < step ? 'bg-primary' : 'bg-border'}`} />
              )}
            </div>
          );
        })}
      </div>

      {/* Card */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        {/* Step 0 – Basic Info */}
        {step === 0 && (
          <div className="animate-fade-in space-y-5">
            <h2 className="text-lg font-semibold text-foreground">Basic Information</h2>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="branch">Branch / Department</Label>
                <select
                  id="branch"
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                  className="w-full rounded-lg border border-border bg-input px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">Select branch</option>
                  {BRANCHES.map((b) => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="semester">Current Semester</Label>
                <select
                  id="semester"
                  value={semester}
                  onChange={(e) => setSemester(Number(e.target.value))}
                  className="w-full rounded-lg border border-border bg-input px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  {SEMESTERS.map((s) => <option key={s} value={s}>Semester {s}</option>)}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>CGPA Band</Label>
              <div className="flex flex-wrap gap-2">
                {CGPA_BANDS.map((band) => (
                  <button
                    key={band}
                    type="button"
                    onClick={() => setCgpaBand(band)}
                    className={`rounded-lg border px-4 py-2 text-sm font-medium transition-all ${
                      cgpaBand === band
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border bg-muted text-muted-foreground hover:border-primary/50'
                    }`}
                  >
                    {band}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 1 – Target Role */}
        {step === 1 && (
          <div className="animate-fade-in space-y-5">
            <h2 className="text-lg font-semibold text-foreground">Career Goal</h2>
            <p className="text-sm text-muted-foreground">What role are you targeting for placements?</p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {TARGET_ROLES.map((role) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => setTargetRole(role)}
                  className={`rounded-xl border px-4 py-3 text-left text-sm font-medium transition-all ${
                    targetRole === role
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border bg-muted text-foreground hover:border-primary/30'
                  }`}
                >
                  {role}
                </button>
              ))}
            </div>
            {targetRole === 'Other' && (
              <Input
                placeholder="Type your target role"
                value={customRole}
                onChange={(e) => setCustomRole(e.target.value)}
                className="mt-2"
              />
            )}
          </div>
        )}

        {/* Step 2 – Skills */}
        {step === 2 && (
          <div className="animate-fade-in space-y-5">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Your Skills</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Select your skills and rate your proficiency (1 = beginner, 5 = expert)
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {SKILL_OPTIONS.map((skill) => {
                const entry = skills.find((s) => s.name === skill);
                return (
                  <button
                    key={skill}
                    type="button"
                    onClick={() => toggleSkill(skill)}
                    className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-all ${
                      entry
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border bg-muted text-muted-foreground hover:border-primary/40'
                    }`}
                  >
                    {skill}
                    {entry && <span className="ml-1 text-xs opacity-70">({entry.level})</span>}
                  </button>
                );
              })}
            </div>

            {/* Level sliders for selected skills */}
            {skills.length > 0 && (
              <div className="space-y-4 rounded-xl border border-border bg-muted/30 p-4">
                <p className="text-sm font-medium text-foreground">Rate your level:</p>
                {skills.map((skill) => (
                  <div key={skill.name} className="flex items-center gap-4">
                    <span className="w-40 shrink-0 truncate text-sm text-foreground">{skill.name}</span>
                    <Slider
                      min={1} max={5} step={1}
                      value={[skill.level]}
                      onValueChange={(v) => updateSkillLevel(skill.name, v[0])}
                      className="flex-1"
                    />
                    <span className="w-6 text-center text-sm font-semibold text-primary">{skill.level}</span>
                  </div>
                ))}
              </div>
            )}

            {skills.length < 2 && (
              <p className="text-sm text-amber-500">Please select at least 2 skills</p>
            )}
          </div>
        )}

        {/* Step 3 – Availability */}
        {step === 3 && (
          <div className="animate-fade-in space-y-6">
            <h2 className="text-lg font-semibold text-foreground">Study Availability</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Hours available per week</Label>
                <span className="text-2xl font-bold text-primary">{hoursPerWeek}h</span>
              </div>
              <Slider
                id="hours-slider"
                min={5} max={40} step={5}
                value={[hoursPerWeek]}
                onValueChange={([v]) => setHoursPerWeek(v)}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>5h (casual)</span>
                <span>20h (balanced)</span>
                <span>40h (intense)</span>
              </div>
            </div>

            {/* Profile summary */}
            <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-2">
              <p className="text-sm font-semibold text-foreground">Profile Summary</p>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <span className="text-muted-foreground">Branch:</span>
                <span className="font-medium">{branch}</span>
                <span className="text-muted-foreground">Semester:</span>
                <span className="font-medium">{semester}</span>
                <span className="text-muted-foreground">CGPA:</span>
                <span className="font-medium">{cgpaBand}</span>
                <span className="text-muted-foreground">Target:</span>
                <span className="font-medium">{targetRole === 'Other' ? customRole : targetRole}</span>
              </div>
              <div className="flex flex-wrap gap-1 mt-2">
                {skills.map((s) => <Badge key={s.name} variant="secondary">{s.name}</Badge>)}
              </div>
            </div>

            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-900 dark:bg-red-950 dark:text-red-400">
                {error}
              </div>
            )}
          </div>
        )}

        {/* Navigation */}
        <div className="mt-8 flex items-center justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={() => setStep(Math.max(0, step - 1))}
            disabled={step === 0}
            className="w-28"
            id="profile-prev"
          >
            ← Back
          </Button>

          {step < STEPS.length - 1 ? (
            <Button
              type="button"
              onClick={() => setStep(step + 1)}
              disabled={!canProceed}
              className="w-28 bg-primary text-primary-foreground hover:bg-primary/90"
              id="profile-next"
            >
              Continue →
            </Button>
          ) : (
            <Button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="w-36 bg-primary text-primary-foreground hover:bg-primary/90"
              id="profile-save"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : '✓ Save Profile'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
