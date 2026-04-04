import OpenAI from 'openai';

const groq = new OpenAI({
  apiKey: process.env.GROQ_API_KEY!,
  baseURL: 'https://api.groq.com/openai/v1',
});

/** Ordered list of models to try when quota is exhausted on the current one. */
export const MODEL_FALLBACK_CHAIN = [
  'llama-3.3-70b-versatile',
  'llama-3.1-8b-instant',
  'gemma2-9b-it',
] as const;

export type GroqModel = (typeof MODEL_FALLBACK_CHAIN)[number];

/** Thrown when all models in the fallback chain are quota-exhausted. */
export class AIQuotaError extends Error {
  retryAfterSeconds?: number;
  constructor(message: string, retryAfterSeconds?: number) {
    super(message);
    this.name = 'AIQuotaError';
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

/** Returns true when an error looks like a 429 rate-limit error. */
function isQuotaError(err: unknown): boolean {
  if (typeof err !== 'object' || err === null) return false;
  const e = err as Record<string, unknown>;
  return (
    e.status === 429 ||
    (e as { constructor?: { name?: string } }).constructor?.name === 'RateLimitError' ||
    String(e.message ?? '').toLowerCase().includes('rate limit') ||
    String(e.message ?? '').includes('429')
  );
}

/**
 * Core text generation with automatic model fallback on 429 quota errors.
 * Uses an OpenAI-style messages array for full chat support.
 */
export async function generateText(
  messages: OpenAI.Chat.ChatCompletionMessageParam[],
  preferredModel?: string,
): Promise<string> {
  const chain: string[] = preferredModel
    ? [preferredModel, ...MODEL_FALLBACK_CHAIN.filter((m) => m !== preferredModel)]
    : [...MODEL_FALLBACK_CHAIN];

  let lastErr: unknown;
  for (const model of chain) {
    try {
      const completion = await groq.chat.completions.create({
        model,
        messages,
        temperature: 0.7,
        max_tokens: 4096,
      });
      return completion.choices[0]?.message?.content ?? '';
    } catch (err) {
      if (isQuotaError(err)) {
        console.warn(`[AI] Rate-limited on ${model}, trying next model…`);
        lastErr = err;
        continue;
      }
      throw err;
    }
  }

  throw new AIQuotaError(
    'All Groq models are rate-limited. Please wait a moment and try again.',
    60,
  );
  void lastErr;
}

/**
 * Generate content from a single prompt string and parse the response as JSON.
 * Strips markdown fences if the model wraps JSON in ```json ... ```.
 */
export async function generateJSON<T>(prompt: string, modelName?: string): Promise<T> {
  const text = await generateText(
    [{ role: 'user', content: prompt }],
    modelName,
  );

  // Strip markdown code fences if present
  const cleaned = text
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```\s*$/i, '')
    .trim();

  try {
    return JSON.parse(cleaned) as T;
  } catch {
    const jsonMatch = cleaned.match(/(\[[\s\S]*\]|\{[\s\S]*\})/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[1]) as T;
    }
    throw new Error(`Failed to parse AI response as JSON: ${cleaned.slice(0, 200)}`);
  }
}
