'use client';

import {
  Building2,
  FileText,
  Info,
  Percent,
  Settings2,
  User,
  type LucideIcon,
} from 'lucide-react';
import {
  SETTINGS_SECTIONS,
  SETTINGS_SECTION_LABELS,
  type SettingsSectionId,
} from '@/lib/types/settings';
import { cn } from '@/lib/utils/cn';

const SECTION_ICONS: Record<SettingsSectionId, LucideIcon> = {
  business: Building2,
  invoice: FileText,
  tax: Percent,
  preferences: Settings2,
  profile: User,
  about: Info,
};

interface SettingsNavigationProps {
  active: SettingsSectionId;
  dirtySections: SettingsSectionId[];
  onSelect: (section: SettingsSectionId) => void;
}

export const SettingsNavigation = ({
  active,
  dirtySections,
  onSelect,
}: SettingsNavigationProps) => (
  <nav aria-label="Settings sections" className="lg:sticky lg:top-20">
    <ul
      className="flex gap-1.5 overflow-x-auto pb-1 lg:flex-col lg:gap-1 lg:overflow-visible lg:pb-0"
      role="tablist"
    >
      {SETTINGS_SECTIONS.map((section) => {
        const isActive = section === active;
        const isDirty = dirtySections.includes(section);
        const Icon = SECTION_ICONS[section];

        return (
          <li key={section} className="shrink-0 lg:shrink">
            <button
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-controls={`settings-panel-${section}`}
              onClick={() => onSelect(section)}
              className={cn(
                'flex w-full items-center gap-2.5 whitespace-nowrap rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150',
                isActive
                  ? 'bg-[#D32F2F] text-white shadow-sm'
                  : 'text-[#6B7280] hover:bg-[#F3F4F6] hover:text-[#111827]',
              )}
            >
              <Icon className="h-4 w-4 shrink-0" strokeWidth={1.75} aria-hidden />
              <span className="truncate">{SETTINGS_SECTION_LABELS[section]}</span>
              {isDirty ? (
                <span
                  aria-label="Unsaved changes"
                  className={cn(
                    'ml-auto h-2 w-2 shrink-0 rounded-full',
                    isActive ? 'bg-white' : 'bg-[#F59E0B]',
                  )}
                />
              ) : null}
            </button>
          </li>
        );
      })}
    </ul>
  </nav>
);
