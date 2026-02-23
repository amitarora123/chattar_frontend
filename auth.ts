import NextAuth, { CredentialsSignin } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { apiClient } from './lib/apiClient/apiClient';
import { AxiosError } from 'axios';

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
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.username = user.username;
        token.token = user.token;
        token.email = user.email;
        token.id = user.id;
      }
      return token;
    },
  },
  pages: {
    newUser: '/auth/sign-up',
    signIn: '/auth/sign-in',
    signOut: '/',
  },
});
