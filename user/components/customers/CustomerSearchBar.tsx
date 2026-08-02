'use client';

interface CustomerSearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export const CustomerSearchBar = ({
  value,
  onChange,
  placeholder = 'Search by name, phone, email, or code',
}: CustomerSearchBarProps) => {
  return (
    <input
      type="search"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      className="h-11 w-full rounded-md border border-[#E5E7EB] bg-white px-3 text-sm text-[#111827] outline-none transition focus:border-[#D32F2F] focus:ring-2 focus:ring-[#D32F2F]/20"
      aria-label="Search customers"
    />
  );
};
