import 'next-auth';
import { JWT } from 'next-auth/jwt';

declare module 'next-auth' {
  interface User {
    id: string;
    email: string;
    username: string;
    token: string;
    isVerified: boolean;
    avatar_url: string;
  }

  interface Session {
    user: {
      id: string;
      username: string;
      email: string;
      isVerified: boolean;
      avatar_url: string;
    };
    token: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    email: string;
    username: string;
    token: string;
    isVerified: boolean;
    avatar_url: string;
  }
}
