'use client';

import { useEffect, useState } from 'react';
import { paymentsApi } from '@/lib/api/payments';
import { ApiClientError } from '@/lib/api/client';
import { useToast } from '@/components/ui/Toast';
import type { PaymentFormState, PaymentMethod } from '@/lib/types/payment';
import { createDefaultPaymentForm } from '@/lib/types/payment';
import {
  PaymentForm,
  type PayableInvoiceOption,
} from '@/components/payments/PaymentForm';

interface RecordPaymentModalProps {
  open: boolean;
  lockedInvoice?: PayableInvoiceOption | null;
  onClose: () => void;
  onSuccess: () => void;
}

const buildInitialForm = (lockedInvoice?: PayableInvoiceOption | null): PaymentFormState => {
  const defaults = createDefaultPaymentForm();
  if (!lockedInvoice) {
    return defaults;
  }

  return {
    ...defaults,
    invoiceId: lockedInvoice.id,
    amount: String(lockedInvoice.outstandingBalance),
  };
};

interface RecordPaymentModalContentProps {
  lockedInvoice?: PayableInvoiceOption | null;
  onClose: () => void;
  onSuccess: () => void;
}

const RecordPaymentModalContent = ({
  lockedInvoice = null,
  onClose,
  onSuccess,
}: RecordPaymentModalContentProps) => {
  const { showToast } = useToast();
  const [values, setValues] = useState<PaymentFormState>(() => buildInitialForm(lockedInvoice));
  const [errors, setErrors] = useState<Partial<Record<keyof PaymentFormState, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape' && !isSubmitting) {
        onClose();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isSubmitting, onClose]);

  const validate = (): boolean => {
    const nextErrors: Partial<Record<keyof PaymentFormState, string>> = {};

    if (!values.invoiceId) {
      nextErrors.invoiceId = 'Invoice is required';
    }

    const amount = Number(values.amount);
    if (!values.amount || Number.isNaN(amount) || amount <= 0) {
      nextErrors.amount = 'Amount must be greater than zero';
    }

    if (!values.paymentDate) {
      nextErrors.paymentDate = 'Payment date is required';
    }

    if (!values.paymentMethod) {
      nextErrors.paymentMethod = 'Payment method is required';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (): Promise<void> => {
    if (!validate()) {
      return;
    }

    setIsSubmitting(true);

    try {
      await paymentsApi.create({
        invoiceId: values.invoiceId,
        amount: Number(values.amount),
        paymentDate: values.paymentDate,
        paymentMethod: values.paymentMethod as PaymentMethod,
        referenceNumber: values.referenceNumber.trim() || null,
        notes: values.notes.trim() || null,
      });
      showToast('Payment recorded successfully');
      onSuccess();
      onClose();
    } catch (err) {
      showToast(
        err instanceof ApiClientError ? err.message : 'Unable to record payment.',
        'error',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-[#111111]/40 backdrop-blur-[2px]"
        aria-label="Close dialog"
        onClick={() => {
          if (!isSubmitting) {
            onClose();
          }
        }}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="record-payment-title"
        className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-[#E5E7EB] bg-white p-6 shadow-xl"
      >
        <div className="mb-5">
          <h2 id="record-payment-title" className="text-xl font-semibold text-[#111827]">
            Record Payment
          </h2>
          <p className="mt-1 text-sm text-[#6B7280]">
            Capture a full or partial payment against an invoice.
          </p>
        </div>

        <PaymentForm
          values={values}
          lockedInvoice={lockedInvoice}
          errors={errors}
          isSubmitting={isSubmitting}
          onChange={setValues}
          onSubmit={() => {
            void handleSubmit();
          }}
          onCancel={() => {
            if (!isSubmitting) {
              onClose();
            }
          }}
        />
      </div>
    </div>
  );
};

export const RecordPaymentModal = ({
  open,
  lockedInvoice = null,
  onClose,
  onSuccess,
}: RecordPaymentModalProps) => {
  if (!open) {
    return null;
  }

  return (
    <RecordPaymentModalContent
      key={lockedInvoice?.id ?? 'new-payment'}
      lockedInvoice={lockedInvoice}
      onClose={onClose}
      onSuccess={onSuccess}
    />
  );
};
