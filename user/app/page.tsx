'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import { getPostAuthPath } from '@/lib/types/auth';

export default function HomePage() {
  const router = useRouter();
  const { status, isAuthenticated, user } = useAuth();

  useEffect(() => {
    if (status === 'loading') {
      return;
    }

    if (!isAuthenticated || !user) {
      router.replace('/login');
      return;
    }

    router.replace(getPostAuthPath(user));
  }, [status, isAuthenticated, user, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#FAFAFA]">
      <p className="text-sm text-[#6B7280]">Redirecting…</p>
    </div>
  );
}
