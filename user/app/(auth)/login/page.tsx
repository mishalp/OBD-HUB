import { GuestRoute } from '@/components/auth/GuestRoute';
import { LoginForm } from '@/components/auth/LoginForm';

export default function LoginPage() {
  return (
    <GuestRoute>
      <main className="relative flex min-h-screen items-center justify-center bg-[#FAFAFA] px-4 py-10">
        <div className="absolute inset-x-0 top-0 h-1 bg-[#D32F2F]" aria-hidden />

        <section className="relative w-full max-w-[420px]">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[#111111] text-lg font-bold text-white">
              O
            </div>
            <p className="text-2xl font-semibold tracking-tight text-[#111827]">OBD</p>
            <h1 className="mt-2 text-lg font-medium text-[#111827]">Sign in to your account</h1>
            <p className="mt-1.5 text-sm text-[#6B7280]">
              Billing & CRM administration access
            </p>
          </div>

          <div className="rounded-xl border border-[#E5E7EB] bg-white p-6 shadow-[0_8px_30px_rgb(0_0_0/0.04)] sm:p-8">
            <LoginForm />
          </div>
        </section>
      </main>
    </GuestRoute>
  );
}
