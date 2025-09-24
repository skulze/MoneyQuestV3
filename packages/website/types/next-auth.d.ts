import NextAuth from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      subscription?: 'free' | 'plus' | 'premium';
    };
  }

  interface User {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    subscription?: 'free' | 'plus' | 'premium';
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    subscription?: 'free' | 'plus' | 'premium';
    accessToken?: string;
    refreshToken?: string;
  }
}