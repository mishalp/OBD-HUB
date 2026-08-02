'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { settingsApi } from '@/lib/api/settings';
import { ApiClientError } from '@/lib/api/client';
import { useAuth } from '@/lib/auth/AuthContext';
import { useToast } from '@/components/ui/Toast';
import type { AuthUser } from '@/lib/types/auth';
import type { Business } from '@/lib/types/business';
import {
  SETTINGS_SECTIONS,
  SETTINGS_SECTION_LABELS,
  type InvoiceSettings,
  type PreferenceSettings,
  type ProfileSettings,
  type SettingsResponse,
  type SettingsSectionId,
  type TaxSettings,
} from '@/lib/types/settings';
import { SettingsNavigation } from '@/components/settings/SettingsNavigation';
import { BusinessProfileForm } from '@/components/settings/BusinessProfileForm';
import { InvoiceSettingsForm } from '@/components/settings/InvoiceSettingsForm';
import { TaxSettingsForm } from '@/components/settings/TaxSettingsForm';
import { PreferencesForm } from '@/components/settings/PreferencesForm';
import { ProfileForm } from '@/components/settings/ProfileForm';
import { AboutCard } from '@/components/settings/AboutCard';
import { UnsavedChangesDialog } from '@/components/settings/UnsavedChangesDialog';

type DirtyMap = Partial<Record<SettingsSectionId, boolean>>;

