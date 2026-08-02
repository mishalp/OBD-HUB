'use client';

import { FormEvent, useId, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ApiClientError } from '@/lib/api/client';
import { useAuth } from '@/lib/auth/AuthContext';

interface FieldErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  acceptTerms?: string;
}

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const passwordRules = {
  upper: /[A-Z]/,
  lower: /[a-z]/,
  number: /[0-9]/,
  special: /[^A-Za-z0-9]/,
};

export const RegisterForm = () => {
  const router = useRouter();
  const { register } = useAuth();

  const firstNameId = useId();
  const lastNameId = useId();
  const emailId = useId();
  const passwordId = useId();
  const confirmPasswordId = useId();
  const termsId = useId();

  const firstNameRef = useRef<HTMLInputElement>(null);
  const lastNameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const confirmPasswordRef = useRef<HTMLInputElement>(null);
  const termsRef = useRef<HTMLInputElement>(null);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validate = (): FieldErrors => {
    const errors: FieldErrors = {};
    const trimmedFirst = firstName.trim();
    const trimmedLast = lastName.trim();
    const trimmedEmail = email.trim();

    if (!trimmedFirst) {
      errors.firstName = 'First name is required';
    } else if (trimmedFirst.length < 2 || trimmedFirst.length > 50) {
      errors.firstName = 'First name must be 2–50 characters';
    }

    if (!trimmedLast) {
      errors.lastName = 'Last name is required';
    } else if (trimmedLast.length < 2 || trimmedLast.length > 50) {
      errors.lastName = 'Last name must be 2–50 characters';
    }

    if (!trimmedEmail) {
      errors.email = 'Email is required';
    } else if (!emailPattern.test(trimmedEmail)) {
      errors.email = 'Enter a valid email address';
    }

    if (!password) {
      errors.password = 'Password is required';
    } else if (password.length < 8) {
      errors.password = 'Password must be at least 8 characters';
    } else if (!passwordRules.upper.test(password)) {
      errors.password = 'Password must include an uppercase letter';
    } else if (!passwordRules.lower.test(password)) {
      errors.password = 'Password must include a lowercase letter';
    } else if (!passwordRules.number.test(password)) {
      errors.password = 'Password must include a number';
    } else if (!passwordRules.special.test(password)) {
      errors.password = 'Password must include a special character';
    }

    if (!confirmPassword) {
      errors.confirmPassword = 'Confirm password is required';
    } else if (confirmPassword !== password) {
      errors.confirmPassword = 'Passwords do not match';
    }

    if (!acceptTerms) {
      errors.acceptTerms = 'You must accept the Terms & Conditions';
    }

    return errors;
  };

  const focusFirstInvalid = (errors: FieldErrors): void => {
    if (errors.firstName) {
      firstNameRef.current?.focus();
      return;
    }
    if (errors.lastName) {
      lastNameRef.current?.focus();
      return;
    }
    if (errors.email) {
      emailRef.current?.focus();
      return;
    }
    if (errors.password) {
      passwordRef.current?.focus();
      return;
    }
    if (errors.confirmPassword) {
      confirmPasswordRef.current?.focus();
      return;
    }
    if (errors.acceptTerms) {
      termsRef.current?.focus();
    }
  };

  const clearFieldError = (field: keyof FieldErrors): void => {
    setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    setServerError(null);
    const errors = validate();
    setFieldErrors(errors);

    if (Object.keys(errors).length > 0) {
      focusFirstInvalid(errors);
      return;
    }

    setIsSubmitting(true);

    try {
      await register({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        password,
        confirmPassword,
        acceptTerms: true,
      });
      router.replace('/business-setup');
    } catch (error) {
      if (error instanceof ApiClientError) {
        if (error.errors?.length) {
          const nextErrors: FieldErrors = {};

          for (const item of error.errors) {
            const key = item.path as keyof FieldErrors;
            if (key in {
              firstName: true,
              lastName: true,
              email: true,
              password: true,
              confirmPassword: true,
              acceptTerms: true,
            }) {
              nextErrors[key] = item.message;
            }
          }

          setFieldErrors(nextErrors);
          focusFirstInvalid(nextErrors);
        }

        setServerError(error.message);
      } else {
        setServerError('Unable to create account. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClassName =
    'h-11 w-full rounded-md border border-[#E5E7EB] bg-white px-3 text-sm text-[#111827] outline-none transition focus:border-[#D32F2F] focus:ring-2 focus:ring-[#D32F2F]/20 disabled:cursor-not-allowed disabled:bg-[#FAFAFA]';

  return (
    <form onSubmit={handleSubmit} className="flex w-full flex-col gap-4" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <label htmlFor={firstNameId} className="text-sm font-medium text-[#111827]">
            First Name
          </label>
          <input
            ref={firstNameRef}
            id={firstNameId}
            name="firstName"
            type="text"
            autoComplete="given-name"
            value={firstName}
            onChange={(event) => {
              setFirstName(event.target.value);
              clearFieldError('firstName');
            }}
            disabled={isSubmitting}
            className={inputClassName}
            placeholder="Jane"
          />
          {fieldErrors.firstName ? (
            <p className="text-sm text-[#DC2626]">{fieldErrors.firstName}</p>
          ) : null}
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor={lastNameId} className="text-sm font-medium text-[#111827]">
            Last Name
          </label>
          <input
            ref={lastNameRef}
            id={lastNameId}
            name="lastName"
            type="text"
            autoComplete="family-name"
            value={lastName}
            onChange={(event) => {
              setLastName(event.target.value);
              clearFieldError('lastName');
            }}
            disabled={isSubmitting}
            className={inputClassName}
            placeholder="Doe"
          />
          {fieldErrors.lastName ? (
            <p className="text-sm text-[#DC2626]">{fieldErrors.lastName}</p>
          ) : null}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor={emailId} className="text-sm font-medium text-[#111827]">
          Email Address
        </label>
        <input
          ref={emailRef}
          id={emailId}
          name="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => {
            setEmail(event.target.value);
            clearFieldError('email');
          }}
          disabled={isSubmitting}
          className={inputClassName}
          placeholder="jane@company.com"
        />
        {fieldErrors.email ? (
          <p className="text-sm text-[#DC2626]">{fieldErrors.email}</p>
        ) : null}
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor={passwordId} className="text-sm font-medium text-[#111827]">
          Password
        </label>
        <div className="relative">
          <input
            ref={passwordRef}
            id={passwordId}
            name="password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            value={password}
            onChange={(event) => {
              setPassword(event.target.value);
              clearFieldError('password');
            }}
            disabled={isSubmitting}
            className={`${inputClassName} pr-16`}
            placeholder="Create a strong password"
          />
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            disabled={isSubmitting}
            className="absolute inset-y-0 right-0 px-3 text-sm font-medium text-[#D32F2F] hover:text-[#B71C1C] disabled:opacity-50"
          >
            {showPassword ? 'Hide' : 'Show'}
          </button>
        </div>
        {fieldErrors.password ? (
          <p className="text-sm text-[#DC2626]">{fieldErrors.password}</p>
        ) : null}
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor={confirmPasswordId} className="text-sm font-medium text-[#111827]">
          Confirm Password
        </label>
        <div className="relative">
          <input
            ref={confirmPasswordRef}
            id={confirmPasswordId}
            name="confirmPassword"
            type={showConfirmPassword ? 'text' : 'password'}
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(event) => {
              setConfirmPassword(event.target.value);
              clearFieldError('confirmPassword');
            }}
            disabled={isSubmitting}
            className={`${inputClassName} pr-16`}
            placeholder="Re-enter your password"
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword((prev) => !prev)}
            disabled={isSubmitting}
            className="absolute inset-y-0 right-0 px-3 text-sm font-medium text-[#D32F2F] hover:text-[#B71C1C] disabled:opacity-50"
          >
            {showConfirmPassword ? 'Hide' : 'Show'}
          </button>
        </div>
        {fieldErrors.confirmPassword ? (
          <p className="text-sm text-[#DC2626]">{fieldErrors.confirmPassword}</p>
        ) : null}
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor={termsId} className="flex items-start gap-2 text-sm text-[#6B7280]">
          <input
            ref={termsRef}
            id={termsId}
            name="acceptTerms"
            type="checkbox"
            checked={acceptTerms}
            onChange={(event) => {
              setAcceptTerms(event.target.checked);
              clearFieldError('acceptTerms');
            }}
            disabled={isSubmitting}
            className="mt-0.5 size-4 rounded border-[#E5E7EB] text-[#D32F2F] focus:ring-[#D32F2F]"
          />
          <span>I accept the Terms & Conditions</span>
        </label>
        {fieldErrors.acceptTerms ? (
          <p className="text-sm text-[#DC2626]">{fieldErrors.acceptTerms}</p>
        ) : null}
      </div>

      {serverError ? (
        <div className="rounded-md border border-[#FECACA] bg-[#FEF2F2] px-3 py-2 text-sm text-[#DC2626]">
          {serverError}
        </div>
      ) : null}

      <button
        type="submit"
        disabled={isSubmitting}
        className="inline-flex h-11 items-center justify-center rounded-md bg-[#D32F2F] px-4 text-sm font-semibold text-white transition hover:bg-[#B71C1C] disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isSubmitting ? (
          <span className="inline-flex items-center gap-2">
            <span className="size-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            Creating account...
          </span>
        ) : (
          'Create Account'
        )}
      </button>

      <p className="text-center text-sm text-[#6B7280]">
        Already have an account?{' '}
        <Link href="/login" className="font-medium text-[#D32F2F] hover:text-[#B71C1C]">
          Login
        </Link>
      </p>
    </form>
  );
};
