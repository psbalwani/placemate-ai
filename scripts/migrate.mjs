/**
 * Placemate AI – Neon DB Migration Script (uses node-postgres / pg)
 * Run: node scripts/migrate.mjs
 *
 * Uses `pg` (real TCP connection) so DDL statements work correctly.
 */
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';

const { Client } = pg;
const __dirname = dirname(fileURLToPath(import.meta.url));

// ── Load .env.local ─────────────────────────────────────────────────────────
const envContent = readFileSync(resolve(__dirname, '../.env.local'), 'utf8');
for (const line of envContent.split('\n')) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) continue;
  const eq = trimmed.indexOf('=');
  if (eq === -1) continue;
  process.env[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim();
}

if (!process.env.DATABASE_URL) {
  console.error('❌  DATABASE_URL not found in .env.local'); process.exit(1);
}

const client = new Client({ connectionString: process.env.DATABASE_URL });
await client.connect();
console.log('✅  Connected to Neon via pg (TCP).\n');

const statements = [
  `CREATE TABLE IF NOT EXISTS institutes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    logo_url TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
  )`,
  `CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    full_name TEXT,
    role TEXT CHECK (role IN ('student', 'tpo', 'admin')) DEFAULT 'student',
    institute_id UUID REFERENCES institutes(id) ON DELETE SET NULL,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
  )`,
  `CREATE TABLE IF NOT EXISTS profiles (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    branch TEXT,
    semester INT,
    cgpa_band TEXT,
    target_role TEXT,
    skills_json JSONB DEFAULT '[]',
    hours_per_week INT DEFAULT 10,
    onboarding_done BOOLEAN DEFAULT false,
    updated_at TIMESTAMPTZ DEFAULT now()
  )`,
  `CREATE TABLE IF NOT EXISTS roadmaps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    institute_id UUID REFERENCES institutes(id) ON DELETE SET NULL,
    plan_json JSONB NOT NULL,
    duration_months INT DEFAULT 3,
    status TEXT CHECK (status IN ('active', 'archived')) DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
  )`,
  `CREATE TABLE IF NOT EXISTS roadmap_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    roadmap_id UUID REFERENCES roadmaps(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    week_number INT NOT NULL,
    completed BOOLEAN DEFAULT false,
    notes TEXT,
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE (roadmap_id, user_id, week_number)
  )`,
  `CREATE TABLE IF NOT EXISTS resume_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    institute_id UUID REFERENCES institutes(id) ON DELETE SET NULL,
    raw_resume_text TEXT NOT NULL,
    target_role TEXT,
    job_description TEXT,
    ats_score INT CHECK (ats_score BETWEEN 0 AND 100),
    parsed_json JSONB,
    strengths_json JSONB DEFAULT '[]',
    weaknesses_json JSONB DEFAULT '[]',
    improvement_actions_json JSONB DEFAULT '[]',
    improved_resume_text TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
  )`,
  `CREATE TABLE IF NOT EXISTS mock_interviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    institute_id UUID REFERENCES institutes(id) ON DELETE SET NULL,
    mode TEXT CHECK (mode IN ('text', 'video_beta')) DEFAULT 'text',
    status TEXT CHECK (status IN ('in_progress', 'completed', 'abandoned')) DEFAULT 'in_progress',
    target_role TEXT,
    transcript_json JSONB DEFAULT '[]',
    question_scores_json JSONB DEFAULT '[]',
    webcam_metrics_json JSONB DEFAULT '{}',
    overall_score INT,
    summary TEXT,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
  )`,
  `CREATE TABLE IF NOT EXISTS tpo_training_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institute_id UUID REFERENCES institutes(id) ON DELETE CASCADE,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    filters_json JSONB DEFAULT '{}',
    cohort_stats JSONB DEFAULT '{}',
    plan_json JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
  )`,
  `CREATE TABLE IF NOT EXISTS activity_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now()
  )`,
  `CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`,
  `CREATE INDEX IF NOT EXISTS idx_users_institute ON users(institute_id)`,
  `CREATE INDEX IF NOT EXISTS idx_roadmaps_user ON roadmaps(user_id, status)`,
  `CREATE INDEX IF NOT EXISTS idx_resume_feedback_user ON resume_feedback(user_id)`,
  `CREATE INDEX IF NOT EXISTS idx_mock_interviews_user ON mock_interviews(user_id, status)`,
  `CREATE INDEX IF NOT EXISTS idx_activity_log_user ON activity_log(user_id, created_at DESC)`,
];

let ok = 0;
for (const stmt of statements) {
  const label = stmt.slice(0, 55).replace(/\s+/g, ' ').trim() + '…';
  try {
    await client.query(stmt);
    console.log(`  ✓ ${label}`);
    ok++;
  } catch (err) {
    console.error(`  ❌ FAILED: ${label}\n     ${err?.message}`);
    await client.end();
    process.exit(1);
  }
}

await client.end();
console.log(`\n✅  Migration complete – ${ok} statements applied.\n`);

// ── Quick table count verification ───────────────────────────────────────────
const client2 = new Client({ connectionString: process.env.DATABASE_URL });
await client2.connect();
const { rows } = await client2.query(
  `SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename`
);
await client2.end();

console.log(`📋  Tables in public schema (${rows.length}):`);
rows.forEach(({ tablename }) => console.log(`     ✓ ${tablename}`));
