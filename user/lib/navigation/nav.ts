import type { LucideIcon } from 'lucide-react';
import {
  LayoutDashboard,
  Building2,
  Users,
  Package,
  Receipt,
  Wallet,
  Clock3,
  TrendingUp,
  UserRoundSearch,
  BarChart3,
  Settings,
  LogOut,
} from 'lucide-react';

export interface NavItem {
  label: string;
  href: string;
  implemented: boolean;
  description?: string;
  icon: LucideIcon;
}

export interface NavSection {
  id: string;
  label: string;
  items: NavItem[];
}

export const navSections: NavSection[] = [
  {
    id: 'main',
    label: 'Main',
    items: [
      {
        label: 'Dashboard',
        href: '/dashboard',
        implemented: true,
        description: 'Overview of your business performance.',
        icon: LayoutDashboard,
      },
      {
        label: 'Business Profile',
        href: '/business-profile',
        implemented: true,
        description: 'View your business profile details.',
        icon: Building2,
      },
      {
        label: 'Customers',
        href: '/customers',
        implemented: true,
        description: 'Manage customer records and contact details.',
        icon: Users,
      },
      {
        label: 'Items',
        href: '/items',
        implemented: true,
        description: 'Manage products and services you sell.',
        icon: Package,
      },
    ],
  },
  {
    id: 'sales',
    label: 'Sales',
    items: [
      {
        label: 'Invoices',
        href: '/invoices',
        implemented: true,
        description: 'Create and track customer invoices.',
        icon: Receipt,
      },
      {
        label: 'Payments',
        href: '/payments',
        implemented: true,
        description: 'Record and reconcile customer payments.',
        icon: Wallet,
      },
      {
        label: 'Due Management',
        href: '/dues',
        implemented: true,
        description: 'Track outstanding and overdue receivables.',
        icon: Clock3,
      },
    ],
  },
  {
    id: 'analytics',
    label: 'Analytics',
    items: [
      {
        label: 'Sales Reports',
        href: '/reports/sales',
        implemented: true,
        description: 'Analyze sales performance and trends.',
        icon: TrendingUp,
      },
      {
        label: 'Customer Reports',
        href: '/reports/customers',
        implemented: true,
        description: 'Customer revenue and lifetime value.',
        icon: UserRoundSearch,
      },
      {
        label: 'Invoice Reports',
        href: '/reports/invoices',
        implemented: true,
        description: 'Invoice status and collections analytics.',
        icon: BarChart3,
      },
    ],
  },
  {
    id: 'system',
    label: 'System',
    items: [
      {
        label: 'Settings',
        href: '/settings',
        implemented: true,
        description: 'Configure account and business preferences.',
        icon: Settings,
      },
    ],
  },
];

/** Flat list kept for title lookups and backwards compatibility. */
export const primaryNavItems: NavItem[] = [
  ...navSections.flatMap((section) => section.items),
  {
    label: 'Reports',
    href: '/reports',
    implemented: true,
    description: 'Analyze sales, receivables, and growth.',
    icon: BarChart3,
  },
];

export const logoutNavItem = {
  label: 'Logout',
  icon: LogOut,
};

export const getPageTitle = (pathname: string): string => {
  if (pathname.startsWith('/business-setup')) {
    return 'Business Setup';
  }

  if (pathname.includes('/stock-history')) {
    return 'Stock History';
  }

  if (pathname === '/reports') {
    return 'Reports';
  }

  if (pathname.startsWith('/reports/customers')) {
    return 'Customer Reports';
  }

  if (pathname.startsWith('/reports/invoices')) {
    return 'Invoice Reports';
  }

  if (pathname.startsWith('/reports/sales')) {
    return 'Sales Reports';
  }

  // Prefer longer / more specific matches first
  const sorted = [...primaryNavItems].sort(
    (a, b) => b.href.length - a.href.length,
  );

  const match = sorted.find(
    (item) => pathname === item.href || pathname.startsWith(`${item.href}/`),
  );

  return match?.label ?? 'OBD';
};

export const getBreadcrumbs = (
  pathname: string,
): Array<{ label: string; href?: string }> => {
  const crumbs: Array<{ label: string; href?: string }> = [
    { label: 'Home', href: '/dashboard' },
  ];

  if (pathname.startsWith('/reports')) {
    crumbs.push({ label: 'Reports', href: '/reports' });
    if (pathname.startsWith('/reports/sales')) {
      crumbs.push({ label: 'Sales' });
    } else if (pathname.startsWith('/reports/customers')) {
      crumbs.push({ label: 'Customers' });
    } else if (pathname.startsWith('/reports/invoices')) {
      crumbs.push({ label: 'Invoices' });
    }
    return crumbs;
  }

  if (pathname.match(/^\/items\/[^/]+\/stock-history/)) {
    crumbs.push({ label: 'Items', href: '/items' });
    crumbs.push({ label: 'Item', href: pathname.replace(/\/stock-history$/, '') });
    crumbs.push({ label: 'Stock History' });
    return crumbs;
  }

  if (pathname.match(/^\/items\/[^/]+$/)) {
    crumbs.push({ label: 'Items', href: '/items' });
    crumbs.push({ label: 'Item Details' });
    return crumbs;
  }

  const title = getPageTitle(pathname);
  if (title !== 'Dashboard') {
    crumbs.push({ label: title });
  }

  return crumbs;
};

export const getNavItemByPath = (pathname: string): NavItem | undefined => {
  const sorted = [...primaryNavItems].sort(
    (a, b) => b.href.length - a.href.length,
  );

  return sorted.find(
    (item) => pathname === item.href || pathname.startsWith(`${item.href}/`),
  );
};

export const isNavItemActive = (pathname: string, href: string): boolean => {
  if (href === '/dashboard') {
    return pathname === '/dashboard';
  }

  if (href === '/reports') {
    return pathname === '/reports';
  }

  return pathname === href || pathname.startsWith(`${href}/`);
};
