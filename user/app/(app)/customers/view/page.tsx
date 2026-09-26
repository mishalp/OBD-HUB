'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { customersApi } from '@/lib/api/customers';
import { ApiClientError } from '@/lib/api/client';
import { useToast } from '@/components/ui/Toast';
import type { CustomerDetails, CustomerFormValues } from '@/lib/types/customer';
import { customerToFormValues } from '@/lib/types/customer';
import { CustomerDetailsCard } from '@/components/customers/CustomerDetailsCard';
import { CustomerModal } from '@/components/customers/CustomerModal';
import { DeleteConfirmationDialog } from '@/components/customers/DeleteConfirmationDialog';

function CustomerDetailsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { showToast } = useToast();
  const customerId = searchParams.get('id') || '';

  const [customer, setCustomer] = useState<CustomerDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formFieldErrors, setFormFieldErrors] = useState<{
    name?: string;
    phone?: string;
    email?: string;
  }>({});
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const timer = window.setTimeout(() => {
      void (async () => {
        if (!customerId) {
          if (!cancelled) {
            setIsLoading(false);
            setError('No customer ID provided.');
          }
          return;
        }

        setIsLoading(true);
        setError(null);

        try {
          const response = await customersApi.getById(customerId);
          if (!cancelled) {
            setCustomer(response.customer);
          }
        } catch (err) {
          if (!cancelled) {
            if (err instanceof ApiClientError) {
              setError(err.message);
            } else {
              setError('Unable to load customer.');
            }
          }
        } finally {
          if (!cancelled) {
            setIsLoading(false);
          }
        }
      })();
    }, 0);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [customerId, reloadToken]);

  const modalKey = useMemo(
    () => (customer ? `edit-${customer.id}-${customer.updatedAt}` : 'edit'),
    [customer],
  );

  const handleUpdate = async (values: CustomerFormValues): Promise<void> => {
    if (!customer) {
      return;
    }

    setIsSubmitting(true);
    setFormError(null);
    setFormFieldErrors({});

    try {
      await customersApi.update(customer.id, values);
      showToast('Customer updated successfully');
      setIsEditOpen(false);
      setReloadToken((prev) => prev + 1);
    } catch (err) {
      if (err instanceof ApiClientError) {
        if (err.errors?.length) {
          const nextErrors: { name?: string; phone?: string; email?: string } = {};
          for (const item of err.errors) {
            if (item.path === 'name' || item.path === 'phone' || item.path === 'email') {
              nextErrors[item.path] = item.message;
            }
          }
          setFormFieldErrors(nextErrors);
        }
        setFormError(err.message);
      } else {
        setFormError('Unable to update customer.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (): Promise<void> => {
    if (!customer) {
      return;
    }

    setIsDeleting(true);

    try {
      await customersApi.remove(customer.id);
      showToast('Customer deleted successfully');
      router.replace('/customers');
    } catch (err) {
      if (err instanceof ApiClientError) {
        showToast(err.message, 'error');
      } else {
        showToast('Unable to delete customer.', 'error');
      }
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <p className="text-sm text-[#6B7280]">Loading customer...</p>
      </div>
    );
  }

  if (error || !customer) {
    return (
      <div className="space-y-4">
        <Link href="/customers" className="text-sm font-medium text-[#D32F2F] hover:text-[#B71C1C]">
          ← Back to customers
        </Link>
        <div className="rounded-xl border border-[#FECACA] bg-[#FEF2F2] px-4 py-3 text-sm text-[#B91C1C]">
          {error ?? 'Customer not found.'}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link href="/customers" className="text-sm font-medium text-[#D32F2F] hover:text-[#B71C1C]">
            ← Back to customers
          </Link>
          <h2 className="mt-2 text-2xl font-semibold text-[#111827]">Customer Details</h2>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => {
              setFormError(null);
              setFormFieldErrors({});
              setIsEditOpen(true);
            }}
            className="rounded-md border border-[#E5E7EB] px-3 py-2 text-sm font-medium text-[#111827] hover:bg-[#FAFAFA]"
          >
            Edit
          </button>
          <button
            type="button"
            onClick={() => setIsDeleteOpen(true)}
            className="rounded-md border border-[#FECACA] px-3 py-2 text-sm font-medium text-[#DC2626] hover:bg-[#FEF2F2]"
          >
            Delete
          </button>
        </div>
      </div>

      <CustomerDetailsCard customer={customer} />

      <CustomerModal
        key={modalKey}
        open={isEditOpen}
        title="Edit Customer"
        initialValues={customerToFormValues(customer)}
        submitLabel="Save Changes"
        isSubmitting={isSubmitting}
        serverError={formError}
        fieldErrors={formFieldErrors}
        onClose={() => {
          if (!isSubmitting) {
            setIsEditOpen(false);
          }
        }}
        onSubmit={handleUpdate}
      />

      <DeleteConfirmationDialog
        open={isDeleteOpen}
        customerName={customer.name}
        isDeleting={isDeleting}
        onCancel={() => {
          if (!isDeleting) {
            setIsDeleteOpen(false);
          }
        }}
        onConfirm={() => {
          void handleDelete();
        }}
      />
    </div>
  );
}

export default function CustomerDetailsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[40vh] items-center justify-center">
          <p className="text-sm text-[#6B7280]">Loading customer...</p>
        </div>
      }
    >
      <CustomerDetailsContent />
    </Suspense>
  );
}
