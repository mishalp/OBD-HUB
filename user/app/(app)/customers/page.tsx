'use client';

import { useEffect, useMemo, useState } from 'react';
import { customersApi } from '@/lib/api/customers';
import { ApiClientError } from '@/lib/api/client';
import { useToast } from '@/components/ui/Toast';
import type {
  Customer,
  CustomerFormValues,
  CustomerListQuery,
  CustomerPagination,
} from '@/lib/types/customer';
import {
  customerToFormValues,
  defaultCustomerFormValues,
} from '@/lib/types/customer';
import { CustomerSearchBar } from '@/components/customers/CustomerSearchBar';
import { CustomerFilter } from '@/components/customers/CustomerFilter';
import { CustomerTable } from '@/components/customers/CustomerTable';
import { CustomerTableSkeleton } from '@/components/customers/CustomerTableSkeleton';
import { CustomerModal } from '@/components/customers/CustomerModal';
import { DeleteConfirmationDialog } from '@/components/customers/DeleteConfirmationDialog';

export default function CustomersPage() {
  const { showToast } = useToast();

  const [query, setQuery] = useState<CustomerListQuery>({
    page: 1,
    limit: 10,
    search: '',
    sortBy: 'createdAt',
    sortOrder: 'desc',
    status: 'all',
  });
  const [searchInput, setSearchInput] = useState('');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [pagination, setPagination] = useState<CustomerPagination | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [reloadToken, setReloadToken] = useState(0);

  const [modalMode, setModalMode] = useState<'create' | 'edit' | null>(null);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formFieldErrors, setFormFieldErrors] = useState<{
    name?: string;
    phone?: string;
    email?: string;
  }>({});

  const [deleteTarget, setDeleteTarget] = useState<Customer | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const timer = window.setTimeout(() => {
      void (async () => {
        setIsLoading(true);
        setError(null);

        try {
          const response = await customersApi.list(query);
          if (!cancelled) {
            setCustomers(response.customers);
            setPagination(response.pagination);
          }
        } catch (err) {
          if (!cancelled) {
            if (err instanceof ApiClientError) {
              setError(err.message);
            } else {
              setError('Unable to load customers.');
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
  }, [query, reloadToken]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setQuery((prev) => ({
        ...prev,
        page: 1,
        search: searchInput.trim(),
      }));
    }, 350);

    return () => window.clearTimeout(timer);
  }, [searchInput]);

  const refreshCustomers = (): void => {
    setReloadToken((prev) => prev + 1);
  };

  const hasFilters = useMemo(
    () => Boolean(query.search) || query.status !== 'all',
    [query.search, query.status],
  );

  const openCreateModal = (): void => {
    setEditingCustomer(null);
    setFormError(null);
    setFormFieldErrors({});
    setModalMode('create');
  };

  const openEditModal = (customer: Customer): void => {
    setEditingCustomer(customer);
    setFormError(null);
    setFormFieldErrors({});
    setModalMode('edit');
  };

  const closeModal = (): void => {
    if (isSubmitting) {
      return;
    }
    setModalMode(null);
    setEditingCustomer(null);
    setFormError(null);
    setFormFieldErrors({});
  };

  const handleSort = (sortBy: CustomerListQuery['sortBy']): void => {
    setQuery((prev) => ({
      ...prev,
      page: 1,
      sortBy,
      sortOrder: prev.sortBy === sortBy && prev.sortOrder === 'asc' ? 'desc' : 'asc',
    }));
  };

  const handleSubmit = async (values: CustomerFormValues): Promise<void> => {
    setIsSubmitting(true);
    setFormError(null);
    setFormFieldErrors({});

    try {
      if (modalMode === 'edit' && editingCustomer) {
        await customersApi.update(editingCustomer.id, values);
        showToast('Customer updated successfully');
      } else {
        await customersApi.create(values);
        showToast('Customer created successfully');
      }

      closeModal();
      refreshCustomers();
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
        setFormError('Unable to save customer.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (): Promise<void> => {
    if (!deleteTarget) {
      return;
    }

    setIsDeleting(true);

    try {
      await customersApi.remove(deleteTarget.id);
      showToast('Customer deleted successfully');
      setDeleteTarget(null);
      refreshCustomers();
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

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-[#111827]">Customers</h2>
          <p className="mt-1 text-sm text-[#6B7280]">
            Manage customer records for your business.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreateModal}
          className="rounded-md bg-[#D32F2F] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#B71C1C]"
        >
          Add Customer
        </button>
      </div>

      <div className="flex flex-col gap-3 rounded-xl border border-[#E5E7EB] bg-white p-4 sm:flex-row sm:items-center">
        <div className="flex-1">
          <CustomerSearchBar value={searchInput} onChange={setSearchInput} />
        </div>
        <CustomerFilter
          status={query.status}
          onChange={(status) => setQuery((prev) => ({ ...prev, page: 1, status }))}
        />
        <button
          type="button"
          onClick={refreshCustomers}
          className="h-11 rounded-md border border-[#E5E7EB] px-4 text-sm font-medium text-[#111827] hover:bg-[#FAFAFA]"
        >
          Refresh
        </button>
      </div>

      {error ? (
        <div className="rounded-xl border border-[#FECACA] bg-[#FEF2F2] px-4 py-3 text-sm text-[#B91C1C]">
          {error}
        </div>
      ) : null}

      {isLoading ? (
        <CustomerTableSkeleton />
      ) : (
        <CustomerTable
          customers={customers}
          sortBy={query.sortBy}
          sortOrder={query.sortOrder}
          onSort={handleSort}
          onEdit={openEditModal}
          onDelete={setDeleteTarget}
          hasFilters={hasFilters}
        />
      )}

      {pagination && pagination.total > 0 ? (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-[#6B7280]">
            Showing page {pagination.page} of {pagination.totalPages} · {pagination.total}{' '}
            customers
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={!pagination.hasPrevPage}
              onClick={() => setQuery((prev) => ({ ...prev, page: prev.page - 1 }))}
              className="rounded-md border border-[#E5E7EB] px-3 py-2 text-sm font-medium text-[#111827] hover:bg-[#FAFAFA] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Previous
            </button>
            <button
              type="button"
              disabled={!pagination.hasNextPage}
              onClick={() => setQuery((prev) => ({ ...prev, page: prev.page + 1 }))}
              className="rounded-md border border-[#E5E7EB] px-3 py-2 text-sm font-medium text-[#111827] hover:bg-[#FAFAFA] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      ) : null}

      <CustomerModal
        open={modalMode !== null}
        title={modalMode === 'edit' ? 'Edit Customer' : 'Add Customer'}
        initialValues={
          editingCustomer ? customerToFormValues(editingCustomer) : defaultCustomerFormValues()
        }
        submitLabel={modalMode === 'edit' ? 'Save Changes' : 'Save Customer'}
        isSubmitting={isSubmitting}
        serverError={formError}
        fieldErrors={formFieldErrors}
        onClose={closeModal}
        onSubmit={handleSubmit}
      />

      <DeleteConfirmationDialog
        open={Boolean(deleteTarget)}
        customerName={deleteTarget?.name ?? ''}
        isDeleting={isDeleting}
        onCancel={() => {
          if (!isDeleting) {
            setDeleteTarget(null);
          }
        }}
        onConfirm={() => {
          void handleDelete();
        }}
      />
    </div>
  );
}
