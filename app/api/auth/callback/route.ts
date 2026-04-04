import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * This project uses NextAuth v5 (credentials) + Neon Postgres.
 * OAuth code-exchange callback is no longer needed.
 * NextAuth handles its own callbacks at /api/auth/[...nextauth].
 */
export async function GET(request: NextRequest) {
  const { origin } = new URL(request.url);
  return NextResponse.redirect(`${origin}/login`);
}
