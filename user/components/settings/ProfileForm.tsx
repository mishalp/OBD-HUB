'use client';

import { useEffect, useId, useRef, useState, type FormEvent } from 'react';
import { settingsApi } from '@/lib/api/settings';
import { resolveAssetUrl } from '@/lib/api/client';
import { collectFieldErrors, useSettingsForm, type FieldErrors } from '@/lib/settings/useSettingsForm';
import type { AuthUser } from '@/lib/types/auth';
import {
  toProfileValues,
  type ChangePasswordValues,
  type ProfileFormValues,
  type ProfileSettings,
} from '@/lib/types/settings';
import {
  SettingsField,
  SettingsSection,
  inputClassName,
} from '@/components/settings/SettingsSection';

const MAX_AVATAR_BYTES = 2 * 1024 * 1024;
const phonePattern = /^\+?[0-9\s\-()]{7,20}$/;

const emptyPassword: ChangePasswordValues = {
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
};

interface ProfileFormProps {
  profile: ProfileSettings;
  onDirtyChange: (isDirty: boolean) => void;
  onSaved: (profile: ProfileSettings, user: AuthUser) => void;
  onPasswordChanged: () => void;
}

export const ProfileForm = ({
  profile,
  onDirtyChange,
  onSaved,
  onPasswordChanged,
}: ProfileFormProps) => {
  const formId = useId();
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const form = useSettingsForm<ProfileFormValues>(toProfileValues(profile));

  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [removeAvatar, setRemoveAvatar] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [storedAvatar, setStoredAvatar] = useState<string | null>(profile.avatar);

  const [passwordValues, setPasswordValues] =
    useState<ChangePasswordValues>(emptyPassword);
  const [passwordErrors, setPasswordErrors] = useState<
    FieldErrors<ChangePasswordValues>
  >({});
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const previewUrlRef = useRef<string | null>(null);

  const avatarChanged = avatarFile !== null || removeAvatar;
  const isDirty = form.isDirty || avatarChanged;

  useEffect(() => {
    onDirtyChange(isDirty);
  }, [isDirty, onDirtyChange]);

  // Release the last object URL when the form unmounts.
  useEffect(
    () => () => {
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
      }
    },
    [],
  );

  const applyPreview = (file: File | null): void => {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
    }

    previewUrlRef.current = file ? URL.createObjectURL(file) : null;
    setAvatarPreview(previewUrlRef.current);
  };

  const validate = (values: ProfileFormValues): FieldErrors<ProfileFormValues> => {
    const errors: FieldErrors<ProfileFormValues> = {};

    if (values.firstName.trim().length < 2) {
      errors.firstName = 'First name must be at least 2 characters';
    }
    if (values.lastName.trim().length < 2) {
      errors.lastName = 'Last name must be at least 2 characters';
    }
    if (values.phone.trim() && !phonePattern.test(values.phone.trim())) {
      errors.phone = 'Enter a valid phone number';
    }

    return errors;
  };

  const handleAvatarChange = (file: File | null): void => {
    setAvatarError(null);

    if (!file) {
      setAvatarFile(null);
      applyPreview(null);
      return;
    }

    if (!file.type.startsWith('image/')) {
      setAvatarError('Avatar must be a JPEG, PNG, WEBP, or GIF image');
      return;
    }

    if (file.size > MAX_AVATAR_BYTES) {
      setAvatarError('Avatar must be smaller than 2 MB');
      return;
    }

    setRemoveAvatar(false);
    setAvatarFile(file);
    applyPreview(file);
  };

  const handleSubmit = (): void => {
    void form.submit(async (changed, values) => {
      const formData = new FormData();

      for (const key of Object.keys(changed) as Array<keyof ProfileFormValues>) {
        formData.append(key, values[key].trim());
      }

      if (avatarFile) {
        formData.append('avatar', avatarFile);
      } else if (removeAvatar) {
        formData.append('removeAvatar', 'true');
      }

      const { profile: updated, user } = await settingsApi.updateProfile(formData);

      setAvatarFile(null);
      applyPreview(null);
      setRemoveAvatar(false);
      setStoredAvatar(updated.avatar);
      if (avatarInputRef.current) {
        avatarInputRef.current.value = '';
      }
      onSaved(updated, user);

      return toProfileValues(updated);
    }, validate);
  };

  const handleReset = (): void => {
    form.reset();
    setAvatarFile(null);
    applyPreview(null);
    setRemoveAvatar(false);
    setAvatarError(null);
    if (avatarInputRef.current) {
      avatarInputRef.current.value = '';
    }
  };

  const handlePasswordSubmit = async (
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> => {
    event.preventDefault();

    const errors: FieldErrors<ChangePasswordValues> = {};

    if (!passwordValues.currentPassword) {
      errors.currentPassword = 'Current password is required';
    }
    if (passwordValues.newPassword.length < 8) {
      errors.newPassword = 'New password must be at least 8 characters';
    }
    if (passwordValues.newPassword !== passwordValues.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    if (Object.keys(errors).length > 0) {
      setPasswordErrors(errors);
      return;
    }

    setIsChangingPassword(true);
    setPasswordErrors({});

    try {
      await settingsApi.changePassword(passwordValues);
      setPasswordValues(emptyPassword);
      onPasswordChanged();
    } catch (error) {
      setPasswordErrors(collectFieldErrors<ChangePasswordValues>(error));
    } finally {
      setIsChangingPassword(false);
    }
  };

  const setPasswordField = (
    key: keyof ChangePasswordValues,
    value: string,
  ): void => {
    setPasswordValues((prev) => ({ ...prev, [key]: value }));
    setPasswordErrors((prev) => ({ ...prev, [key]: undefined, _form: undefined }));
  };

  const previewUrl = avatarPreview ?? (removeAvatar ? null : resolveAssetUrl(storedAvatar));
  const initials = `${profile.firstName.charAt(0)}${profile.lastName.charAt(0)}`.toUpperCase();

  return (
    <div className="space-y-4">
      <SettingsSection
        id="settings-panel-profile"
        title="Profile"
        description="Your personal account details. Your email address is used to sign in and cannot be changed here."
        isDirty={isDirty}
        isSubmitting={form.isSubmitting}
        formError={form.errors._form ?? null}
        onSubmit={handleSubmit}
        onReset={handleReset}
      >
        <div className="space-y-6">
          <div className="flex flex-wrap items-center gap-4">
            {previewUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={previewUrl}
                alt="Avatar preview"
                className="h-16 w-16 rounded-full border border-[#E5E7EB] object-cover"
              />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#D32F2F] text-lg font-semibold text-white">
                {initials || 'U'}
              </div>
            )}

            <div className="flex flex-col gap-2">
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => avatarInputRef.current?.click()}
                  disabled={form.isSubmitting}
                  className="rounded-md border border-[#E5E7EB] bg-white px-3 py-2 text-sm font-medium text-[#111827] hover:bg-[#FAFAFA] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Upload avatar
                </button>
                {previewUrl ? (
                  <button
                    type="button"
                    onClick={() => {
                      setAvatarFile(null);
                      applyPreview(null);
                      setRemoveAvatar(true);
                      setAvatarError(null);
                      if (avatarInputRef.current) {
                        avatarInputRef.current.value = '';
                      }
                    }}
                    disabled={form.isSubmitting}
                    className="rounded-md border border-[#E5E7EB] bg-white px-3 py-2 text-sm font-medium text-[#DC2626] hover:bg-[#FEF2F2] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Remove
                  </button>
                ) : null}
              </div>
              <p
                className={avatarError ? 'text-sm text-[#DC2626]' : 'text-xs text-[#6B7280]'}
              >
                {avatarError ?? 'PNG, JPG, WEBP, or GIF up to 2 MB.'}
              </p>
            </div>

            <input
              ref={avatarInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              className="hidden"
              onChange={(event) => handleAvatarChange(event.target.files?.[0] ?? null)}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <SettingsField
              id={`${formId}-firstName`}
              label="First Name"
              required
              error={form.errors.firstName}
            >
              <input
                id={`${formId}-firstName`}
                className={inputClassName}
                value={form.values.firstName}
                onChange={(event) => form.setField('firstName', event.target.value)}
                disabled={form.isSubmitting}
              />
            </SettingsField>

            <SettingsField
              id={`${formId}-lastName`}
              label="Last Name"
              required
              error={form.errors.lastName}
            >
              <input
                id={`${formId}-lastName`}
                className={inputClassName}
                value={form.values.lastName}
                onChange={(event) => form.setField('lastName', event.target.value)}
                disabled={form.isSubmitting}
              />
            </SettingsField>

            <SettingsField id={`${formId}-email`} label="Email">
              <input
                id={`${formId}-email`}
                className={inputClassName}
                value={profile.email}
                readOnly
                disabled
              />
            </SettingsField>

            <SettingsField
              id={`${formId}-profilePhone`}
              label="Phone"
              error={form.errors.phone}
            >
              <input
                id={`${formId}-profilePhone`}
                type="tel"
                className={inputClassName}
                value={form.values.phone}
                onChange={(event) => form.setField('phone', event.target.value)}
                disabled={form.isSubmitting}
              />
            </SettingsField>
          </div>
        </div>
      </SettingsSection>

      <section className="overflow-hidden rounded-xl border border-[#E5E7EB] bg-white shadow-sm">
        <form noValidate onSubmit={handlePasswordSubmit}>
          <header className="border-b border-[#E5E7EB] px-5 py-4 sm:px-6">
            <h2 className="text-base font-semibold text-[#111827]">Change Password</h2>
            <p className="mt-1 text-sm text-[#6B7280]">
              Use at least 8 characters. You will stay signed in on this device.
            </p>
          </header>

          <div className="grid gap-4 px-5 py-5 sm:grid-cols-3 sm:px-6">
            <SettingsField
              id={`${formId}-currentPassword`}
              label="Current Password"
              required
              error={passwordErrors.currentPassword}
            >
              <input
                id={`${formId}-currentPassword`}
                type="password"
                autoComplete="current-password"
                className={inputClassName}
                value={passwordValues.currentPassword}
                onChange={(event) =>
                  setPasswordField('currentPassword', event.target.value)
                }
                disabled={isChangingPassword}
              />
            </SettingsField>

            <SettingsField
              id={`${formId}-newPassword`}
              label="New Password"
              required
              error={passwordErrors.newPassword}
            >
              <input
                id={`${formId}-newPassword`}
                type="password"
                autoComplete="new-password"
                className={inputClassName}
                value={passwordValues.newPassword}
                onChange={(event) => setPasswordField('newPassword', event.target.value)}
                disabled={isChangingPassword}
              />
            </SettingsField>

            <SettingsField
              id={`${formId}-confirmPassword`}
              label="Confirm New Password"
              required
              error={passwordErrors.confirmPassword}
            >
              <input
                id={`${formId}-confirmPassword`}
                type="password"
                autoComplete="new-password"
                className={inputClassName}
                value={passwordValues.confirmPassword}
                onChange={(event) =>
                  setPasswordField('confirmPassword', event.target.value)
                }
                disabled={isChangingPassword}
              />
            </SettingsField>
          </div>

          {passwordErrors._form ? (
            <div
              role="alert"
              className="mx-5 mb-4 rounded-md border border-[#FECACA] bg-[#FEF2F2] px-3 py-2 text-sm text-[#B91C1C] sm:mx-6"
            >
              {passwordErrors._form}
            </div>
          ) : null}

          <footer className="flex justify-end border-t border-[#E5E7EB] bg-[#FAFAFA] px-5 py-3 sm:px-6">
            <button
              type="submit"
              disabled={isChangingPassword}
              className="rounded-md bg-[#D32F2F] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#B71C1C] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isChangingPassword ? 'Updating…' : 'Update password'}
            </button>
          </footer>
        </form>
      </section>
    </div>
  );
};
