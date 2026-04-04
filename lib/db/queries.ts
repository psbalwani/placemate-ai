import { sql } from './index';

// ─── User queries ──────────────────────────────────────────────────────────

export async function getUserByEmail(email: string) {
  const rows = await sql`
    SELECT u.*, i.name as institute_name, i.slug as institute_slug
    FROM users u
    LEFT JOIN institutes i ON u.institute_id = i.id
    WHERE u.email = ${email}
    LIMIT 1
  `;
  return rows[0] ?? null;
}

export async function getUserById(id: string) {
  const rows = await sql`
    SELECT u.*, i.name as institute_name, i.slug as institute_slug
    FROM users u
    LEFT JOIN institutes i ON u.institute_id = i.id
    WHERE u.id = ${id}
    LIMIT 1
  `;
  return rows[0] ?? null;
}

export async function createUser({
  email,
  passwordHash,
  fullName,
  role,
  instituteId,
}: {
  email: string;
  passwordHash: string;
  fullName: string;
  role: string;
  instituteId: string | null;
}) {
  const rows = await sql`
    INSERT INTO users (email, password_hash, full_name, role, institute_id)
    VALUES (${email}, ${passwordHash}, ${fullName}, ${role}, ${instituteId})
    RETURNING id, email, full_name, role, institute_id
  `;
  return rows[0];
}

// ─── Institute queries ─────────────────────────────────────────────────────

export async function findOrCreateInstitute(name: string) {
  if (!name) return null;
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const rows = await sql`
    INSERT INTO institutes (name, slug)
    VALUES (${name}, ${slug})
    ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
    RETURNING id
  `;
  return rows[0]?.id ?? null;
}

// ─── Profile queries ───────────────────────────────────────────────────────

export async function getProfile(userId: string) {
  const rows = await sql`SELECT * FROM profiles WHERE user_id = ${userId} LIMIT 1`;
  return rows[0] ?? null;
}

export async function upsertProfile(userId: string, data: Record<string, unknown>) {
  const rows = await sql`
    INSERT INTO profiles (user_id, branch, semester, cgpa_band, target_role, skills_json, hours_per_week, onboarding_done, updated_at)
    VALUES (
      ${userId},
      ${data.branch ?? null},
      ${data.semester ?? null},
      ${data.cgpa_band ?? null},
      ${data.target_role ?? null},
      ${JSON.stringify(data.skills_json ?? [])}::jsonb,
      ${data.hours_per_week ?? 10},
      ${data.onboarding_done ?? true},
      now()
    )
    ON CONFLICT (user_id) DO UPDATE SET
      branch = EXCLUDED.branch,
      semester = EXCLUDED.semester,
      cgpa_band = EXCLUDED.cgpa_band,
      target_role = EXCLUDED.target_role,
      skills_json = EXCLUDED.skills_json,
      hours_per_week = EXCLUDED.hours_per_week,
      onboarding_done = EXCLUDED.onboarding_done,
      updated_at = now()
    RETURNING *
  `;
  return rows[0];
}

// ─── Roadmap queries ───────────────────────────────────────────────────────

export async function getActiveRoadmap(userId: string) {
  const rows = await sql`
    SELECT r.*, 
      COALESCE(
        json_agg(rp ORDER BY rp.week_number) FILTER (WHERE rp.id IS NOT NULL),
        '[]'
      ) as roadmap_progress
    FROM roadmaps r
    LEFT JOIN roadmap_progress rp ON rp.roadmap_id = r.id
    WHERE r.user_id = ${userId} AND r.status = 'active'
    GROUP BY r.id
    ORDER BY r.created_at DESC
    LIMIT 1
  `;
  return rows[0] ?? null;
}

export async function archiveUserRoadmaps(userId: string) {
  await sql`UPDATE roadmaps SET status = 'archived' WHERE user_id = ${userId} AND status = 'active'`;
}

export async function createRoadmap(userId: string, instituteId: string | null, planJson: unknown, durationMonths: number) {
  const rows = await sql`
    INSERT INTO roadmaps (user_id, institute_id, plan_json, duration_months, status)
    VALUES (${userId}, ${instituteId}, ${JSON.stringify(planJson)}::jsonb, ${durationMonths}, 'active')
    RETURNING *
  `;
  return rows[0];
}

export async function updateRoadmapProgress(roadmapId: string, userId: string, weekNumber: number, completed: boolean, notes?: string) {
  await sql`
    INSERT INTO roadmap_progress (roadmap_id, user_id, week_number, completed, notes, updated_at)
    VALUES (${roadmapId}, ${userId}, ${weekNumber}, ${completed}, ${notes ?? null}, now())
    ON CONFLICT (roadmap_id, user_id, week_number) DO UPDATE SET
      completed = EXCLUDED.completed,
      notes = EXCLUDED.notes,
      updated_at = now()
  `;
}

// ─── Resume queries ────────────────────────────────────────────────────────

export async function createResumeFeedback(data: {
  userId: string;
  instituteId: string | null;
  rawResumeText: string;
  targetRole?: string;
  jobDescription?: string;
  atsScore: number;
  parsedJson: unknown;
  strengthsJson: string[];
  weaknessesJson: string[];
  improvementActionsJson: string[];
  improvedResumeText: string;
}) {
  const rows = await sql`
    INSERT INTO resume_feedback (
      user_id, institute_id, raw_resume_text, target_role, job_description,
      ats_score, parsed_json, strengths_json, weaknesses_json,
      improvement_actions_json, improved_resume_text
    ) VALUES (
      ${data.userId}, ${data.instituteId}, ${data.rawResumeText},
      ${data.targetRole ?? null}, ${data.jobDescription ?? null},
      ${data.atsScore}, ${JSON.stringify(data.parsedJson)}::jsonb,
      ${JSON.stringify(data.strengthsJson)}::jsonb,
      ${JSON.stringify(data.weaknessesJson)}::jsonb,
      ${JSON.stringify(data.improvementActionsJson)}::jsonb,
      ${data.improvedResumeText}
    )
    RETURNING *
  `;
  return rows[0];
}

