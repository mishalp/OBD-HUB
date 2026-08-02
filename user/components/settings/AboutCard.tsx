'use client';

import type { AboutInfo } from '@/lib/types/settings';

interface AboutCardProps {
  about: AboutInfo;
}

const formatBuildDate = (value: string): string => {
  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const AboutCard = ({ about }: AboutCardProps) => {
  const rows: Array<{ label: string; value: string }> = [
    { label: 'Application Version', value: about.applicationVersion },
    { label: 'API Version', value: about.apiVersion },
    { label: 'Database Version', value: about.databaseVersion },
    { label: 'Build Date', value: formatBuildDate(about.buildDate) },
    { label: 'Environment', value: about.environment },
    { label: 'Licence', value: about.licence },
  ];

  return (
    <section
      id="settings-panel-about"
      className="overflow-hidden rounded-xl border border-[#E5E7EB] bg-white shadow-sm"
    >
      <header className="border-b border-[#E5E7EB] px-5 py-4 sm:px-6">
        <h2 className="text-base font-semibold text-[#111827]">About</h2>
        <p className="mt-1 text-sm text-[#6B7280]">
          Version and environment information for this installation.
        </p>
      </header>

      <dl className="divide-y divide-[#F3F4F6]">
        {rows.map((row) => (
          <div
            key={row.label}
            className="flex flex-wrap items-center justify-between gap-2 px-5 py-3 sm:px-6"
          >
            <dt className="text-sm text-[#6B7280]">{row.label}</dt>
            <dd className="text-sm font-medium text-[#111827]">{row.value}</dd>
          </div>
        ))}
      </dl>

      <footer className="border-t border-[#E5E7EB] bg-[#FAFAFA] px-5 py-3 text-xs text-[#6B7280] sm:px-6">
        Database and licence details are placeholders until the corresponding modules
        are implemented.
      </footer>
    </section>
  );
};
