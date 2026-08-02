export interface Customer {
  id: string;
  businessId: string;
  customerCode: string;
  name: string;
  phone: string | null;
  email: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  postalCode: string | null;
  gstNumber: string | null;
  notes: string | null;
  avatar?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerDetails extends Customer {
  invoiceCount: number;
  totalSales: number;
  totalPaid: number;
  outstandingAmount: number;
}

export interface CustomerFormValues {
  name: string;
  phone: string;
  email: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  gstNumber: string;
  notes: string;
  isActive: boolean;
}

export interface CustomerListQuery {
  page: number;
  limit: number;
  search: string;
  sortBy: 'createdAt' | 'name' | 'phone' | 'email' | 'customerCode' | 'city';
  sortOrder: 'asc' | 'desc';
  status: 'all' | 'active' | 'inactive';
}

export interface CustomerPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface CustomerListResponse {
  customers: Customer[];
  pagination: CustomerPagination;
  meta: {
    search: string | null;
    sortBy: string;
    sortOrder: 'asc' | 'desc';
    status: 'all' | 'active' | 'inactive';
  };
}

export const defaultCustomerFormValues = (): CustomerFormValues => ({
  name: '',
  phone: '',
  email: '',
  addressLine1: '',
  addressLine2: '',
  city: '',
  state: '',
  country: 'India',
  postalCode: '',
  gstNumber: '',
  notes: '',
  isActive: true,
});

export const customerToFormValues = (customer: Customer): CustomerFormValues => ({
  name: customer.name,
  phone: customer.phone ?? '',
  email: customer.email ?? '',
  addressLine1: customer.addressLine1 ?? '',
  addressLine2: customer.addressLine2 ?? '',
  city: customer.city ?? '',
  state: customer.state ?? '',
  country: customer.country ?? '',
  postalCode: customer.postalCode ?? '',
  gstNumber: customer.gstNumber ?? '',
  notes: customer.notes ?? '',
  isActive: customer.isActive,
});
