import { NextResponse } from 'next/server';

export async function GET() {
  const apiKey = process.env.TRUGEN_API_KEY;
  const agentId = process.env.TRUGEN_AGENT_ID;
  const embedUrl = process.env.TRUGEN_EMBED_URL ?? null;

  const enabled = Boolean(apiKey && agentId);

  return NextResponse.json({
    enabled,
    agentId: enabled ? agentId : null,
    embedUrl: enabled ? embedUrl : null,
  });
}
