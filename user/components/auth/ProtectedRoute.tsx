'use client';

import { useEffect, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import { getPostAuthPath } from '@/lib/types/auth';

interface ProtectedRouteProps {
  children: ReactNode;
}

/** @deprecated Prefer AppLayout for authenticated app routes. */
export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const router = useRouter();
  const { status, isAuthenticated, user } = useAuth();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/login');
      return;
    }

    if (status === 'authenticated' && user) {
      router.replace(getPostAuthPath(user));
    }
  }, [status, user, router]);

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FAFAFA]">
        <p className="text-sm text-[#5b6573]">Loading session...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
};
