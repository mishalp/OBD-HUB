'use client';

import { useEffect, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';

/**
 * Minimal authenticated shell for print routes — no sidebar, header, or app chrome.
 */
export default function PrintRouteLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { status, isAuthenticated, businessSetupCompleted } = useAuth();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/login');
      return;
    }

    if (status === 'authenticated' && !businessSetupCompleted) {
      router.replace('/business-setup');
    }
  }, [status, businessSetupCompleted, router]);

  if (status === 'loading' || !isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <p className="text-sm text-[#737373]">Loading...</p>
      </div>
    );
  }

  if (!businessSetupCompleted) {
    return null;
  }

  return <>{children}</>;
}
