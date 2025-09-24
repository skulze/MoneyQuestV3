import NextAuth from 'next-auth';
import type { NextAuthOptions } from 'next-auth';
import CognitoProvider from 'next-auth/providers/cognito';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import { PrismaClient } from '@prisma/client';

// Initialize Prisma client for NextAuth adapter (this will use the backend's database)
// In development, we'll use a mock for local-first development
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || 'file:./dev.db'
    }
  }
});

const authOptions: NextAuthOptions = {
  // Use Prisma adapter for production, but we'll handle local-first separately
  adapter: process.env.NODE_ENV === 'production' ? PrismaAdapter(prisma) : undefined,

  providers: [
    // AWS Cognito Provider (for production)
    CognitoProvider({
      clientId: process.env.COGNITO_CLIENT_ID!,
      clientSecret: process.env.COGNITO_CLIENT_SECRET!,
      issuer: process.env.COGNITO_ISSUER!,
    }),

    // Credentials provider for local development
    CredentialsProvider({
      id: 'demo-login',
      name: 'Demo Login',
      credentials: {
        email: {
          label: 'Email',
          type: 'email',
          placeholder: 'demo@moneyquest.com'
        },
        password: {
          label: 'Password',
          type: 'password'
        }
      },
      async authorize(credentials) {
        // Demo login for development
        if (
          credentials?.email === 'demo@moneyquest.com' &&
          credentials?.password === 'demo123'
        ) {
          return {
            id: 'demo-user-123',
            email: 'demo@moneyquest.com',
            name: 'Demo User',
            subscription: 'free'
          };
        }

        // Free tier demo user
        if (
          credentials?.email === 'free@moneyquest.com' &&
          credentials?.password === 'free123'
        ) {
          return {
            id: 'free-user-123',
            email: 'free@moneyquest.com',
            name: 'Free User',
            subscription: 'free'
          };
        }

        // Plus tier demo user
        if (
          credentials?.email === 'plus@moneyquest.com' &&
          credentials?.password === 'plus123'
        ) {
          return {
            id: 'plus-user-123',
            email: 'plus@moneyquest.com',
            name: 'Plus User',
            subscription: 'plus'
          };
        }

        // Premium tier demo user
        if (
          credentials?.email === 'premium@moneyquest.com' &&
          credentials?.password === 'premium123'
        ) {
          return {
            id: 'premium-user-123',
            email: 'premium@moneyquest.com',
            name: 'Premium User',
            subscription: 'premium'
          };
        }

        return null;
      }
    })
  ],

  callbacks: {
    async jwt({ token, user, account }) {
      // Persist user data to the token right after signin
      if (user) {
        token.id = user.id;
        token.subscription = (user as any).subscription || 'free';
      }

      // Handle Cognito tokens
      if (account?.provider === 'cognito') {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
      }

      return token;
    },

    async session({ session, token }) {
      // Send properties to the client
      if (session.user) {
        session.user.id = token.id as string;
        session.user.subscription = token.subscription as 'free' | 'plus' | 'premium';
      }

      return session;
    },

    async redirect({ url, baseUrl }) {
      // Redirect to dashboard after login
      if (url.startsWith('/')) return `${baseUrl}${url}`;
      else if (new URL(url).origin === baseUrl) return url;
      return `${baseUrl}/dashboard`;
    }
  },

  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
    verifyRequest: '/auth/verify-request',
  },

  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  events: {
    async signIn({ user, account, profile }) {
      // Initialize user's local data engine when they sign in
      console.log('User signed in:', user.email);
    },

    async signOut({ session, token }) {
      // Clean up local data when user signs out
      console.log('User signed out:', session?.user?.email);
    }
  },

  debug: process.env.NODE_ENV === 'development',
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };