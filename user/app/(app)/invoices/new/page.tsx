'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { invoicesApi } from '@/lib/api/invoices';
import { invoiceNumberApi } from '@/lib/api/invoiceNumber';
import { ApiClientError } from '@/lib/api/client';
import { useToast } from '@/components/ui/Toast';
import type { Customer } from '@/lib/types/customer';
import type {
  CreateInvoicePayload,
  CreatableInvoiceStatus,
  InvoiceFormState,
  InvoiceInitialPaymentForm,
  InvoiceLineForm,
  InvoiceStatus,
} from '@/lib/types/invoice';
import {
  createDefaultInvoiceForm,
  createEmptyInvoiceLine,
} from '@/lib/types/invoice';
import type { Item } from '@/lib/types/item';
import type { PaymentMethod } from '@/lib/types/payment';
import {
  calculateInvoiceTotals,
  calculateLineItem,
} from '@/lib/utils/invoiceCalculations';
import {
  applyItemToLine,
  InvoiceForm,
} from '@/components/invoices/InvoiceForm';
import { InvoiceStatusBadge } from '@/components/invoices/InvoiceStatusBadge';
import { UnsavedChangesDialog } from '@/components/invoices/UnsavedChangesDialog';

export default function CreateInvoicePage() {
  const router = useRouter();
  const { showToast } = useToast();

  const [form, setForm] = useState<InvoiceFormState>(createDefaultInvoiceForm);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [invoiceNumber, setInvoiceNumber] = useState('…');
  const [isDirty, setIsDirty] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [customerError, setCustomerError] = useState<string | undefined>();
  const [itemsError, setItemsError] = useState<string | undefined>();
  const [paymentErrors, setPaymentErrors] = useState<
    Partial<Record<keyof InvoiceInitialPaymentForm, string>>
  >({});

  const [leaveDialogOpen, setLeaveDialogOpen] = useState(false);
  const [pendingHref, setPendingHref] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        // Peek only — the displayed number is never trusted on save.
        // The backend reserves the real next number atomically on create.
        const next = await invoiceNumberApi.peek();
        if (!cancelled) {
          setInvoiceNumber(next.invoiceNumber);
        }
      } catch {
        if (!cancelled) {
          setInvoiceNumber('INV-------');
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

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

  const statusForBadge: InvoiceStatus = form.status;

  const filledItems = useMemo(
    () => form.items.filter((item) => item.itemId),
    [form.items],
  );

  const previewTotals = useMemo(() => {
    const lines = filledItems.map((line) =>
      calculateLineItem({
        quantity: line.type === 'Service' ? 1 : line.quantity,
        unitPrice: line.unitPrice,
        discount: line.discount,
        taxRate: line.taxRate,
      }),
    );
    return calculateInvoiceTotals(lines);
  }, [filledItems]);

  const validate = (status: CreatableInvoiceStatus): boolean => {
    let valid = true;

    if (!form.customerId) {
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

    const nextPaymentErrors: Partial<Record<keyof InvoiceInitialPaymentForm, string>> = {};

    if (status === 'Paid') {
      if (previewTotals.grandTotal <= 0) {
        setItemsError('Paid invoices require a grand total greater than zero');
        valid = false;
      }
      if (!form.payment.paymentMethod) {
        nextPaymentErrors.paymentMethod = 'Payment method is required';
        valid = false;
      }
      if (!form.payment.paymentDate) {
        nextPaymentErrors.paymentDate = 'Payment date is required';
        valid = false;
      }
    }

    setPaymentErrors(nextPaymentErrors);
    return valid;
  };

  const buildPayload = (status: CreatableInvoiceStatus): CreateInvoicePayload => {
    const payload: CreateInvoicePayload = {
      customerId: form.customerId,
      invoiceDate: form.invoiceDate,
      dueDate: form.dueDate ? form.dueDate : null,
      status,
      notes: form.notes.trim() || null,
      terms: form.terms.trim() || null,
      items: filledItems.map((item) => ({
        itemId: item.itemId,
        quantity: item.type === 'Service' ? 1 : item.quantity,
        unit: item.unit.trim() || (item.type === 'Service' ? 'svc' : item.unit),
        unitPrice: item.unitPrice,
        discount: item.discount,
        taxRate: item.taxRate,
      })),
      payment: null,
    };

    if (status === 'Paid') {
      payload.payment = {
        paymentMethod: form.payment.paymentMethod as PaymentMethod,
        paymentDate: form.payment.paymentDate,
        referenceNumber: form.payment.referenceNumber.trim() || null,
        notes: form.payment.notes.trim() || null,
      };
    }

    return payload;
  };

  const saveInvoice = async (status: CreatableInvoiceStatus): Promise<void> => {
    if (isSubmitting) {
      return;
    }

    setForm((prev) => ({ ...prev, status }));

    if (!validate(status)) {
      return;
    }

    setIsSubmitting(true);
    setServerError(null);

    try {
      const response = await invoicesApi.create(buildPayload(status));
      setIsDirty(false);
      showToast(
        status === 'Draft'
          ? `Draft ${response.invoice.invoiceNumber} saved`
          : status === 'Paid'
            ? `Paid invoice ${response.invoice.invoiceNumber} created`
            : `Invoice ${response.invoice.invoiceNumber} created`,
      );
      router.push(status === 'Paid' ? `/invoices/view?id=${response.invoice.id}` : '/invoices');
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
            if (item.path === 'payment.paymentMethod') {
              setPaymentErrors((prev) => ({
                ...prev,
                paymentMethod: item.message,
              }));
            }
            if (item.path === 'payment.paymentDate') {
              setPaymentErrors((prev) => ({
                ...prev,
                paymentDate: item.message,
              }));
            }
          }
        }
      } else {
        setServerError('Unable to save invoice.');
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
    setForm((prev) => ({ ...prev, customerId: customer?.id ?? '' }));
    setCustomerError(undefined);
  };

  const handleFieldChange = <K extends keyof InvoiceFormState>(
    key: K,
    value: InvoiceFormState[K],
  ): void => {
    markDirty();
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      if (key === 'invoiceDate' && typeof value === 'string') {
        next.payment = {
          ...prev.payment,
          paymentDate: prev.payment.paymentDate || value,
        };
        // Keep payment date in sync with invoice date when creating a paid invoice
        // and the user hasn't customized it yet (still equals previous invoice date).
        if (
          prev.status === 'Paid' &&
          prev.payment.paymentDate === prev.invoiceDate
        ) {
          next.payment = { ...next.payment, paymentDate: value };
        }
      }
      if (key === 'status' && value === 'Paid') {
        next.payment = {
          ...prev.payment,
          paymentDate: prev.payment.paymentDate || prev.invoiceDate,
        };
        setPaymentErrors({});
      }
      return next;
    });
  };

  const handlePaymentChange = (patch: Partial<InvoiceInitialPaymentForm>): void => {
    markDirty();
    setForm((prev) => ({
      ...prev,
      payment: { ...prev.payment, ...patch },
    }));
    setPaymentErrors((prev) => {
      const next = { ...prev };
      if (patch.paymentMethod !== undefined) {
        delete next.paymentMethod;
      }
      if (patch.paymentDate !== undefined) {
        delete next.paymentDate;
      }
      return next;
    });
  };

  const handleLineChange = (key: string, patch: Partial<InvoiceLineForm>): void => {
    markDirty();
    setForm((prev) => ({
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
    }));
  };

  const handleSelectItem = (key: string, item: Item): void => {
    markDirty();
    setForm((prev) => ({
      ...prev,
      items: prev.items.map((line) =>
        line.key === key ? { ...line, ...applyItemToLine(item) } : line,
      ),
    }));
    setItemsError(undefined);
  };

  const handleAddRow = (): void => {
    markDirty();
    setForm((prev) => ({
      ...prev,
      items: [...prev.items, createEmptyInvoiceLine()],
    }));
  };

  const handleRemoveRow = (key: string): void => {
    markDirty();
    setForm((prev) => ({
      ...prev,
      items: prev.items.length <= 1 ? prev.items : prev.items.filter((line) => line.key !== key),
    }));
  };

  const primaryStatus: CreatableInvoiceStatus =
    form.status === 'Paid' ? 'Paid' : 'Unpaid';

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <button
            type="button"
            onClick={() => requestLeave('/invoices')}
            className="text-sm font-medium text-[#D32F2F] hover:text-[#B71C1C]"
          >
            ← Back to invoices
          </button>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <h2 className="text-2xl font-semibold text-[#111827]">Create Invoice</h2>
            <InvoiceStatusBadge status={statusForBadge} />
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
            {isSubmitting && form.status === 'Draft' ? 'Saving...' : 'Save Draft'}
          </button>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => {
              void saveInvoice(primaryStatus);
            }}
            className="rounded-md bg-[#D32F2F] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#B71C1C] disabled:opacity-60"
          >
            {isSubmitting && form.status === primaryStatus
              ? 'Saving...'
              : primaryStatus === 'Paid'
                ? 'Create Paid Invoice'
                : 'Save Invoice'}
          </button>
        </div>
      </div>

      <InvoiceForm
        form={form}
        selectedCustomer={selectedCustomer}
        invoiceNumber={invoiceNumber}
        disabled={isSubmitting}
        allowPaidStatus
        customerError={customerError}
        itemsError={itemsError}
        paymentErrors={paymentErrors}
        serverError={serverError}
        onCustomerChange={handleCustomerChange}
        onFieldChange={handleFieldChange}
        onPaymentChange={handlePaymentChange}
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
