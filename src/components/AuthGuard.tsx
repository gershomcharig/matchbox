'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { isAuthenticated } from '@/lib/auth';
import { isPasswordSet } from '@/app/setup/actions';

type AuthGuardProps = {
  children: React.ReactNode;
};

/**
 * Auth guard component that protects routes
 * Redirects to /setup if no password is set
 * Redirects to /login if not authenticated
 */
export default function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    async function checkAuth() {
      // Skip auth check for public routes
      if (pathname === '/setup' || pathname === '/login') {
        setIsAuthorized(true);
        setIsChecking(false);
        return;
      }

      // Check if password is set
      const passwordExists = await isPasswordSet();

      if (!passwordExists) {
        // No password set, redirect to setup
        router.push('/setup');
        return;
      }

      // Check if user is authenticated
      const authenticated = isAuthenticated();

      if (!authenticated) {
        // Not authenticated, redirect to login
        router.push('/login');
        return;
      }

      // User is authenticated
      setIsAuthorized(true);
      setIsChecking(false);
    }

    checkAuth();
  }, [pathname, router]);

  // Show loading state while checking
  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-zinc-50 via-stone-50 to-zinc-100 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin" />
          <p className="text-sm text-zinc-600 dark:text-zinc-400">Loading...</p>
        </div>
      </div>
    );
  }

  // Only render children if authorized
  return isAuthorized ? <>{children}</> : null;
}
