import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { getUserByEmail } from '@/lib/db/queries';

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await getUserByEmail(credentials.email as string);
        if (!user || !user.password_hash) return null;

        const isValid = await bcrypt.compare(
          credentials.password as string,
          user.password_hash as string
        );
        if (!isValid) return null;

        return {
          id: user.id as string,
          email: user.email as string,
          name: (user.full_name as string) ?? '',
          role: (user.role as string) ?? 'student',
          institute_id: (user.institute_id as string) ?? null,
        };
      },
    }),
  ],

  callbacks: {
    jwt({ token, user }) {
      if (user) {
        const u = user as unknown as { id: string; role: string; institute_id: string | null };
        token.id = u.id;
        token.role = u.role;
        token.institute_id = u.institute_id;
      }
      return token;
    },
    session({ session, token }) {
      if (token) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.institute_id = token.institute_id;
      }
      return session;
    },
  },

  pages: {
    signIn: '/login',
  },

  session: { strategy: 'jwt' },
});
