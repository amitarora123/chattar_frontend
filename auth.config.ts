import type { NextAuthConfig } from 'next-auth';

export const authConfig = {
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.username = user.username;
        token.token = user.token;
        token.email = user.email;
        token.id = user.id;
        token.isVerified = user.isVerified;
        token.avatar_url = user.avatar_url;
      }

      if (trigger === 'update' && session) {
        token.isVerified = session.isVerified ?? token.isVerified;
      }

      return token;
    },
    async session({ session, token }) {
      session.user.id = token.id;
      session.user.email = token.email;
      session.user.username = token.username;
      session.user.isVerified = token.isVerified;
      session.user.avatar_url = token.avatar_url;
      session.token = token.token as string;

      return session;
    },
  },
  pages: {
    newUser: '/auth/sign-up',
    signIn: '/auth/sign-in',
    signOut: '/',
  },
  providers: [],
} satisfies NextAuthConfig;
