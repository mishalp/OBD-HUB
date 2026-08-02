'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { invoicesApi } from '@/lib/api/invoices';
import { customersApi } from '@/lib/api/customers';
import { ApiClientError } from '@/lib/api/client';
import { useToast } from '@/components/ui/Toast';
import type { Customer } from '@/lib/types/customer';
import type {
  EditableInvoiceStatus,
  InvoiceFormState,
  InvoiceLineForm,
  UpdateInvoicePayload,
} from '@/lib/types/invoice';
import {
  createEmptyInvoiceLine,
  invoiceToFormState,
  isEditableInvoiceStatus,
} from '@/lib/types/invoice';
import type { Item } from '@/lib/types/item';
import { applyItemToLine, InvoiceForm } from '@/components/invoices/InvoiceForm';
import { InvoiceStatusBadge } from '@/components/invoices/InvoiceStatusBadge';
import { UnsavedChangesDialog } from '@/components/invoices/UnsavedChangesDialog';

export default function EditInvoicePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { showToast } = useToast();
  const invoiceId = params.id;

  const [form, setForm] = useState<InvoiceFormState | null>(null);
  const [invoiceNumber, setInvoiceNumber] = useState('…');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [notEditable, setNotEditable] = useState(false);

  const [isDirty, setIsDirty] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [customerError, setCustomerError] = useState<string | undefined>();
  const [itemsError, setItemsError] = useState<string | undefined>();

  const [leaveDialogOpen, setLeaveDialogOpen] = useState(false);
  const [pendingHref, setPendingHref] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const timer = window.setTimeout(() => {
      void (async () => {
        setIsLoading(true);
        setLoadError(null);

        try {
          const { invoice } = await invoicesApi.getById(invoiceId);

          if (cancelled) {
            return;
          }

          setInvoiceNumber(invoice.invoiceNumber);

          if (!isEditableInvoiceStatus(invoice.status)) {
            setNotEditable(true);
            return;
          }

          setForm(invoiceToFormState(invoice));

          if (invoice.customerId) {
            try {
              const { customer } = await customersApi.getById(invoice.customerId);
              if (!cancelled) {
                setSelectedCustomer(customer);
              }
            } catch {
              // Non-fatal: selector can still be re-picked.
            }
          }
        } catch (err) {
          if (!cancelled) {
            setLoadError(
              err instanceof ApiClientError ? err.message : 'Unable to load invoice.',
            );
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
  }, [invoiceId]);

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent): void => {
      if (!isDirty || isSubmitting) {
        return;
      }
      event.preventDefault();
      event.returnValue = '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty, isSubmitting]);

  const markDirty = useCallback((): void => {
    setIsDirty(true);
  }, []);

  const validate = (state: InvoiceFormState): boolean => {
    let valid = true;
    const filledItems = state.items.filter((item) => item.itemId);

    if (!state.customerId) {
      setCustomerError('Customer is required');
      valid = false;
    } else {
      setCustomerError(undefined);
    }

    if (filledItems.length === 0) {
      setItemsError('Add at least one invoice item');
      valid = false;
    } else if (
      filledItems.some(
        (item) => item.type !== 'Service' && item.quantity <= 0,
      )
    ) {
      setItemsError('Quantity must be greater than 0');
      valid = false;
    } else if (
      filledItems.some(
        (item) => item.type === 'Product' && !item.unit.trim(),
      )
    ) {
      setItemsError('Unit is required for products');
      valid = false;
    } else if (filledItems.some((item) => item.unitPrice < 0 || item.discount < 0)) {
      setItemsError('Price and discount must be valid');
      valid = false;
    } else {
      setItemsError(undefined);
    }

    return valid;
  };

  const buildPayload = (
    state: InvoiceFormState,
    status: EditableInvoiceStatus,
  ): UpdateInvoicePayload => ({
    customerId: state.customerId,
    invoiceDate: state.invoiceDate,
    dueDate: state.dueDate ? state.dueDate : null,
    status,
    notes: state.notes.trim() || null,
    terms: state.terms.trim() || null,
    items: state.items
      .filter((item) => item.itemId)
      .map((item) => ({
        itemId: item.itemId,
        quantity: item.type === 'Service' ? 1 : item.quantity,
        unit: item.unit.trim() || (item.type === 'Service' ? 'svc' : item.unit),
        unitPrice: item.unitPrice,
        discount: item.discount,
        taxRate: item.taxRate,
      })),
  });

  const saveInvoice = async (status: EditableInvoiceStatus): Promise<void> => {
    if (!form || isSubmitting) {
      return;
    }

    const nextForm = { ...form, status };
    setForm(nextForm);

    if (!validate(nextForm)) {
      return;
    }

    setIsSubmitting(true);
    setServerError(null);

    try {
      await invoicesApi.update(invoiceId, buildPayload(nextForm, status));
      setIsDirty(false);
      showToast('Invoice updated successfully');
      router.push(`/invoices/${invoiceId}`);
    } catch (err) {
      if (err instanceof ApiClientError) {
        setServerError(err.message);
        if (err.errors?.length) {
          for (const item of err.errors) {
            if (item.path === 'customerId') {
              setCustomerError(item.message);
            }
            if (item.path.startsWith('items')) {
              setItemsError(item.message);
            }
          }
        }
      } else {
        setServerError('Unable to update invoice.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const requestLeave = (href: string): void => {
    if (!isDirty || isSubmitting) {
      router.push(href);
      return;
    }
    setPendingHref(href);
    setLeaveDialogOpen(true);
  };

  const handleCustomerChange = (customer: Customer | null): void => {
    markDirty();
    setSelectedCustomer(customer);
    setForm((prev) => (prev ? { ...prev, customerId: customer?.id ?? '' } : prev));
    setCustomerError(undefined);
  };

  const handleFieldChange = <K extends keyof InvoiceFormState>(
    key: K,
    value: InvoiceFormState[K],
  ): void => {
    markDirty();
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev));
  };

  const handleLineChange = (key: string, patch: Partial<InvoiceLineForm>): void => {
    markDirty();
    setForm((prev) =>
      prev
        ? {
            ...prev,
            items: prev.items.map((line) => {
              if (line.key !== key) {
                return line;
              }
              const next = { ...line, ...patch };
              if (next.type === 'Service') {
                next.quantity = 1;
              }
              return next;
            }),
          }
        : prev,
    );
  };

  const handleSelectItem = (key: string, item: Item): void => {
    markDirty();
    setForm((prev) =>
      prev
        ? {
            ...prev,
            items: prev.items.map((line) =>
              line.key === key ? { ...line, ...applyItemToLine(item) } : line,
            ),
          }
        : prev,
    );
    setItemsError(undefined);
  };

  const handleAddRow = (): void => {
    markDirty();
    setForm((prev) =>
      prev ? { ...prev, items: [...prev.items, createEmptyInvoiceLine()] } : prev,
    );
  };

  const handleRemoveRow = (key: string): void => {
    markDirty();
    setForm((prev) =>
      prev
        ? {
            ...prev,
            items:
              prev.items.length <= 1
                ? prev.items
                : prev.items.filter((line) => line.key !== key),
          }
        : prev,
    );
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <p className="text-sm text-[#6B7280]">Loading invoice...</p>
      </div>
    );
  }

  if (notEditable) {
    return (
      <div className="space-y-4">
        <Link
          href={`/invoices/${invoiceId}`}
          className="text-sm font-medium text-[#D32F2F] hover:text-[#B71C1C]"
        >
          ← Back to invoice
        </Link>
        <div className="rounded-xl border border-[#FDE68A] bg-[#FFFBEB] px-4 py-3 text-sm text-[#92400E]">
          This invoice can no longer be edited. Only Draft and Unpaid invoices are editable.
        </div>
      </div>
    );
  }

  if (loadError || !form) {
    return (
      <div className="space-y-4">
        <Link href="/invoices" className="text-sm font-medium text-[#D32F2F] hover:text-[#B71C1C]">
          ← Back to invoices
        </Link>
        <div className="rounded-xl border border-[#FECACA] bg-[#FEF2F2] px-4 py-3 text-sm text-[#B91C1C]">
          {loadError ?? 'Invoice not found.'}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <button
            type="button"
            onClick={() => requestLeave(`/invoices/${invoiceId}`)}
            className="text-sm font-medium text-[#D32F2F] hover:text-[#B71C1C]"
          >
            ← Back to invoice
          </button>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <h2 className="text-2xl font-semibold text-[#111827]">Edit Invoice</h2>
            <InvoiceStatusBadge status={form.status} />
          </div>
          <p className="mt-1 text-sm text-[#6B7280]">
            Invoice Number: <span className="font-medium text-[#111827]">{invoiceNumber}</span>
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => {
              void saveInvoice('Draft');
            }}
            className="rounded-md border border-[#E5E7EB] px-4 py-2.5 text-sm font-semibold text-[#111827] hover:bg-[#FAFAFA] disabled:opacity-60"
          >
            {isSubmitting && form.status === 'Draft' ? 'Saving...' : 'Save as Draft'}
          </button>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => {
              void saveInvoice('Unpaid');
            }}
            className="rounded-md bg-[#D32F2F] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#B71C1C] disabled:opacity-60"
          >
            {isSubmitting && form.status === 'Unpaid' ? 'Saving...' : 'Save Invoice'}
          </button>
        </div>
      </div>

      <InvoiceForm
        form={form}
        selectedCustomer={selectedCustomer}
        invoiceNumber={invoiceNumber}
        disabled={isSubmitting}
        allowPaidStatus={false}
        customerError={customerError}
        itemsError={itemsError}
        serverError={serverError}
        onCustomerChange={handleCustomerChange}
        onFieldChange={handleFieldChange}
        onPaymentChange={() => {
          // Payment-on-create is not available when editing.
        }}
        onLineChange={handleLineChange}
        onSelectItem={handleSelectItem}
        onAddRow={handleAddRow}
        onRemoveRow={handleRemoveRow}
      />

      <UnsavedChangesDialog
        open={leaveDialogOpen}
        onStay={() => {
          setLeaveDialogOpen(false);
          setPendingHref(null);
        }}
        onLeave={() => {
          setLeaveDialogOpen(false);
          setIsDirty(false);
          if (pendingHref) {
            router.push(pendingHref);
          }
        }}
      />
    </div>
  );
}
