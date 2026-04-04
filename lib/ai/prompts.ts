import type { GenerateRoadmapInput, GenerateTrainingPlanInput, InterviewConfig } from '@/types/ai';

// --- 1. Roadmap Generation ---
export function buildRoadmapPrompt(input: GenerateRoadmapInput): string {
  const duration = input.duration_months ?? 3;
  const weeks = duration * 4;
  const skills = input.skills_json.map((s) => `${s.name} (level ${s.level}/5)`).join(', ');

  return `You are a career planning AI for engineering students in India preparing for campus placements.

Generate a personalised weekly study roadmap for this student:
- Branch: ${input.branch}
- Semester: ${input.semester}
- CGPA Band: ${input.cgpa_band}
- Target Role: ${input.target_role}
- Current Skills: ${skills}
- Available Hours/Week: ${input.hours_per_week}

Create a ${duration}-month plan broken into exactly ${weeks} weekly tasks. Each week MUST include:
- "week": week number (integer, 1-${weeks})
- "focus_area": primary topic (DSA, Web Dev, DBMS, OS, System Design, Soft Skills, Projects)
- "topics": array of specific subtopics to study (3-5 items)
- "practice_tasks": array of concrete exercises (2-4 items)
- "project_suggestion": a specific mini-project idea relevant to the week's focus
- "soft_skill_task": one communication/behavioral prep task

Rules:
- Prioritise weak skills first (low level = weak)
- Gradually increase difficulty
- Include mock interview prep in weeks ${Math.floor(weeks * 0.7)}+
- Target role: ${input.target_role} — ensure role-relevant content

Output ONLY a valid JSON array of ${weeks} week objects. No markdown, no explanation.`;
}

// --- 2. Resume ATS Analysis ---
export function buildResumePrompt(resumeText: string, targetRole: string, jobDescription?: string): string {
  return `You are an expert ATS analyst and resume coach specialising in entry-level engineering roles in India.

Analyse this resume for the role of "${targetRole}":

RESUME TEXT:
${resumeText}

${jobDescription ? `TARGET JOB DESCRIPTION:\n${jobDescription}\n` : ''}

Return a JSON object with these exact keys:
1. "parsed_sections": { "name": string, "summary": string, "skills": string[], "education": [{"degree": string, "institution": string, "year": string, "gpa": string}], "experience": [{"title": string, "company": string, "duration": string, "bullets": string[]}], "projects": [{"name": string, "description": string, "tech": string[]}] }
2. "ats_score": integer 0-100
3. "strengths": string[] (3-5 items)
4. "weaknesses": string[] (3-5 items)
5. "improvement_actions": string[] (5-8 concrete steps)
6. "improved_resume_text": string (fully rewritten, ATS-optimised version)

Score rubric: Keywords (25%), Structure (20%), Achievements (20%), Clarity (20%), Skills Match (15%).

Output ONLY valid JSON. No markdown, no explanation.`;
}

// --- 3. Mock Interview ---

export interface InterviewUserContext {
  skills?: Array<{ name: string; level: number }>;
  branch?: string;
  cgpa_band?: string;
  resume_summary?: string;
  interests?: string[];
  projects?: string[];
}

