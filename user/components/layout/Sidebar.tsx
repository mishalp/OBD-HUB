'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import {
  isNavItemActive,
  logoutNavItem,
  navSections,
  type NavItem,
} from '@/lib/navigation/nav';
import { useAuth } from '@/lib/auth/AuthContext';
import { cn } from '@/lib/utils/cn';
import Image from 'next/image';

interface SidebarProps {
  collapsed: boolean;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  onToggleCollapse: () => void;
}

const NavLink = ({
  item,
  collapsed,
  onNavigate,
}: {
  item: NavItem;
  collapsed: boolean;
  onNavigate: () => void;
}) => {
  const pathname = usePathname();
  const active = isNavItemActive(pathname, item.href);
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      title={collapsed ? item.label : undefined}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150',
        collapsed && 'justify-center px-2',
        active
          ? 'bg-[#D32F2F] text-white shadow-sm'
          : 'text-[#9CA3AF] hover:bg-[#1E1E1E] hover:text-white',
      )}
    >
      <Icon
        className={cn(
          'h-5 w-5 shrink-0 transition-colors duration-150',
          active ? 'text-white' : 'text-[#6B7280] group-hover:text-white',
        )}
        strokeWidth={1.75}
        aria-hidden
      />
      {!collapsed ? <span className="truncate">{item.label}</span> : null}
    </Link>
  );
};

export const Sidebar = ({
  collapsed,
  mobileOpen,
  onCloseMobile,
  onToggleCollapse,
}: SidebarProps) => {
  const router = useRouter();
  const { businessName, logout } = useAuth();

  const handleLogout = async (): Promise<void> => {
    await logout();
    router.replace('/login');
  };

  const sidebarContent = (
    <div className="flex h-full flex-col bg-[#111111] text-white">
      <div
        className={cn(
          'flex h-auto items-center border-b border-white/10',
          collapsed ? 'justify-center px-2' : 'justify-between px-4',
        )}
      >
        <Link
          href="/dashboard"
          className="flex min-w-0 items-center m-auto gap-2.5"
          onClick={onCloseMobile}
        >
          {/* <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#D32F2F] text-sm font-bold text-white">
            {(businessName || 'OBD').charAt(0).toUpperCase()}
          </span> */}
            <Image src="/obdLogo.jpeg" alt="OBD" width={128} height={128} className={
              cn(" object-cover mix-blend-lighten", collapsed ? "h-12 w-auto" : "h-[75px] w-[115px]")
            } />
          {/* {!collapsed ? (
            <span className="truncate text-sm font-semibold tracking-tight text-white">
              {businessName || 'OBD'}
            </span>
          ) : null} */}
        </Link>

        <button
          type="button"
          onClick={onToggleCollapse}
          className="hidden h-8 w-8 items-center justify-center rounded-md text-[#9CA3AF] transition hover:bg-[#1E1E1E] hover:text-white lg:inline-flex"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </button>

        <button
          type="button"
          onClick={onCloseMobile}
          className="inline-flex h-8 w-8 items-center justify-center rounded-md text-[#9CA3AF] transition hover:bg-[#1E1E1E] hover:text-white lg:hidden"
          aria-label="Close sidebar"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <nav
        className="ui-scroll flex-1 space-y-5 overflow-y-auto px-3 py-4"
        aria-label="Main"
      >
        {navSections.map((section) => (
          <div key={section.id}>
            {!collapsed ? (
              <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#6B7280]">
                {section.label}
              </p>
            ) : (
              <div className="mb-2 mx-auto h-px w-6 bg-white/10" aria-hidden />
            )}
            <div className="space-y-0.5">
              {section.items.map((item) => (
                <NavLink
                  key={item.href}
                  item={item}
                  collapsed={collapsed}
                  onNavigate={onCloseMobile}
                />
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-white/10 p-3">
        <button
          type="button"
          onClick={() => {
            void handleLogout();
          }}
          title={collapsed ? logoutNavItem.label : undefined}
          className={cn(
            'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-[#9CA3AF] transition-all duration-150 hover:bg-[#1E1E1E] hover:text-white',
            collapsed && 'justify-center px-2',
          )}
        >
          <logoutNavItem.icon className="h-5 w-5 shrink-0" strokeWidth={1.75} />
          {!collapsed ? <span>Logout</span> : null}
        </button>
      </div>
    </div>
  );

  return (
    <>
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 hidden overflow-hidden transition-[width] duration-200 ease-out lg:block',
          collapsed ? 'w-[72px]' : 'w-64',
        )}
      >
        {sidebarContent}
      </aside>

      <div
        className={cn(
          'fixed inset-0 z-50 lg:hidden',
          mobileOpen ? 'pointer-events-auto' : 'pointer-events-none',
        )}
      >
        <button
          type="button"
          aria-label="Close menu overlay"
          className={cn(
            'absolute inset-0 bg-[#111111]/50 backdrop-blur-[2px] transition-opacity duration-200',
            mobileOpen ? 'opacity-100' : 'opacity-0',
          )}
          onClick={onCloseMobile}
        />
        <aside
          className={cn(
            'absolute inset-y-0 left-0 w-72 overflow-hidden shadow-2xl transition-transform duration-200 ease-out',
            mobileOpen ? 'translate-x-0' : '-translate-x-full',
          )}
        >
          {sidebarContent}
        </aside>
      </div>
    </>
  );
};
