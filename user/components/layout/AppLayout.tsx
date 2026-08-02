'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import { getPageTitle } from '@/lib/navigation/nav';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { cn } from '@/lib/utils/cn';

interface AppLayoutProps {
  children: ReactNode;
}

const SIDEBAR_COLLAPSED_KEY = 'obd.sidebar.collapsed';

export const AppLayout = ({ children }: AppLayoutProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const { status, isAuthenticated, businessSetupCompleted } = useAuth();
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === 'undefined') {
      return false;
    }
    try {
      return window.localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === '1';
    } catch {
      return false;
    }
  });
  const [mobileOpen, setMobileOpen] = useState(false);
  const isOnboarding = pathname === '/business-setup';

  const toggleCollapse = (): void => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        window.localStorage.setItem(SIDEBAR_COLLAPSED_KEY, next ? '1' : '0');
      } catch {
        // ignore
      }
      return next;
    });
  };

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/login');
      return;
    }

    if (status !== 'authenticated') {
      return;
    }

    if (!businessSetupCompleted && !isOnboarding) {
      router.replace('/business-setup');
      return;
    }

    if (businessSetupCompleted && isOnboarding) {
      router.replace('/dashboard');
    }
  }, [status, businessSetupCompleted, isOnboarding, router]);

  if (status === 'loading' || !isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FAFAFA]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#E5E7EB] border-t-[#D32F2F]" />
          <p className="text-sm text-[#6B7280]">Loading session…</p>
        </div>
      </div>
    );
  }

  if (!businessSetupCompleted && !isOnboarding) {
    return null;
  }

  if (businessSetupCompleted && isOnboarding) {
    return null;
  }

  if (!businessSetupCompleted && isOnboarding) {
    return (
      <div className="min-h-screen bg-[#FAFAFA]">
        <Header
          title="Business Setup"
          pathname={pathname}
          onOpenSidebar={() => undefined}
          hideMenuButton
          subtitle="Complete your profile to unlock the dashboard"
        />
        <main className="px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <Sidebar
        collapsed={collapsed}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
        onToggleCollapse={toggleCollapse}
      />

      <div
        className={cn(
          'min-h-screen transition-[padding] duration-200 ease-out',
          collapsed ? 'lg:pl-[72px]' : 'lg:pl-64',
        )}
      >
        <Header
          title={getPageTitle(pathname)}
          pathname={pathname}
          onOpenSidebar={() => setMobileOpen(true)}
          showDashboardMeta={pathname === '/dashboard'}
        />
        <main className="px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
};
