import type { Metadata } from 'next';
import Link from 'next/link';
import { Sparkles, Map, FileText, MessageSquare, BarChart3, ArrowRight, CheckCircle2, Star, Zap, Shield, Users } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Placemate AI – Your AI-Powered Campus Placement Co-Pilot',
  description: 'AI-personalised roadmaps, ATS resume analysis, mock interviews and TPO analytics for engineering college placements. Built for tier-2/3 colleges in India.',
};

const FEATURES = [
  {
    icon: Map,
    title: 'AI Career Roadmap',
    description: 'Get a personalised week-by-week study plan tailored to your branch, CGPA, skills and target role.',
    color: 'from-blue-500 to-cyan-500',
    badge: 'Most Popular',
  },
  {
    icon: FileText,
    title: 'Resume ATS Analyzer',
    description: 'Upload your resume and get an instant ATS score, specific weaknesses, and an AI-rewritten optimised version.',
    color: 'from-emerald-500 to-teal-500',
    badge: 'Instant Results',
  },
  {
    icon: MessageSquare,
    title: 'Mock Interviews',
    description: 'Practice with an AI interviewer that gives per-question scores and a final strengths/weaknesses report.',
    color: 'from-purple-500 to-violet-500',
    badge: 'Voice Enabled',
  },
  {
    icon: BarChart3,
    title: 'TPO Analytics Dashboard',
    description: 'Cohort-level weakness heatmaps, student progress tracking, and AI-generated 4-week training programs.',
    color: 'from-amber-500 to-orange-500',
    badge: 'For TPOs',
  },
];

const STATS = [
  { value: '10K+', label: 'Students Helped' },
  { value: '92%', label: 'ATS Score Improvement' },
  { value: '3×', label: 'More Interview Calls' },
  { value: '50+', label: 'Colleges Onboarded' },
];

const TESTIMONIALS = [
  {
    name: 'Priya Menon',
    role: 'SDE at Infosys',
    college: 'KCG College of Technology',
    text: 'PlaceMate AI gave me a detailed roadmap that took me from 5 LeetCode problems to cracking the Infosys placement. The ATS analyser raised my score from 38 to 82!',
    rating: 5,
  },
  {
    name: 'Rohan Sharma',
    role: 'Data Analyst at TCS',
    college: 'Jerusalem College of Engineering',
    text: 'The mock interview practice was a game changer. After 3 sessions I felt confident enough to walk into the real thing. Got placed in my first attempt!',
    rating: 5,
  },
  {
    name: 'Dr. Kavitha Nair',
    role: 'TPO',
    college: 'Saveetha Engineering College',
    text: "The TPO dashboard's skill-gap heatmap showed us exactly where our batch needed help. The AI training plan saved us weeks of manual planning.",
    rating: 5,
  },
];

const HOW_IT_WORKS = [
  { step: '01', title: 'Create Your Profile', desc: 'Tell us your branch, CGPA, skills and target role in 2 minutes.' },
  { step: '02', title: 'Get Your AI Roadmap', desc: 'Receive a personalised week-by-week plan prioritised for your weak areas.' },
  { step: '03', title: 'Practice & Improve', desc: 'Analyse your resume, take mock interviews, and track your readiness score.' },
  { step: '04', title: 'Land Your Dream Job', desc: 'Walk into placements confident, prepared, and ready to impress.' },
];

