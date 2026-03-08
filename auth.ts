import NextAuth, { CredentialsSignin } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { apiClient } from './lib/apiClient/apiClient';
import { AxiosError } from 'axios';
import Google from 'next-auth/providers/google';
import { googleLogin } from './lib/actions/user';

class InvalidLoginError extends CredentialsSignin {
  constructor(code: string) {
    super(code);
    this.code = code;
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  session: {
    strategy: 'jwt',
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: 'Email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }
        try {
          const response = await apiClient.post('/api/user/login', credentials);
          const user = {
            ...response.data,
            id: response.data._id,
            _id: undefined,
          };

          return user;
        } catch (error) {
          const axiosError = error as AxiosError;
          const { message } = axiosError?.response?.data as {
            message: string;
          };
          throw new InvalidLoginError(message || 'Internal Server Error');
        }
      },
    }),
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
      authorization: {
        params: {
          prompt: 'select_account',
        },
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === 'google') {
        if (!account.id_token) return false;

        try {
          const data = await googleLogin(account.id_token);

          // Attach backend data to user object
          user.id = data._id;
          user.username = data.username;
          user.email = data.email;
          user.isVerified = data.isVerified;
          user.token = data.token;
          user.avatar_url = data.avatar_url;

          return true;
        } catch (error) {
          console.error('Google backend login failed:', error);
          return false;
        }
      }

      return true;
    },

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
});
