'use client';

import { useId, useState, type FormEvent } from 'react';
import { Loader2 } from 'lucide-react';
import { customersApi } from '@/lib/api/customers';
import { ApiClientError } from '@/lib/api/client';
import type { Customer } from '@/lib/types/customer';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Input, Label, FieldHint } from '@/components/ui/Input';

interface QuickCreateCustomerModalProps {
  open: boolean;
  initialName: string;
  onClose: () => void;
  onCreated: (customer: Customer) => void;
}

type FieldErrors = {
  name?: string;
  phone?: string;
  email?: string;
  _form?: string;
};

const phonePattern = /^\+?[0-9\s\-()]{7,20}$/;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const QuickCreateCustomerForm = ({
  initialName,
  onClose,
  onCreated,
}: {
  initialName: string;
  onClose: () => void;
  onCreated: (customer: Customer) => void;
}) => {
  const formId = useId();
  const [name, setName] = useState(initialName);
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState<FieldErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [duplicateCustomers, setDuplicateCustomers] = useState<Customer[]>([]);
  const [awaitingDuplicateConfirm, setAwaitingDuplicateConfirm] = useState(false);

  const validate = (): FieldErrors => {
    const next: FieldErrors = {};
    const trimmedName = name.trim();

    if (trimmedName.length < 2) {
      next.name = 'Name must be at least 2 characters';
    } else if (trimmedName.length > 100) {
      next.name = 'Name must be at most 100 characters';
    }

    if (phone.trim() && !phonePattern.test(phone.trim())) {
      next.phone = 'Enter a valid phone number';
    }

    if (email.trim() && !emailPattern.test(email.trim())) {
      next.email = 'Enter a valid email address';
    }

    return next;
  };

  const findExactNameMatches = async (customerName: string): Promise<Customer[]> => {
    const response = await customersApi.list({
      page: 1,
      limit: 20,
      search: customerName,
      sortBy: 'name',
      sortOrder: 'asc',
      status: 'active',
    });

    const normalized = customerName.trim().toLowerCase();
    return response.customers.filter(
      (customer) => customer.name.trim().toLowerCase() === normalized,
    );
  };

  const createCustomer = async (): Promise<void> => {
    setIsSubmitting(true);
    setErrors({});

    try {
      const { customer } = await customersApi.quickCreate({
        name: name.trim(),
        phone: phone.trim() || null,
        email: email.trim() || null,
      });
      onCreated(customer);
    } catch (error) {
      if (error instanceof ApiClientError) {
        const fieldErrors: FieldErrors = {};
        for (const issue of error.errors ?? []) {
          if (issue.path === 'name' || issue.path === 'phone' || issue.path === 'email') {
            fieldErrors[issue.path] = issue.message;
          }
        }
        if (Object.keys(fieldErrors).length === 0) {
          fieldErrors._form = error.message;
        }
        setErrors(fieldErrors);
      } else {
        setErrors({ _form: 'Unable to create customer. Please try again.' });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    if (!awaitingDuplicateConfirm) {
      setIsSubmitting(true);
      setErrors({});

      try {
        const matches = await findExactNameMatches(name.trim());
        if (matches.length > 0) {
          setDuplicateCustomers(matches);
          setAwaitingDuplicateConfirm(true);
          return;
        }
      } catch {
        // If the duplicate check fails, still allow creation.
      } finally {
        setIsSubmitting(false);
      }
    }

    await createCustomer();
  };

  return (
    <Dialog
      open
      title="Create Customer"
      description="Only a name is required. You can add more details later."
      onClose={() => {
        if (!isSubmitting) {
          onClose();
        }
      }}
      className="max-w-md"
      footer={
        awaitingDuplicateConfirm ? null : (
          <>
            <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              type="submit"
              form={`${formId}-form`}
              loading={isSubmitting}
              disabled={isSubmitting}
            >
              Create Customer
            </Button>
          </>
        )
      }
    >
      {awaitingDuplicateConfirm ? (
        <div className="space-y-4">
          <div className="rounded-lg border border-[#FDE68A] bg-[#FFFBEB] px-3 py-2.5 text-sm text-[#92400E]">
            A customer with this name already exists.
          </div>

          <ul className="max-h-40 space-y-2 overflow-y-auto">
            {duplicateCustomers.map((customer) => (
              <li key={customer.id}>
                <button
                  type="button"
                  onClick={() => onCreated(customer)}
                  disabled={isSubmitting}
                  className="flex w-full flex-col rounded-lg border border-[#E5E7EB] px-3 py-2.5 text-left transition hover:border-[#D32F2F] hover:bg-[#FEF2F2]"
                >
                  <span className="text-sm font-medium text-[#111827]">{customer.name}</span>
                  <span className="mt-0.5 text-[12px] text-[#6B7280]">
                    {customer.customerCode}
                    {customer.phone ? ` · ${customer.phone}` : ''}
                    {customer.email ? ` · ${customer.email}` : ''}
                  </span>
                </button>
              </li>
            ))}
          </ul>

          <div className="flex flex-wrap justify-end gap-2 pt-1">
            <Button
              variant="secondary"
              onClick={() => {
                setAwaitingDuplicateConfirm(false);
                setDuplicateCustomers([]);
              }}
              disabled={isSubmitting}
            >
              Back
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                void createCustomer();
              }}
              loading={isSubmitting}
              disabled={isSubmitting}
            >
              Create Anyway
            </Button>
          </div>
        </div>
      ) : (
        <form id={`${formId}-form`} onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div>
            <Label htmlFor={`${formId}-name`} required>
              Customer Name
            </Label>
            <Input
              id={`${formId}-name`}
              value={name}
              onChange={(event) => {
                setName(event.target.value);
                setErrors((prev) => ({ ...prev, name: undefined, _form: undefined }));
              }}
              disabled={isSubmitting}
              autoFocus
              maxLength={100}
            />
            {errors.name ? <FieldHint error>{errors.name}</FieldHint> : null}
          </div>

          <div>
            <Label htmlFor={`${formId}-phone`}>Phone</Label>
            <Input
              id={`${formId}-phone`}
              type="tel"
              value={phone}
              onChange={(event) => {
                setPhone(event.target.value);
                setErrors((prev) => ({ ...prev, phone: undefined, _form: undefined }));
              }}
              disabled={isSubmitting}
              placeholder="Optional"
            />
            {errors.phone ? <FieldHint error>{errors.phone}</FieldHint> : null}
          </div>

          <div>
            <Label htmlFor={`${formId}-email`}>Email</Label>
            <Input
              id={`${formId}-email`}
              type="email"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                setErrors((prev) => ({ ...prev, email: undefined, _form: undefined }));
              }}
              disabled={isSubmitting}
              placeholder="Optional"
            />
            {errors.email ? <FieldHint error>{errors.email}</FieldHint> : null}
          </div>

          {errors._form ? (
            <div
              role="alert"
              className="rounded-lg border border-[#FECACA] bg-[#FEF2F2] px-3 py-2 text-sm text-[#B91C1C]"
            >
              {errors._form}
            </div>
          ) : null}

          {isSubmitting ? (
            <p className="flex items-center gap-2 text-[13px] text-[#6B7280]">
              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
              Creating customer…
            </p>
          ) : null}
        </form>
      )}
    </Dialog>
  );
};

export const QuickCreateCustomerModal = ({
  open,
  initialName,
  onClose,
  onCreated,
}: QuickCreateCustomerModalProps) => {
  if (!open) {
    return null;
  }

  // Remount whenever the modal opens so fields reset from `initialName`.
  return (
    <QuickCreateCustomerForm
      key={initialName}
      initialName={initialName}
      onClose={onClose}
      onCreated={onCreated}
    />
  );
};
