'use client';

import Link from 'next/link';
import type { Customer, CustomerListQuery } from '@/lib/types/customer';
import { CustomerStatusBadge } from '@/components/customers/CustomerStatusBadge';
import { EmptyState } from '@/components/dashboard/EmptyState';

interface CustomerTableProps {
  customers: Customer[];
  sortBy: CustomerListQuery['sortBy'];
  sortOrder: CustomerListQuery['sortOrder'];
  onSort: (sortBy: CustomerListQuery['sortBy']) => void;
  onEdit: (customer: Customer) => void;
  onDelete: (customer: Customer) => void;
  hasFilters: boolean;
}

const formatDate = (value: string): string => {
  return new Date(value).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

export const CustomerTable = ({
  customers,
  sortBy,
  sortOrder,
  onSort,
  onEdit,
  onDelete,
  hasFilters,
}: CustomerTableProps) => {
  if (customers.length === 0) {
    return (
      <EmptyState
        title={hasFilters ? 'No customers match your filters.' : 'No customers yet.'}
        description={
          hasFilters
            ? 'Try adjusting your search or status filter.'
            : 'Add your first customer to start building your CRM.'
        }
      />
    );
  }

  const renderSortLabel = (key: CustomerListQuery['sortBy'], label: string) => {
    const active = sortBy === key;
    return (
      <button
        type="button"
        onClick={() => onSort(key)}
        className="inline-flex items-center gap-1 font-semibold uppercase tracking-wide text-inherit hover:text-[#111827]"
      >
        {label}
        {active ? <span>{sortOrder === 'asc' ? '↑' : '↓'}</span> : null}
      </button>
    );
  };

  return (
    <div className="overflow-x-auto rounded-xl border border-[#E5E7EB] bg-white">
      <table className="min-w-full divide-y divide-[#E5E7EB] text-left text-sm">
        <thead className="sticky top-0 z-10 bg-[#FAFAFA] shadow-[inset_0_-1px_0_#E5E7EB]">
          <tr>
            <th className="px-4 py-3.5 text-xs font-semibold uppercase tracking-wide text-[#6B7280]">
              {renderSortLabel('customerCode', 'Customer Code')}
            </th>
            <th className="px-4 py-3.5 text-xs font-semibold uppercase tracking-wide text-[#6B7280]">
              {renderSortLabel('name', 'Name')}
            </th>
            <th className="px-4 py-3.5 text-xs font-semibold uppercase tracking-wide text-[#6B7280]">
              {renderSortLabel('phone', 'Phone')}
            </th>
            <th className="px-4 py-3.5 text-xs font-semibold uppercase tracking-wide text-[#6B7280]">
              {renderSortLabel('email', 'Email')}
            </th>
            <th className="px-4 py-3.5 text-xs font-semibold uppercase tracking-wide text-[#6B7280]">
              {renderSortLabel('city', 'City')}
            </th>
            <th className="px-4 py-3.5 text-xs font-semibold uppercase tracking-wide text-[#6B7280]">
              Status
            </th>
            <th className="px-4 py-3.5 text-xs font-semibold uppercase tracking-wide text-[#6B7280]">
              {renderSortLabel('createdAt', 'Created Date')}
            </th>
            <th className="px-4 py-3.5 text-xs font-semibold uppercase tracking-wide text-[#6B7280]">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#E5E7EB]">
          {customers.map((customer) => (
            <tr key={customer.id} className="transition-colors hover:bg-[#FAFAFA]">
              <td className="px-4 py-3.5 font-medium text-[#111827]">{customer.customerCode}</td>
              <td className="px-4 py-3.5 text-[#111827]">{customer.name}</td>
              <td className="px-4 py-3.5 text-[#374151]">{customer.phone || '—'}</td>
              <td className="px-4 py-3.5 text-[#374151]">{customer.email || '—'}</td>
              <td className="px-4 py-3.5 text-[#374151]">{customer.city || '—'}</td>
              <td className="px-4 py-3.5">
                <CustomerStatusBadge isActive={customer.isActive} />
              </td>
              <td className="px-4 py-3.5 text-[#374151]">{formatDate(customer.createdAt)}</td>
              <td className="px-4 py-3.5">
                <div className="flex items-center gap-2">
                  <Link
                    href={`/customers/view?id=${customer.id}`}
                    className="rounded-md border border-[#E5E7EB] px-2 py-1 text-xs font-medium text-[#D32F2F] hover:bg-[#FEF2F2]"
                  >
                    View
                  </Link>
                  <button
                    type="button"
                    onClick={() => onEdit(customer)}
                    className="rounded-md border border-[#E5E7EB] px-2 py-1 text-xs font-medium text-[#374151] hover:bg-[#FAFAFA]"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(customer)}
                    className="rounded-md border border-[#FECACA] px-2 py-1 text-xs font-medium text-[#DC2626] hover:bg-[#FEF2F2]"
                  >
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
