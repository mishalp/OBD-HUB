import { BusinessSetupForm } from '@/components/business/BusinessSetupForm';

export default function BusinessSetupPage() {
  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-[#111827]">Set up your business</h2>
        <p className="mt-1 text-sm text-[#6B7280]">
          Complete this one-time onboarding to start using OBD.
        </p>
      </div>
      <BusinessSetupForm />
    </div>
  );
}