export async function getLatestResumeFeedback(userId: string) {
  const rows = await sql`
    SELECT * FROM resume_feedback WHERE user_id = ${userId}
    ORDER BY created_at DESC LIMIT 1
  `;
  return rows[0] ?? null;
}

// ─── Interview queries ─────────────────────────────────────────────────────

export async function createInterview(userId: string, instituteId: string | null, targetRole: string) {
  const rows = await sql`
    INSERT INTO mock_interviews (user_id, institute_id, mode, status, target_role, transcript_json, question_scores_json)
    VALUES (${userId}, ${instituteId}, 'text', 'in_progress', ${targetRole}, '[]'::jsonb, '[]'::jsonb)
    RETURNING *
  `;
  return rows[0];
}

export async function getInterview(id: string, userId: string) {
  const rows = await sql`SELECT * FROM mock_interviews WHERE id = ${id} AND user_id = ${userId} LIMIT 1`;
  return rows[0] ?? null;
}

export async function updateInterview(id: string, data: Record<string, unknown>) {
  const setClauses = Object.entries(data)
    .map(([k]) => k)
    .join(', ');
  // Use a safe parameterized approach
  const rows = await sql`
    UPDATE mock_interviews SET
      transcript_json = ${JSON.stringify(data.transcript_json)}::jsonb,
      question_scores_json = ${JSON.stringify(data.question_scores_json)}::jsonb,
      status = ${data.status ?? 'in_progress'},
      overall_score = ${data.overall_score ?? null},
      summary = ${data.summary ?? null},
      completed_at = ${data.completed_at ?? null}
    WHERE id = ${id}
    RETURNING *
  `;
  void setClauses; // suppress unused warning
  return rows[0];
}

export async function updateInterviewWebcamMetrics(
  id: string,
  userId: string,
  webcamMetricsJson: Record<string, unknown>
) {
  try {
    const rows = await sql`
      UPDATE mock_interviews
      SET webcam_metrics_json = ${JSON.stringify(webcamMetricsJson)}::jsonb
      WHERE id = ${id} AND user_id = ${userId}
      RETURNING id, webcam_metrics_json
    `;
    return rows[0] ?? null;
  } catch (err: unknown) {
    const dbErr = err as { code?: string };
    if (dbErr.code !== '42703') throw err;

    // Backward-compatible fallback for databases that missed the latest migration.
    try {
      await sql`
        ALTER TABLE mock_interviews
        ADD COLUMN IF NOT EXISTS webcam_metrics_json JSONB DEFAULT '{}'::jsonb
      `;
      const rows = await sql`
        UPDATE mock_interviews
        SET webcam_metrics_json = ${JSON.stringify(webcamMetricsJson)}::jsonb
        WHERE id = ${id} AND user_id = ${userId}
        RETURNING id, webcam_metrics_json
      `;
      return rows[0] ?? null;
    } catch {
      // Never block interview flow because webcam metrics persistence is optional.
      return null;
    }
  }
}

export async function getUserInterviews(userId: string) {
  const rows = await sql`
    SELECT id, target_role, status, overall_score, created_at
    FROM mock_interviews WHERE user_id = ${userId}
    ORDER BY created_at DESC LIMIT 5
  `;
  return rows;
}

// ─── Activity log ──────────────────────────────────────────────────────────

export async function logActivity(userId: string, action: string, metadata?: Record<string, unknown>) {
  await sql`
    INSERT INTO activity_log (user_id, action, metadata)
    VALUES (${userId}, ${action}, ${JSON.stringify(metadata ?? {})}::jsonb)
  `;
}

// ─── Admin / TPO analytics ─────────────────────────────────────────────────

export async function getCohortStats(instituteId: string) {
  const [avgScores, skillCounts, topRoles] = await Promise.all([
    sql`
      SELECT
        COUNT(DISTINCT p.user_id) as total_students,
        ROUND(AVG(rf.ats_score), 1) as avg_ats,
        ROUND(AVG(mi.overall_score), 1) as avg_interview
      FROM profiles p
      JOIN users u ON u.id = p.user_id
      LEFT JOIN resume_feedback rf ON rf.user_id = p.user_id
      LEFT JOIN mock_interviews mi ON mi.user_id = p.user_id AND mi.status = 'completed'
      WHERE u.institute_id = ${instituteId}
    `,
    sql`
      SELECT
        skill->>'name' as skill_name,
        ROUND(AVG((skill->>'level')::int), 1) as avg_level,
        COUNT(*) as student_count
      FROM profiles p
      JOIN users u ON u.id = p.user_id
      CROSS JOIN jsonb_array_elements(p.skills_json) as skill
      WHERE u.institute_id = ${instituteId}
      GROUP BY skill->>'name'
      ORDER BY avg_level ASC
      LIMIT 10
    `,
    sql`
      SELECT target_role, COUNT(*) as count
      FROM profiles p
      JOIN users u ON u.id = p.user_id
      WHERE u.institute_id = ${instituteId} AND p.target_role IS NOT NULL
      GROUP BY target_role
      ORDER BY count DESC
      LIMIT 5
    `,
  ]);
  return { avgScores: avgScores[0], skillCounts, topRoles };
}