export default function SettingsPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const { updateBusinessSession, updateUserSession } = useAuth();

  const [settings, setSettings] = useState<SettingsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<SettingsSectionId>('business');
  const [dirtyMap, setDirtyMap] = useState<DirtyMap>({});
  const [pendingNavigation, setPendingNavigation] = useState<
    { type: 'section'; section: SettingsSectionId } | { type: 'href'; href: string } | null
  >(null);

  const dirtySections = useMemo(
    () => SETTINGS_SECTIONS.filter((section) => dirtyMap[section]),
    [dirtyMap],
  );
  const hasUnsavedChanges = dirtySections.length > 0;

  useEffect(() => {
    let cancelled = false;

    const load = async (): Promise<void> => {
      try {
        const data = await settingsApi.get();
        if (!cancelled) {
          setSettings(data);
          setLoadError(null);
        }
      } catch (error) {
        if (!cancelled) {
          setLoadError(
            error instanceof ApiClientError
              ? error.message
              : 'Unable to load settings. Please try again.',
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  // Native browser navigation (reload, close, address bar).
  useEffect(() => {
    if (!hasUnsavedChanges) {
      return;
    }

    const handleBeforeUnload = (event: BeforeUnloadEvent): void => {
      event.preventDefault();
      event.returnValue = '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  // In-app navigation away from /settings via any link (sidebar included).
  useEffect(() => {
    if (!hasUnsavedChanges) {
      return;
    }

    const handleClick = (event: MouseEvent): void => {
      if (event.defaultPrevented || event.button !== 0) {
        return;
      }

      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
        return;
      }

      const anchor = (event.target as HTMLElement | null)?.closest('a');
      const href = anchor?.getAttribute('href');

      if (!anchor || !href || anchor.target === '_blank' || !href.startsWith('/')) {
        return;
      }

      if (href === '/settings') {
        return;
      }

      event.preventDefault();
      setPendingNavigation({ type: 'href', href });
    };

    document.addEventListener('click', handleClick, true);
    return () => document.removeEventListener('click', handleClick, true);
  }, [hasUnsavedChanges]);

  const setSectionDirty = useCallback(
    (section: SettingsSectionId, isDirty: boolean): void => {
      setDirtyMap((prev) =>
        Boolean(prev[section]) === isDirty ? prev : { ...prev, [section]: isDirty },
      );
    },
    [],
  );

  const businessDirty = useCallback(
    (value: boolean) => setSectionDirty('business', value),
    [setSectionDirty],
  );
  const invoiceDirty = useCallback(
    (value: boolean) => setSectionDirty('invoice', value),
    [setSectionDirty],
  );
  const taxDirty = useCallback(
    (value: boolean) => setSectionDirty('tax', value),
    [setSectionDirty],
  );
  const preferencesDirty = useCallback(
    (value: boolean) => setSectionDirty('preferences', value),
    [setSectionDirty],
  );
  const profileDirty = useCallback(
    (value: boolean) => setSectionDirty('profile', value),
    [setSectionDirty],
  );

  const handleSelectSection = (section: SettingsSectionId): void => {
    if (section === activeSection) {
      return;
    }

    if (dirtyMap[activeSection]) {
      setPendingNavigation({ type: 'section', section });
      return;
    }

    setActiveSection(section);
  };

  const confirmLeave = (): void => {
    const target = pendingNavigation;
    setPendingNavigation(null);

    if (!target) {
      return;
    }

    if (target.type === 'section') {
      setDirtyMap((prev) => ({ ...prev, [activeSection]: false }));
      setActiveSection(target.section);
      return;
    }

    setDirtyMap({});
    router.push(target.href);
  };

  const handleBusinessSaved = (business: Business): void => {
    setSettings((prev) =>
      prev
        ? {
            ...prev,
            business,
            tax: { ...prev.tax, gstNumber: business.gstNumber },
          }
        : prev,
    );

    // Reflect name/logo in the application header immediately.
    updateBusinessSession({
      businessId: business.id,
      businessSetupCompleted: true,
      businessName: business.businessName,
      logo: business.businessLogo,
    });

    showToast('Business profile updated');
  };

  const handleInvoiceSaved = (invoice: InvoiceSettings): void => {
    setSettings((prev) =>
      prev
        ? {
            ...prev,
            invoice,
            business: { ...prev.business, dateFormat: invoice.dateFormat },
          }
        : prev,
    );
    showToast('Invoice settings updated');
  };

  const handleTaxSaved = (tax: TaxSettings): void => {
    setSettings((prev) =>
      prev
        ? {
            ...prev,
            tax,
            business: { ...prev.business, gstEnabled: tax.gstEnabled },
          }
        : prev,
    );
    showToast('Tax settings updated');
  };

  const handlePreferencesSaved = (preferences: PreferenceSettings): void => {
    setSettings((prev) => (prev ? { ...prev, preferences } : prev));
    showToast('Preferences updated');
  };

  const handleProfileSaved = (profile: ProfileSettings, user: AuthUser): void => {
    setSettings((prev) => (prev ? { ...prev, profile } : prev));
    updateUserSession({
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      avatar: user.avatar,
    });
    showToast('Profile updated');
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-40 animate-pulse rounded bg-[#E5E7EB]" />
        <div className="grid gap-4 lg:grid-cols-[220px_minmax(0,1fr)]">
          <div className="h-64 animate-pulse rounded-xl bg-[#E5E7EB]" />
          <div className="h-96 animate-pulse rounded-xl bg-[#E5E7EB]" />
        </div>
      </div>
    );
  }

  if (loadError || !settings) {
    return (
      <div className="rounded-xl border border-[#FECACA] bg-[#FEF2F2] p-6">
        <h2 className="text-base font-semibold text-[#B91C1C]">
          Unable to load settings
        </h2>
        <p className="mt-1 text-sm text-[#b91c1c]">
          {loadError ?? 'Please try again.'}
        </p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-4 rounded-md border border-[#FECACA] bg-white px-3 py-2 text-sm font-medium text-[#B91C1C] hover:bg-[#fff1f2]"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-xl font-semibold text-[#111827]">Settings</h1>
        <p className="mt-1 text-sm text-[#6B7280]">
          Manage your business profile, invoicing defaults, taxes, and personal account.
          Changes never alter invoices that have already been created.
        </p>
      </header>

      <div className="grid gap-5 lg:grid-cols-[220px_minmax(0,1fr)] lg:items-start">
        <SettingsNavigation
          active={activeSection}
          dirtySections={dirtySections}
          onSelect={handleSelectSection}
        />

        <div
          id={`settings-panel-${activeSection}`}
          role="tabpanel"
          aria-label={SETTINGS_SECTION_LABELS[activeSection]}
          className="min-w-0"
        >
          {activeSection === 'business' ? (
            <BusinessProfileForm
              business={settings.business}
              onDirtyChange={businessDirty}
              onSaved={handleBusinessSaved}
            />
          ) : null}

          {activeSection === 'invoice' ? (
            <InvoiceSettingsForm
              invoice={settings.invoice}
              onDirtyChange={invoiceDirty}
              onSaved={handleInvoiceSaved}
            />
          ) : null}

          {activeSection === 'tax' ? (
            <TaxSettingsForm
              tax={settings.tax}
              onDirtyChange={taxDirty}
              onSaved={handleTaxSaved}
            />
          ) : null}

          {activeSection === 'preferences' ? (
            <PreferencesForm
              preferences={settings.preferences}
              onDirtyChange={preferencesDirty}
              onSaved={handlePreferencesSaved}
            />
          ) : null}

          {activeSection === 'profile' ? (
            <ProfileForm
              profile={settings.profile}
              onDirtyChange={profileDirty}
              onSaved={handleProfileSaved}
              onPasswordChanged={() => showToast('Password changed successfully')}
            />
          ) : null}

          {activeSection === 'about' ? <AboutCard about={settings.about} /> : null}
        </div>
      </div>

      <UnsavedChangesDialog
        open={pendingNavigation !== null}
        sections={dirtySections.map((section) => SETTINGS_SECTION_LABELS[section])}
        onStay={() => setPendingNavigation(null)}
        onLeave={confirmLeave}
      />
    </div>
  );
}
