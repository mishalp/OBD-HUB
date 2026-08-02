'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Bell,
  ChevronDown,
  LogOut,
  Menu,
  Plus,
  Search,
  Settings,
  User,
} from 'lucide-react';
import { useAuth } from '@/lib/auth/AuthContext';
import { getUserDisplayName } from '@/lib/types/auth';
import { resolveAssetUrl } from '@/lib/api/client';
import { getBreadcrumbs } from '@/lib/navigation/nav';
import { Button } from '@/components/ui/Button';

interface HeaderProps {
  title: string;
  subtitle?: string;
  pathname: string;
  onOpenSidebar: () => void;
  hideMenuButton?: boolean;
  showDashboardMeta?: boolean;
}

export const Header = ({
  title,
  subtitle,
  pathname,
  onOpenSidebar,
  hideMenuButton = false,
}: HeaderProps) => {
  const router = useRouter();
  const { user, logout, businessName, logo } = useAuth();
  const [profileOpen, setProfileOpen] = useState(false);
  const [quickOpen, setQuickOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const profileRef = useRef<HTMLDivElement>(null);
  const quickRef = useRef<HTMLDivElement>(null);

  const displayName = user ? getUserDisplayName(user) : 'User';
  const initials = user
    ? `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase()
    : 'U';
  const logoUrl = resolveAssetUrl(logo);
  const breadcrumbs = getBreadcrumbs(pathname);

  useEffect(() => {
    const handleClick = (event: MouseEvent): void => {
      const target = event.target as Node;
      if (profileRef.current && !profileRef.current.contains(target)) {
        setProfileOpen(false);
      }
      if (quickRef.current && !quickRef.current.contains(target)) {
        setQuickOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleLogout = async (): Promise<void> => {
    await logout();
    router.replace('/login');
  };

  const handleSearch = (event: React.FormEvent): void => {
    event.preventDefault();
    const q = searchQuery.trim();
    if (!q) {
      return;
    }
    router.push(`/customers?search=${encodeURIComponent(q)}`);
  };

  return (
    <header className="sticky top-0 z-30 border-b border-[#E5E7EB] bg-white/95 shadow-[0_1px_2px_rgb(0_0_0/0.03)] backdrop-blur-sm">
      <div className="flex h-16 items-center gap-3 px-4 sm:px-6">
        {!hideMenuButton ? (
          <button
            type="button"
            onClick={onOpenSidebar}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[#E5E7EB] text-[#6B7280] transition hover:bg-[#FAFAFA] hover:text-[#111827] lg:hidden"
            aria-label="Open sidebar"
          >
            <Menu className="h-5 w-5" />
          </button>
        ) : null}

        <div className="min-w-0 flex-1">
          <nav
            aria-label="Breadcrumb"
            className="mb-0.5 hidden items-center gap-1.5 text-[12px] text-[#9CA3AF] sm:flex"
          >
            {breadcrumbs.map((crumb, index) => (
              <span key={`${crumb.label}-${index}`} className="flex items-center gap-1.5">
                {index > 0 ? <span>/</span> : null}
                {crumb.href && index < breadcrumbs.length - 1 ? (
                  <Link
                    href={crumb.href}
                    className="transition hover:text-[#111827]"
                  >
                    {crumb.label}
                  </Link>
                ) : (
                  <span
                    className={
                      index === breadcrumbs.length - 1
                        ? 'font-medium text-[#6B7280]'
                        : undefined
                    }
                  >
                    {crumb.label}
                  </span>
                )}
              </span>
            ))}
          </nav>
          <div className="flex min-w-0 items-baseline gap-2">
            <h1 className="truncate text-base font-semibold tracking-tight text-[#111827] sm:text-lg">
              {title}
            </h1>
            {subtitle ? (
              <p className="hidden truncate text-[13px] text-[#9CA3AF] md:block">
                {subtitle}
              </p>
            ) : null}
          </div>
        </div>

        <form
          onSubmit={handleSearch}
          className="relative hidden max-w-xs flex-1 md:block lg:max-w-sm"
        >
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9CA3AF]"
            aria-hidden
          />
          <input
            type="search"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search customers…"
            className="h-9 w-full rounded-lg border border-[#E5E7EB] bg-[#FAFAFA] py-2 pr-3 pl-9 text-sm text-[#111827] placeholder:text-[#9CA3AF] transition focus:border-[#D32F2F] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#D32F2F]/15"
            aria-label="Search"
          />
        </form>

        <div className="flex items-center gap-1.5 sm:gap-2">
          <div className="relative" ref={quickRef}>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus className="h-4 w-4" />}
              onClick={() => setQuickOpen((open) => !open)}
              aria-expanded={quickOpen}
              aria-haspopup="menu"
              className="hidden sm:inline-flex"
            >
              New
            </Button>
            {quickOpen ? (
              <div
                role="menu"
                className="absolute right-0 z-50 mt-2 w-48 overflow-hidden rounded-xl border border-[#E5E7EB] bg-white py-1 shadow-lg"
              >
                {[
                  { label: 'New Invoice', href: '/invoices/new' },
                  { label: 'New Customer', href: '/customers' },
                  { label: 'Record Payment', href: '/payments' },
                ].map((action) => (
                  <Link
                    key={action.href}
                    href={action.href}
                    role="menuitem"
                    onClick={() => setQuickOpen(false)}
                    className="block px-3 py-2 text-sm text-[#111827] transition hover:bg-[#FAFAFA]"
                  >
                    {action.label}
                  </Link>
                ))}
              </div>
            ) : null}
          </div>

          <button
            type="button"
            className="relative inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[#E5E7EB] text-[#6B7280] transition hover:bg-[#FAFAFA] hover:text-[#111827]"
            aria-label="Notifications"
            title="Notifications"
          >
            <Bell className="h-4 w-4" />
            <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-[#D32F2F]" />
          </button>

          <div className="relative" ref={profileRef}>
            <button
              type="button"
              onClick={() => setProfileOpen((open) => !open)}
              className="flex items-center gap-2 rounded-lg border border-[#E5E7EB] py-1 pr-2 pl-1 transition hover:bg-[#FAFAFA]"
              aria-expanded={profileOpen}
              aria-haspopup="menu"
            >
              {logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={logoUrl}
                  alt={businessName ?? 'Business logo'}
                  className="h-7 w-7 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#111111] text-[11px] font-semibold text-white">
                  {initials}
                </div>
              )}
              <div className="hidden text-left md:block">
                <p className="max-w-[120px] truncate text-[13px] font-medium text-[#111827]">
                  {businessName || displayName}
                </p>
                <p className="max-w-[120px] truncate text-[11px] text-[#9CA3AF]">
                  {user?.email}
                </p>
              </div>
              <ChevronDown className="hidden h-3.5 w-3.5 text-[#9CA3AF] sm:block" />
            </button>

            {profileOpen ? (
              <div
                role="menu"
                className="absolute right-0 z-50 mt-2 w-56 overflow-hidden rounded-xl border border-[#E5E7EB] bg-white py-1 shadow-lg"
              >
                <div className="border-b border-[#E5E7EB] px-3 py-2.5">
                  <p className="text-sm font-medium text-[#111827]">{displayName}</p>
                  <p className="truncate text-[12px] text-[#6B7280]">{user?.email}</p>
                </div>
                <Link
                  href="/settings"
                  role="menuitem"
                  onClick={() => setProfileOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-[#111827] transition hover:bg-[#FAFAFA]"
                >
                  <User className="h-4 w-4 text-[#6B7280]" />
                  Profile
                </Link>
                <Link
                  href="/settings"
                  role="menuitem"
                  onClick={() => setProfileOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-[#111827] transition hover:bg-[#FAFAFA]"
                >
                  <Settings className="h-4 w-4 text-[#6B7280]" />
                  Settings
                </Link>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setProfileOpen(false);
                    void handleLogout();
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm text-[#DC2626] transition hover:bg-[#FEF2F2]"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  );
};
