'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Sparkles, Eye, EyeOff, CheckCircle2 } from 'lucide-react';

const INSTITUTE_OPTIONS = [
  'CHARUSAT University',
  'VIT Vellore',
  'SRMIST Chennai',
  'Amrita Vishwa Vidyapeetham',
  'Kalasalingam University',
  'KCG College of Technology',
  'Jerusalem College of Engineering',
  'Saveetha Engineering College',
  'Vel Tech University',
  'Other',
];

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [institute, setInstitute] = useState('');
  const [role, setRole] = useState<'student' | 'tpo'>('student');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Step 1: Register via our API
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, full_name: fullName, role, institute_name: institute }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Registration failed');
        setLoading(false);
        return;
      }

      // Step 2: Auto sign in after registration
      const result = await signIn('credentials', { email, password, redirect: false });
      if (result?.error) {
        setSuccess(true); // Show success — user can log in manually
      } else {
        router.push('/profile'); // Go to onboarding
        router.refresh();
      }
    } catch {
      setError('Something went wrong. Please try again.');
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="animate-fade-in rounded-2xl border border-white/10 bg-white/5 p-10 text-center backdrop-blur-sm">
        <CheckCircle2 className="mx-auto mb-4 h-14 w-14 text-emerald-400" />
        <h2 className="text-xl font-bold text-white">Account created!</h2>
        <p className="mt-2 text-sm text-slate-400">
          You can now sign in with <span className="text-white">{email}</span>.
        </p>
        <Link
          href="/login"
          className="mt-6 inline-block rounded-xl bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500"
        >
          Sign in →
        </Link>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="mb-8 flex flex-col items-center gap-3">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/20 ring-1 ring-emerald-500/40">
          <Sparkles className="h-7 w-7 text-emerald-400" />
        </div>
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white">Create your account</h1>
          <p className="mt-1 text-sm text-slate-400">Join students getting placement-ready</p>
        </div>
      </div>

      {/* Step indicator */}
      <div className="mb-6 flex items-center justify-center gap-2">
        {[1, 2].map((s) => (
          <div
            key={s}
            className={`h-2 rounded-full transition-all ${s === step ? 'w-8 bg-emerald-500' : step > s ? 'w-4 bg-emerald-700' : 'w-4 bg-white/10'}`}
          />
        ))}
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-sm">
        <form onSubmit={step === 1 ? (e) => { e.preventDefault(); setStep(2); } : handleRegister} className="space-y-5">
          {step === 1 ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-slate-300">Full Name</Label>
                <Input
                  id="fullName"
                  placeholder="Rahul Sharma"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  className="border-white/10 bg-white/5 text-white placeholder:text-slate-500 focus:border-emerald-500/50"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="reg-email" className="text-slate-300">College Email</Label>
                <Input
                  id="reg-email"
                  type="email"
                  placeholder="you@college.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="border-white/10 bg-white/5 text-white placeholder:text-slate-500 focus:border-emerald-500/50"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-slate-300">I am a…</Label>
                <div className="grid grid-cols-2 gap-3">
                  {(['student', 'tpo'] as const).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setRole(r)}
                      className={`rounded-xl border px-4 py-3 text-sm font-medium capitalize transition-all ${
                        role === r
                          ? 'border-emerald-500/60 bg-emerald-500/20 text-emerald-300'
                          : 'border-white/10 bg-white/5 text-slate-400 hover:border-white/20'
                      }`}
                    >
                      {r === 'tpo' ? 'TPO / Faculty' : 'Student'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="institute" className="text-slate-300">Institute</Label>
                <select
                  id="institute"
                  value={institute}
                  onChange={(e) => setInstitute(e.target.value)}
                  required
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-emerald-500/50 focus:outline-none"
                >
                  <option value="" className="bg-slate-900">Select your institute</option>
                  {INSTITUTE_OPTIONS.map((opt) => (
                    <option key={opt} value={opt} className="bg-slate-900">{opt}</option>
                  ))}
                </select>
              </div>

              <Button type="submit" className="w-full bg-emerald-600 text-white hover:bg-emerald-500" id="reg-next">
                Continue →
              </Button>
            </>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="reg-password" className="text-slate-300">Create Password</Label>
                <div className="relative">
                  <Input
                    id="reg-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Min. 8 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    minLength={8}
                    required
                    className="border-white/10 bg-white/5 pr-10 text-white placeholder:text-slate-500 focus:border-emerald-500/50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Password strength */}
              <div className="flex gap-1.5">
                {[8, 12, 16].map((len) => (
                  <div
                    key={len}
                    className={`h-1 flex-1 rounded-full transition-all ${password.length >= len ? 'bg-emerald-500' : 'bg-white/10'}`}
                  />
                ))}
              </div>

              {error && (
                <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                  {error}
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep(1)}
                  className="flex-1 border-white/10 bg-transparent text-slate-300 hover:bg-white/5"
                  id="reg-back"
                >
                  ← Back
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-emerald-600 text-white hover:bg-emerald-500"
                  id="reg-submit"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create Account'}
                </Button>
              </div>
            </>
          )}
        </form>

        <p className="mt-6 text-center text-sm text-slate-400">
          Already have an account?{' '}
          <Link href="/login" className="font-medium text-emerald-400 hover:text-emerald-300">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