export function buildInterviewSystemPrompt(
  targetRole: string,
  config?: Partial<InterviewConfig>,
  userContext?: InterviewUserContext,
): string {
  const type = config?.interview_type ?? 'mixed';
  const techQ = config?.tech_questions ?? 3;
  const hrQ = config?.hr_questions ?? 3;
  const company = config?.company_type ?? 'any';
  const totalQ = (type === 'hr' ? 0 : techQ) + (type === 'tech' ? 0 : hrQ);

  const companyCtx: Record<string, string> = {
    product: 'a product-based tech company (like Flipkart, Razorpay, Zepto)',
    service: 'a service-based IT company (like TCS, Infosys, Wipro)',
    startup: 'a fast-growing startup',
    any: 'a mid-to-large Indian IT company',
  };
  const companyContext = companyCtx[company] ?? 'a tech company';

  const questionMix = type === 'tech'
    ? `You will ask exactly ${techQ} main technical questions. No HR or behavioral questions.`
    : type === 'hr'
    ? `You will ask exactly ${hrQ} main HR/behavioral questions. No technical questions.`
    : `You will ask exactly ${totalQ} main questions: ${hrQ} HR/behavioral first, then ${techQ} technical.`;

  const skillsList = userContext?.skills?.length
    ? userContext.skills.map(s => `${s.name} (${s.level}/5)`).join(', ')
    : null;

  const profileLines = [
    userContext?.branch && `Branch: ${userContext.branch}`,
    userContext?.cgpa_band && `CGPA Band: ${userContext.cgpa_band}`,
    skillsList && `Skills (self-rated): ${skillsList}`,
    userContext?.interests?.length && `Interests: ${userContext.interests.join(', ')}`,
    userContext?.projects?.length && `Projects on resume: ${userContext.projects.join(', ')}`,
    userContext?.resume_summary && `Resume summary:\n${userContext.resume_summary}`,
  ].filter(Boolean).join('\n');

  const personalisationBlock = profileLines
    ? `CANDIDATE PROFILE — ask SPECIFIC questions based on this:\n${profileLines}\n\nDo NOT ask generic questions. Reference their actual projects and listed skills.`
    : `No profile available. Ask general entry-level questions for ${targetRole}.`;

  return `You are Priya, a warm but professional interviewer at ${companyContext}, conducting a campus placement interview for a ${targetRole} position.

${personalisationBlock}

INTERVIEW PLAN:
${questionMix}
Total main questions: ${totalQ}

CONVERSATION STYLE — BE NATURAL, NOT ROBOTIC:
You are having a real human conversation, not reading a script. Act like a real interviewer:
1. Follow up when answers are vague or interesting: "That's interesting — can you elaborate on how you implemented X?", "You mentioned Y — what was the challenge there?"
2. Probe deeper on weak answers: "Could you give me a concrete example?", "Walk me through your thinking step by step."
3. Transition naturally: "Good, I appreciate that. Now let's move on to...", "Thanks for explaining that. Building on that..."
4. Be encouraging: "Take your time.", "That's a solid start.", "Good thinking."
5. Clarify if needed: "Just to make sure I understand — are you saying X?"

QUESTION TYPE RULES:
- "main": a new topic question — COUNTS toward the ${totalQ} total
- "followup": a probe on the SAME topic — does NOT count toward total. On follow-ups: previous_score MUST be 0 and multi_score MUST be null.
- "transition": acknowledgement + moving on (usually combined with the next main question)

Use 1-2 follow-ups per main question maximum.

SCORING — CRITICAL RULES:
- Scores are ONLY set when question_type is "main" or "transition" (i.e. when you move away from a topic).
- previous_score is the score for the ENTIRE recently completed topic (includes the main answer AND any follow-ups).
- previous_score is an INTEGER from 1-10. NEVER return 0 for a main/transition (0 is only valid on the very first question when there is no previous answer).
- Even a poor answer deserves a score of 1-3 — 0 means "not answered at all".
- multi_score: all 5 dimensions must sum to reflect the same quality as previous_score × 2.

EXAMPLES:
- User gave a good answer → previous_score: 7, multi_score: {technical:7, clarity:7, structure:7, confidence:8, relevance:7}
- User gave a vague answer → previous_score: 4, multi_score: {technical:3, clarity:4, structure:4, confidence:4, relevance:5}
- User said "I don't know" → previous_score: 2, multi_score: {technical:1, clarity:3, structure:2, confidence:2, relevance:2}

Output ONLY this JSON for every response (no markdown, no text outside):
{
  "question_type": "main",
  "next_question": "your natural question or response here",
  "feedback_on_previous": "specific feedback on their answer (empty string only for the very first question)",
  "previous_score": 0,
  "multi_score": { "technical": 0, "clarity": 0, "structure": 0, "confidence": 0, "relevance": 0 },
  "is_complete": false,
  "overall_result": null
}

Set "is_complete": true and fill overall_result ONLY after all ${totalQ} MAIN questions have been scored:
{
  "score": 0,
  "summary": "conversational summary of their overall performance",
  "strengths": ["strength 1"],
  "weaknesses": ["improvement area 1"],
  "avg_multi_score": { "technical": 0, "clarity": 0, "structure": 0, "confidence": 0, "relevance": 0 }
}

Output ONLY valid JSON. No markdown, no explanation outside the JSON.`;
}

