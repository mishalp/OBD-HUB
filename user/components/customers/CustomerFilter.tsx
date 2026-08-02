'use client';

interface CustomerFilterProps {
  status: 'all' | 'active' | 'inactive';
  onChange: (status: 'all' | 'active' | 'inactive') => void;
}

export const CustomerFilter = ({ status, onChange }: CustomerFilterProps) => {
  return (
    <select
      value={status}
      onChange={(event) => onChange(event.target.value as 'all' | 'active' | 'inactive')}
      className="h-11 rounded-md border border-[#E5E7EB] bg-white px-3 text-sm text-[#111827] outline-none focus:border-[#D32F2F] focus:ring-2 focus:ring-[#D32F2F]/20"
      aria-label="Filter by status"
    >
      <option value="all">All statuses</option>
      <option value="active">Active</option>
      <option value="inactive">Inactive</option>
    </select>
  );
};
