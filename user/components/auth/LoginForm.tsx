'use client';

import { FormEvent, useId, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ApiClientError } from '@/lib/api/client';
import { useAuth } from '@/lib/auth/AuthContext';
import { getPostAuthPath } from '@/lib/types/auth';

interface FieldErrors {
  email?: string;
  password?: string;
}

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const LoginForm = () => {
  const router = useRouter();
  const { login } = useAuth();
  const emailId = useId();
  const passwordId = useId();
  const rememberId = useId();

  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validate = (): FieldErrors => {
    const errors: FieldErrors = {};

    if (!email.trim()) {
      errors.email = 'Email is required';
    } else if (!emailPattern.test(email.trim())) {
      errors.email = 'Enter a valid email address';
    }

    if (!password) {
      errors.password = 'Password is required';
    } else if (password.length < 8) {
      errors.password = 'Password must be at least 8 characters';
    }

    return errors;
  };

  const focusFirstInvalid = (errors: FieldErrors): void => {
    if (errors.email) {
      emailRef.current?.focus();
      return;
    }

    if (errors.password) {
      passwordRef.current?.focus();
    }
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
      const user = await login({
        email: email.trim(),
        password,
      });
      router.replace(getPostAuthPath(user));
    } catch (error) {
      if (error instanceof ApiClientError) {
        if (error.errors?.length) {
          const nextErrors: FieldErrors = {};

          for (const item of error.errors) {
            if (item.path === 'email' || item.path === 'password') {
              nextErrors[item.path] = item.message;
            }
          }

          setFieldErrors(nextErrors);
          focusFirstInvalid(nextErrors);
        }

        setServerError(error.message);
      } else {
        setServerError('Unable to sign in. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex w-full flex-col gap-5" noValidate>
      <div className="flex flex-col gap-2">
        <label htmlFor={emailId} className="text-sm font-medium text-[#111827]">
          Email
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
            setFieldErrors((prev) => ({ ...prev, email: undefined }));
          }}
          disabled={isSubmitting}
          className="h-11 rounded-md border border-[#E5E7EB] bg-white px-3 text-sm text-[#111827] outline-none transition focus:border-[#D32F2F] focus:ring-2 focus:ring-[#D32F2F]/20 disabled:cursor-not-allowed disabled:bg-[#FAFAFA]"
          placeholder="admin@company.com"
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
            autoComplete="current-password"
            value={password}
            onChange={(event) => {
              setPassword(event.target.value);
              setFieldErrors((prev) => ({ ...prev, password: undefined }));
            }}
            disabled={isSubmitting}
            className="h-11 w-full rounded-md border border-[#E5E7EB] bg-white px-3 pr-16 text-sm text-[#111827] outline-none transition focus:border-[#D32F2F] focus:ring-2 focus:ring-[#D32F2F]/20 disabled:cursor-not-allowed disabled:bg-[#FAFAFA]"
            placeholder="Enter your password"
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

      <div className="flex items-center justify-between gap-3">
        <label htmlFor={rememberId} className="flex items-center gap-2 text-sm text-[#6B7280]">
          <input
            id={rememberId}
            name="rememberMe"
            type="checkbox"
            checked={rememberMe}
            onChange={(event) => setRememberMe(event.target.checked)}
            disabled={isSubmitting}
            className="size-4 rounded border-[#E5E7EB] text-[#D32F2F] focus:ring-[#D32F2F]"
          />
          Remember me
        </label>

        <span
          aria-disabled="true"
          title="Coming soon"
          className="cursor-not-allowed text-sm text-[#9CA3AF]"
        >
          Forgot password?
        </span>
      </div>

      {serverError ? (
        <div className="rounded-md border border-[#FECACA] bg-[#FEF2F2] px-3 py-2 text-sm text-[#DC2626]">
          {serverError}
        </div>
      ) : null}

      <button
        type="submit"
        disabled={isSubmitting}
        className="inline-flex h-11 items-center justify-center rounded-lg bg-[#D32F2F] px-4 text-sm font-semibold text-white transition hover:bg-[#B71C1C] disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isSubmitting ? (
          <span className="inline-flex items-center gap-2">
            <span className="size-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            Signing in...
          </span>
        ) : (
          'Sign in'
        )}
      </button>

      <p className="text-center text-sm text-[#6B7280]">
        Don&apos;t have an account?{' '}
        <Link href="/register" className="font-medium text-[#D32F2F] hover:text-[#B71C1C]">
          Create Account
        </Link>
      </p>
    </form>
  );
};
