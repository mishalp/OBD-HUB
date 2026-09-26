'use client';

import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react';
import Link from 'next/link';
import { Loader2, Search, UserPlus, X } from 'lucide-react';
import { customersApi } from '@/lib/api/customers';
import { ApiClientError } from '@/lib/api/client';
import type { Customer } from '@/lib/types/customer';
import { CustomerSearchEmptyState } from '@/components/invoices/CustomerSearchEmptyState';
import { QuickCreateCustomerModal } from '@/components/invoices/QuickCreateCustomerModal';
import { useToast } from '@/components/ui/Toast';
import { cn } from '@/lib/utils/cn';

interface CustomerSelectorProps {
  value: string;
  selectedCustomer: Customer | null;
  disabled?: boolean;
  error?: string;
  onChange: (customer: Customer | null) => void;
  /** Optional hook when the full CRM customer modal is preferred elsewhere. */
  onAddCustomer?: () => void;
}

export const CustomerSelector = ({
  value,
  selectedCustomer,
  disabled = false,
  error,
  onChange,
  onAddCustomer,
}: CustomerSelectorProps) => {
  const listId = useId();
  const { showToast } = useToast();
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [options, setOptions] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [highlightIndex, setHighlightIndex] = useState(0);
  const [quickCreateOpen, setQuickCreateOpen] = useState(false);
  const [quickCreateName, setQuickCreateName] = useState('');

  useEffect(() => {
    if (!open) {
      return;
    }

    let cancelled = false;
    const timer = window.setTimeout(() => {
      void (async () => {
        setIsLoading(true);
        setLoadError(null);

        try {
          const response = await customersApi.list({
            page: 1,
            limit: 20,
            search: search.trim(),
            sortBy: 'name',
            sortOrder: 'asc',
            status: 'active',
          });

          if (!cancelled) {
            setOptions(response.customers);
            setHighlightIndex(0);
          }
        } catch (err) {
          if (!cancelled) {
            setOptions([]);
            setLoadError(
              err instanceof ApiClientError ? err.message : 'Unable to load customers.',
            );
          }
        } finally {
          if (!cancelled) {
            setIsLoading(false);
          }
        }
      })();
    }, 250);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [open, search]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent): void => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const displayValue = open
    ? search
    : selectedCustomer
      ? `${selectedCustomer.name}${selectedCustomer.customerCode ? ` (${selectedCustomer.customerCode})` : ''}`
      : '';

  const selectCustomer = (customer: Customer): void => {
    onChange(customer);
    setSearch('');
    setOpen(false);
  };

  const openQuickCreate = (nameSeed?: string): void => {
    setQuickCreateName((nameSeed ?? search).trim());
    setOpen(false);
    setQuickCreateOpen(true);
  };

  const handleQuickCreated = (customer: Customer): void => {
    setQuickCreateOpen(false);
    selectCustomer(customer);
    // Refresh search cache so the new customer appears if the dropdown reopens.
    setOptions((prev) => {
      if (prev.some((item) => item.id === customer.id)) {
        return prev;
      }
      return [customer, ...prev];
    });
    showToast('Customer created successfully');
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>): void => {
    if (!open && (event.key === 'ArrowDown' || event.key === 'Enter')) {
      setOpen(true);
      return;
    }

    if (!open) {
      return;
    }

    const createRowActive = !isLoading && !loadError && options.length === 0;
    const maxIndex = createRowActive ? 0 : Math.max(options.length - 1, 0);

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setHighlightIndex((prev) => Math.min(prev + 1, maxIndex));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setHighlightIndex((prev) => Math.max(prev - 1, 0));
    } else if (event.key === 'Enter') {
      event.preventDefault();
      if (createRowActive) {
        if (search.trim().length >= 2) {
          openQuickCreate();
        }
        return;
      }
      const option = options[highlightIndex];
      if (option) {
        selectCustomer(option);
      }
    } else if (event.key === 'Escape') {
      setOpen(false);
      inputRef.current?.blur();
    }
  };

  return (
    <div className="space-y-3" ref={containerRef}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label className="text-sm font-medium text-[#111827]" htmlFor={`${listId}-input`}>
          Customer <span className="text-[#DC2626]">*</span>
        </label>
        <button
          type="button"
          onClick={() => {
            if (onAddCustomer) {
              onAddCustomer();
              return;
            }
            openQuickCreate(selectedCustomer?.name ?? search);
          }}
          disabled={disabled}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-[#D32F2F] transition hover:text-[#B71C1C] disabled:opacity-60"
        >
          <UserPlus className="h-4 w-4" aria-hidden />
          Add New Customer
        </button>
      </div>

      <div className="relative">
        <div className="relative">
          <Search
            className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-[#9CA3AF]"
            aria-hidden
          />
          <input
            ref={inputRef}
            id={`${listId}-input`}
            role="combobox"
            aria-expanded={open}
            aria-controls={`${listId}-list`}
            aria-autocomplete="list"
            aria-activedescendant={
              open && options[highlightIndex]
                ? `${listId}-option-${options[highlightIndex].id}`
                : undefined
            }
            disabled={disabled}
            value={displayValue}
            placeholder="Search by name, phone, email, or code"
            onFocus={() => {
              setOpen(true);
              setSearch(selectedCustomer?.name ?? '');
            }}
            onChange={(event) => {
              setSearch(event.target.value);
              setOpen(true);
              if (value) {
                onChange(null);
              }
            }}
            onKeyDown={handleKeyDown}
            className="ui-input h-11 pr-9 pl-11" // <-- Update pl-9 to pl-11 for better spacing
            style={{
              // Extra fallback for any custom non-tailwind override
              paddingLeft: '2.75rem', // 44px (11 * 4), enough for a 16px icon and buffer
            }}
          />
        </div>
        {selectedCustomer && !open ? (
          <button
            type="button"
            aria-label="Clear customer"
            disabled={disabled}
            onClick={() => {
              onChange(null);
              setSearch('');
              setOpen(true);
              inputRef.current?.focus();
            }}
            className="absolute top-1/2 right-2 -translate-y-1/2 rounded p-1 text-[#9CA3AF] transition hover:bg-[#F3F4F6] hover:text-[#111827]"
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}

        {open ? (
          <div
            id={`${listId}-list`}
            role="listbox"
            className="absolute z-30 mt-1 max-h-72 w-full overflow-y-auto rounded-xl border border-[#E5E7EB] bg-white shadow-lg"
          >
            {isLoading ? (
              <p className="flex items-center gap-2 px-3 py-3 text-sm text-[#6B7280]">
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                Searching…
              </p>
            ) : loadError ? (
              <p className="px-3 py-3 text-sm text-[#DC2626]">{loadError}</p>
            ) : options.length === 0 ? (
              <CustomerSearchEmptyState
                searchTerm={search}
                onCreate={() => openQuickCreate()}
                disabled={disabled}
              />
            ) : (
              options.map((customer, index) => (
                <button
                  key={customer.id}
                  id={`${listId}-option-${customer.id}`}
                  type="button"
                  role="option"
                  aria-selected={highlightIndex === index}
                  className={cn(
                    'flex w-full flex-col items-start px-3 py-2.5 text-left text-sm transition',
                    highlightIndex === index ? 'bg-[#FEF2F2]' : 'hover:bg-[#FAFAFA]',
                  )}
                  onMouseEnter={() => setHighlightIndex(index)}
                  onClick={() => selectCustomer(customer)}
                >
                  <span className="font-medium text-[#111827]">{customer.name}</span>
                  <span className="mt-0.5 text-[12px] text-[#6B7280]">
                    {customer.customerCode}
                    {customer.phone ? ` · ${customer.phone}` : ''}
                    {customer.email ? ` · ${customer.email}` : ''}
                  </span>
                </button>
              ))
            )}
          </div>
        ) : null}
      </div>

      {error ? <p className="text-sm text-[#DC2626]">{error}</p> : null}

      {selectedCustomer ? (
        <div className="rounded-xl border border-[#E5E7EB] bg-[#FAFAFA] p-3.5 text-sm text-[#374151]">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="font-medium text-[#111827]">{selectedCustomer.name}</p>
              <p className="mt-1 text-[13px] text-[#6B7280]">
                {selectedCustomer.customerCode}
                {selectedCustomer.phone ? ` · ${selectedCustomer.phone}` : ' · No phone'}
              </p>
              {selectedCustomer.email ? (
                <p className="text-[13px] text-[#6B7280]">{selectedCustomer.email}</p>
              ) : null}
              {selectedCustomer.city ? (
                <p className="text-[13px] text-[#6B7280]">{selectedCustomer.city}</p>
              ) : null}
            </div>
            <Link
              href={`/customers/view?id=${selectedCustomer.id}`}
              className="text-sm font-medium text-[#D32F2F] transition hover:text-[#B71C1C]"
              target="_blank"
            >
              View details
            </Link>
          </div>
        </div>
      ) : null}

      <QuickCreateCustomerModal
        open={quickCreateOpen}
        initialName={quickCreateName}
        onClose={() => setQuickCreateOpen(false)}
        onCreated={handleQuickCreated}
      />
    </div>
  );
};
