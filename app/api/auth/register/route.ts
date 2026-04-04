import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';
import { getUserByEmail, createUser, findOrCreateInstitute } from '@/lib/db/queries';
import { sql } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, full_name, role = 'student', institute_name } = body;

    if (!email || !password || !full_name) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
    }

    // Check if user already exists
    const existing = await getUserByEmail(email);
    if (existing) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 409 });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Find or create institute
    const instituteId = institute_name ? await findOrCreateInstitute(institute_name) : null;

    // Create user
    const user = await createUser({ email, passwordHash, fullName: full_name, role, instituteId });

    // Create profile row for students
    if (role === 'student') {
      await sql`
        INSERT INTO profiles (user_id, onboarding_done)
        VALUES (${user.id}, false)
        ON CONFLICT (user_id) DO NOTHING
      `;
    }

    return NextResponse.json({ success: true, user: { id: user.id, email: user.email } });
  } catch (err) {
    console.error('[register]', err);
    return NextResponse.json({ error: 'Registration failed. Please try again.' }, { status: 500 });
  }
}
