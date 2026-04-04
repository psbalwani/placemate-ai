import { generateText, AIQuotaError } from './client';
import { buildInterviewSystemPrompt } from './prompts';
import type { InterviewTurnResponse, InterviewConfig } from '@/types/ai';
import type { InterviewUserContext } from './prompts';

/** Safe JSON extractor — handles truncated objects by finding the last valid closing brace */
function extractJSON(raw: string): InterviewTurnResponse | null {
  // Strip markdown fences
  let text = raw
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```\s*$/i, '')
    .trim();

  // Direct parse attempt
  try { return JSON.parse(text) as InterviewTurnResponse; } catch { /* try repair */ }

  // Find the outermost { ... } and try to parse that
  const start = text.indexOf('{');
  if (start === -1) return null;

  // Walk backwards from end to find a closing brace that makes valid JSON
  for (let end = text.length - 1; end > start; end--) {
    if (text[end] === '}') {
      try {
        return JSON.parse(text.slice(start, end + 1)) as InterviewTurnResponse;
      } catch { continue; }
    }
  }

  return null;
}

/** Fallback response when AI returns unparseable output */
function fallbackResponse(errorMsg: string): InterviewTurnResponse {
  return {
    next_question: null,
    feedback_on_previous: 'I had trouble processing that response. Please try again.',
    previous_score: 0,
    multi_score: null,
    is_complete: false,
    overall_result: undefined,
    _error: errorMsg,
  } as unknown as InterviewTurnResponse;
}

export async function runInterviewTurn(
  targetRole: string,
  transcript: Array<{ role: 'interviewer' | 'candidate'; content: string }>,
  candidateAnswer?: string,
  config?: Partial<InterviewConfig>,
  userContext?: InterviewUserContext,
): Promise<InterviewTurnResponse> {
  const systemPrompt = buildInterviewSystemPrompt(targetRole, config, userContext);

  const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
    { role: 'system', content: systemPrompt },
    ...transcript.map((t) => ({
      role: (t.role === 'interviewer' ? 'assistant' : 'user') as 'assistant' | 'user',
      content: t.content,
    })),
    {
      role: 'user' as const,
      content: candidateAnswer
        ? `Candidate answered: "${candidateAnswer}"\n\nEvaluate this answer and provide the next question. Respond only with valid JSON.`
        : 'Please begin the interview by asking your first question. Respond only with valid JSON.',
    },
  ];

  let text: string;
  try {
    text = await generateText(messages);
  } catch (err) {
    if (err instanceof AIQuotaError) throw err;
    // For other errors, return a graceful fallback so the interview doesn't crash
    console.error('[Interview] generateText failed:', err);
    return fallbackResponse('AI service temporarily unavailable');
  }

  const result = extractJSON(text);
  if (result) return result;

  console.error('[Interview] Could not parse AI response:', text.slice(0, 300));
  // Return fallback instead of throwing — keeps the interview session alive
  return fallbackResponse('AI returned invalid format. Please submit your answer again.');
}