const HERO_PARTICLES = Array.from({ length: 20 }, (_, i) => ({
  left: (i * 37) % 100,
  top: (i * 53) % 100,
  delay: ((i * 17) % 30) / 10,
}));

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[oklch(0.1_0.015_260)] text-white overflow-hidden">
      {/* ─── Navigation ──────────────────────────────────────── */}
      <nav className="fixed top-0 z-50 w-full border-b border-white/5 bg-[oklch(0.1_0.015_260)]/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/20 ring-1 ring-emerald-500/30">
              <Sparkles className="h-4 w-4 text-emerald-400" />
            </div>
            <span className="text-base font-bold text-white">Placemate AI</span>
          </div>
          <div className="hidden items-center gap-6 text-sm text-slate-400 sm:flex">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-white transition-colors">How It Works</a>
            <a href="#testimonials" className="hover:text-white transition-colors">Stories</a>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="hidden text-sm text-slate-400 hover:text-white transition-colors sm:block"
            >
              Sign in
            </Link>
            <Link
              href="/register"
              id="hero-cta-nav"
              className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500 transition-colors"
            >
              Get Started Free
            </Link>
          </div>
        </div>
      </nav>

      {/* ─── Hero ────────────────────────────────────────────── */}
      <section className="relative flex min-h-screen flex-col items-center justify-center px-6 pt-24 pb-16 text-center">
        {/* Background glows */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute left-1/2 top-1/3 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-500/8 blur-[120px]" />
          <div className="absolute right-1/4 bottom-1/4 h-[400px] w-[400px] rounded-full bg-teal-500/6 blur-[100px]" />
          <div className="absolute left-1/4 bottom-1/3 h-[300px] w-[300px] rounded-full bg-blue-500/5 blur-[80px]" />
        </div>

        {/* Orbiting dots */}
        <div className="pointer-events-none absolute inset-0">
          {HERO_PARTICLES.map((p, i) => (
            <div
              key={i}
              className="absolute h-1 w-1 rounded-full bg-white/20"
              style={{
                left: `${p.left}%`,
                top: `${p.top}%`,
                animationDelay: `${p.delay}s`,
              }}
            />
          ))}
        </div>

        <div className="relative max-w-4xl animate-fade-in">
          {/* Badge */}
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-1.5 text-xs font-medium text-emerald-400">
            <Zap className="h-3 w-3" />
            Powered by Groq AI · Built for Indian Engineering Colleges
          </div>

          {/* Headline */}
          <h1 className="text-4xl font-black leading-tight tracking-tight text-white sm:text-5xl lg:text-7xl">
            Your AI Co-Pilot for{' '}
            <span className="bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent">
              Campus Placements
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-slate-400">
            Personalised study roadmaps, ATS resume analysis, mock interviews, and cohort analytics—
            purpose-built for tier-2/3 engineering colleges in India.
          </p>

          {/* CTAs */}
          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/register"
              id="hero-cta-primary"
              className="group flex items-center gap-2 rounded-2xl bg-emerald-600 px-8 py-4 text-base font-semibold text-white shadow-lg shadow-emerald-500/20 hover:bg-emerald-500 transition-all hover:shadow-emerald-500/30 hover:scale-105"
            >
              Start for Free
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              href="/login"
              id="hero-cta-secondary"
              className="rounded-2xl border border-white/10 px-8 py-4 text-base font-medium text-slate-300 hover:bg-white/5 hover:border-white/20 transition-all"
            >
              Sign In →
            </Link>
          </div>

          {/* Social proof */}
          <div className="mt-10 flex items-center justify-center gap-6 text-sm text-slate-500">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              No credit card required
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              Free tier available
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              Setup in 2 minutes
            </div>
          </div>
        </div>

        {/* Stats band */}
        <div className="relative mt-20 w-full max-w-4xl">
          <div className="rounded-2xl border border-white/8 bg-white/3 px-8 py-6 backdrop-blur-sm">
            <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
              {STATS.map(({ value, label }) => (
                <div key={label} className="text-center">
                  <p className="text-2xl font-black text-white sm:text-3xl">{value}</p>
                  <p className="mt-1 text-xs text-slate-500">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── Features ────────────────────────────────────────── */}
      <section id="features" className="relative py-24 px-6">
        <div className="mx-auto max-w-7xl">
          <div className="mb-16 text-center">
            <h2 className="text-3xl font-black text-white sm:text-4xl">
              Everything You Need to{' '}
              <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
                Crack Placements
              </span>
            </h2>
            <p className="mt-4 text-slate-400">
              Four powerful AI tools that work together to maximise your placement chances
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map(({ icon: Icon, title, description, color, badge }) => (
              <div
                key={title}
                className="group relative overflow-hidden rounded-2xl border border-white/8 bg-white/3 p-6 transition-all hover:border-white/15 hover:bg-white/6 hover:-translate-y-1"
              >
                {/* Gradient orb */}
                <div className={`absolute -right-8 -top-8 h-28 w-28 rounded-full bg-gradient-to-br ${color} opacity-10 blur-2xl transition-opacity group-hover:opacity-20`} />

                <div className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${color} p-0.5`}>
                  <div className="flex h-full w-full items-center justify-center rounded-[10px] bg-[oklch(0.1_0.015_260)]">
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                </div>

                <div className="mb-2 flex items-start justify-between gap-2">
                  <h3 className="text-base font-bold text-white">{title}</h3>
                  <span className="shrink-0 rounded-full border border-white/10 px-2 py-0.5 text-xs text-slate-400">
                    {badge}
                  </span>
                </div>
                <p className="text-sm leading-relaxed text-slate-400">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── How It Works ────────────────────────────────────── */}
      <section id="how-it-works" className="py-24 px-6">
        <div className="mx-auto max-w-4xl">
          <div className="mb-16 text-center">
            <h2 className="text-3xl font-black text-white sm:text-4xl">
              From Zero to Placed in{' '}
              <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
                4 Simple Steps
              </span>
            </h2>
          </div>

          <div className="relative space-y-8">
            {/* Connect line */}
            <div className="absolute left-6 top-8 h-[calc(100%-4rem)] w-px bg-gradient-to-b from-emerald-500/50 via-teal-500/30 to-transparent sm:left-8" />

            {HOW_IT_WORKS.map(({ step, title, desc }) => (
              <div key={step} className="relative flex items-start gap-6 pl-2 sm:pl-4">
                <div className="relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-emerald-500/30 bg-emerald-500/10 text-sm font-black text-emerald-400">
                  {step}
                </div>
                <div className="pb-4 pt-2">
                  <h3 className="text-lg font-bold text-white">{title}</h3>
                  <p className="mt-1 text-sm text-slate-400">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Testimonials ────────────────────────────────────── */}
      <section id="testimonials" className="py-24 px-6">
        <div className="mx-auto max-w-6xl">
          <div className="mb-16 text-center">
            <h2 className="text-3xl font-black text-white sm:text-4xl">
              Trusted by Students &amp;{' '}
              <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
                TPOs Across India
              </span>
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            {TESTIMONIALS.map(({ name, role, college, text, rating }) => (
              <div
                key={name}
                className="rounded-2xl border border-white/8 bg-white/3 p-6 transition-all hover:border-white/15"
              >
                <div className="mb-4 flex gap-0.5">
                  {Array.from({ length: rating }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-sm leading-relaxed text-slate-300 italic">&ldquo;{text}&rdquo;</p>
                <div className="mt-5 flex items-center gap-3 border-t border-white/8 pt-5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/20 text-sm font-bold text-emerald-400">
                    {name[0]}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{name}</p>
                    <p className="text-xs text-slate-500">{role} · {college}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA ─────────────────────────────────────────────── */}
      <section className="py-24 px-6">
        <div className="mx-auto max-w-3xl text-center">
          <div className="relative overflow-hidden rounded-3xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-transparent p-12">
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute -left-20 -top-20 h-60 w-60 rounded-full bg-emerald-500/10 blur-3xl" />
              <div className="absolute -right-20 -bottom-20 h-60 w-60 rounded-full bg-teal-500/10 blur-3xl" />
            </div>
            <div className="relative">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/20 ring-2 ring-emerald-500/30">
                <Sparkles className="h-8 w-8 text-emerald-400" />
              </div>
              <h2 className="text-3xl font-black text-white sm:text-4xl">
                Ready to ace your placements?
              </h2>
              <p className="mt-4 text-slate-400">
                Join thousands of engineering students using AI to prepare smarter, not harder.
              </p>
              <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
                <Link
                  href="/register"
                  id="bottom-cta"
                  className="group flex items-center gap-2 rounded-2xl bg-emerald-600 px-8 py-4 text-base font-semibold text-white shadow-lg shadow-emerald-500/20 hover:bg-emerald-500 transition-all hover:scale-105"
                >
                  Start Free Today
                  <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Link>
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <Shield className="h-4 w-4" />
                  No credit card · GDPR compliant
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Footer ──────────────────────────────────────────── */}
      <footer className="border-t border-white/5 py-10 px-6">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-emerald-400" />
            <span className="text-sm font-semibold text-white">Placemate AI</span>
          </div>
          <p className="text-xs text-slate-600">
            © {new Date().getFullYear()} Placemate AI · Built with ❤️ for Indian engineering students
          </p>
          <div className="flex items-center gap-4 text-xs text-slate-600">
            <a href="/login" className="hover:text-slate-400 transition-colors">Login</a>
            <a href="/register" className="hover:text-slate-400 transition-colors">Register</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