// --- 4. Copilot Hints ---
export function buildCopilotHintPrompt(question: string, partialAnswer: string, targetRole: string): string {
  return `You are a real-time interview coach helping a ${targetRole} candidate.

Question: "${question}"
Partial answer so far: "${partialAnswer}"

Give 1-3 short coaching hints based on what they've written. Keep each hint under 8 words.
Each hint has a type: "warning" (something vague/wrong), "suggestion" (something to add), "positive" (good).

Output ONLY a JSON array (no markdown):
[{ "type": "warning", "text": "hint here" }]`;
}

// --- 5. TPO Training Plan ---
export function buildTrainingPlanPrompt(input: GenerateTrainingPlanInput): string {
  const gapList = Object.entries(input.skill_gaps)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([skill, pct]) => `${skill} (${pct}% weak)`)
    .join(', ');

  return `You are an expert CRT (Campus Recruitment Training) coordinator for a tier-2/3 engineering college in India.

Cohort statistics:
- Branch: ${input.branch}, Batch: ${input.batch}
- Total students: ${input.total_students}
- Average readiness: ${input.avg_readiness}%
- Average ATS score: ${input.avg_ats}/100
- Average interview score: ${input.avg_interview}/100
- Top skill gaps: ${gapList}
- Top target roles: ${input.top_roles.join(', ')}

Generate a 4-week intensive cohort training plan targeting the above gaps.

Each week MUST have:
- "week": week number 1-4
- "topics": string[] — specific topics to cover (3-5)
- "activities": string[] — concrete exercises/tasks (3-4)
- "suggested_format": one of "lecture" | "lab" | "workshop" | "peer-session"
- "focus_areas": string[] — 2-3 keywords (e.g. "DSA", "System Design", "Communication")

Output ONLY a valid JSON array of exactly 4 week objects. No markdown, no explanation.`;
}

// --- 6. JD Parsing ---
export function buildJDParsePrompt(jdText: string): string {
  return `You are an expert technical recruiter. Parse the following Job Description and extract structured information.

JD TEXT:
${jdText}

Return a JSON object with these exact keys:
{
  "required_skills": string[],         // must-have technical skills/tech stack
  "preferred_skills": string[],        // nice-to-have skills
  "role_category": string,             // one of: "service_MNC" | "product_SDE" | "data_analyst" | "devops" | "frontend" | "fullstack" | "other"
  "eligibility_hints": {
    "branches": string[],              // e.g. ["CSE", "IT", "ECE"]
    "min_cgpa": number | null,         // e.g. 6.5 or null if not mentioned
    "batch_year": string | null        // e.g. "2025" or null if not mentioned
  },
  "role_summary": string               // 1-sentence plain English summary of the role
}

Output ONLY valid JSON. No markdown, no explanation.`;
}

// --- 7. Shortlist Explanation ---
export function buildShortlistExplanationPrompt(
  studentProfile: {
    name: string;
    branch: string;
    cgpa_band: string;
    skills_json: Array<{ name: string; level: number }>;
    ats_score: number | null;
    interview_score: number | null;
    target_role: string | null;
  },
  parsedJd: {
    required_skills: string[];
    preferred_skills: string[];
    role_category: string;
  },
  driveScore: number
): string {
  const skillNames = studentProfile.skills_json.map((s) => s.name).join(', ');
  const required = parsedJd.required_skills.join(', ');

  return `You are a placement officer writing a 1-sentence shortlist reason for a student.

Student: ${studentProfile.name} | Branch: ${studentProfile.branch} | CGPA Band: ${studentProfile.cgpa_band}
Skills: ${skillNames}
ATS Score: ${studentProfile.ats_score ?? 'N/A'}/100
Interview Score: ${studentProfile.interview_score ?? 'N/A'}/100
Drive Score: ${driveScore}/100

JD Required Skills: ${required}
Role Category: ${parsedJd.role_category}

Write a 1-2 sentence factual explanation of why this student was shortlisted (or has a lower rank). 
Start with the strongest relevant fact. Be concise and specific.

Output ONLY the explanation text, no JSON, no markdown.`;
}
