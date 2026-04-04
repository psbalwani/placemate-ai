import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

// One-click migration — safe to run multiple times (IF NOT EXISTS / DO $$ blocks)
export async function POST() {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS drives (
        id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        institute_id UUID NOT NULL REFERENCES institutes(id),
        created_by   UUID NOT NULL REFERENCES users(id),
        company_name TEXT NOT NULL,
        role_title   TEXT NOT NULL,
        jd_text      TEXT NOT NULL,
        parsed_jd_json      JSONB DEFAULT '{}'::jsonb,
        eligibility_json    JSONB DEFAULT '{}'::jsonb,
        scoring_config_json JSONB DEFAULT '{}'::jsonb,
        status       TEXT DEFAULT 'draft',
        drive_date   DATE,
        ctc          TEXT,
        location     TEXT,
        created_at   TIMESTAMPTZ DEFAULT now()
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS drive_shortlists (
        id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        drive_id         UUID NOT NULL REFERENCES drives(id) ON DELETE CASCADE,
        student_user_id  UUID NOT NULL REFERENCES users(id),
        drive_score      NUMERIC(5,2),
        reasons_json     JSONB DEFAULT '[]'::jsonb,
        status           TEXT DEFAULT 'pending',
        UNIQUE(drive_id, student_user_id)
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS tpo_training_plans (
        id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        institute_id     UUID NOT NULL REFERENCES institutes(id),
        created_by       UUID NOT NULL REFERENCES users(id),
        filters_json     JSONB DEFAULT '{}'::jsonb,
        cohort_stats_json JSONB DEFAULT '{}'::jsonb,
        plan_json        JSONB NOT NULL,
        created_at       TIMESTAMPTZ DEFAULT now()
      )
    `;

    // Patch existing table: add missing columns if they don't exist yet
    await sql`
      DO $$
      BEGIN
        -- Add cohort_stats_json if old table only has cohort_stats
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'tpo_training_plans' AND column_name = 'cohort_stats_json'
        ) THEN
          IF EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'tpo_training_plans' AND column_name = 'cohort_stats'
          ) THEN
            ALTER TABLE tpo_training_plans RENAME COLUMN cohort_stats TO cohort_stats_json;
          ELSE
            ALTER TABLE tpo_training_plans ADD COLUMN cohort_stats_json JSONB DEFAULT '{}'::jsonb;
          END IF;
        END IF;
      END
      $$
    `;

    return NextResponse.json({ success: true, message: 'TPO tables migrated and patched' });
  } catch (error) {
    console.error('Migration error:', error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
