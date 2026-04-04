import { auth } from '@/auth';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { generateText, AIQuotaError } from '@/lib/ai/client';
import { buildCopilotHintPrompt } from '@/lib/ai/prompts';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { question, partial_answer, target_role } = body as {
      question: string;
      partial_answer: string;
      target_role: string;
    };

    /* Skip if answer is too short — avoids 429 from rapid/empty calls */
    if (!question || !partial_answer || partial_answer.trim().split(/\s+/).length < 8) {
      return NextResponse.json({ hints: [] });
    }

    const prompt = buildCopilotHintPrompt(question, partial_answer, target_role ?? 'Software Engineer');

    const messages = [{ role: 'user' as const, content: prompt }];
    const text = await generateText(messages);

    const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim();

    try {
      const parsed = JSON.parse(cleaned) as { hints: Array<{ type: string; text: string }> };
      return NextResponse.json({ hints: parsed.hints ?? [] });
    } catch {
      const match = cleaned.match(/\{[\s\S]*\}/);
      if (match) {
        const parsed = JSON.parse(match[0]) as { hints: Array<{ type: string; text: string }> };
        return NextResponse.json({ hints: parsed.hints ?? [] });
      }
      return NextResponse.json({ hints: [] });
    }
  } catch (err) {
    if (err instanceof AIQuotaError) {
      return NextResponse.json({ hints: [] }, { status: 429 });
    }
    return NextResponse.json({ hints: [] });
  }
}
