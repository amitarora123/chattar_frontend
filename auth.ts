import NextAuth, { CredentialsSignin } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { AxiosError } from 'axios';
import Google from 'next-auth/providers/google';
import { googleLogin } from './lib/actions/user';
import { authConfig } from './auth.config';

class InvalidLoginError extends CredentialsSignin {
  constructor(code: string) {
    super(code);
    this.code = code;
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
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
          const { apiClient } = await import('./lib/apiClient/apiClient');
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
    ...authConfig.callbacks,
    async signIn({ user, account }) {
      if (account?.provider === 'google') {
        if (!account.id_token) return false;

        console.log(account.id_token)
        try {
          const data = await googleLogin(account.id_token);
          
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
  },
});
