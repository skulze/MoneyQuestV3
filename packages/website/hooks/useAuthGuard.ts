import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

/**
 * Custom hook to protect pages that require authentication
 * Redirects unauthenticated users to signin page with callback URL
 */
export function useAuthGuard(redirectTo?: string) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    // Don't redirect while still loading session
    if (status === 'loading') return;

    if (!session) {
      // Build callback URL for redirect after signin
      const currentPath = redirectTo || window.location.pathname;
      const callbackUrl = encodeURIComponent(currentPath);

      console.log(`🔒 No session found, redirecting to login with callback: ${currentPath}`);
      router.push(`/auth/signin?callbackUrl=${callbackUrl}`);
      return;
    }

    console.log('✅ User is authenticated:', session.user?.email);
  }, [session, status, router, redirectTo]);

  return {
    session,
    status,
    isLoading: status === 'loading',
    isAuthenticated: !!session
  };
}