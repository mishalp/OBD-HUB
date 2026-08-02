export interface SafeCustomer {
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
  avatar: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CustomerDetails extends SafeCustomer {
  invoiceCount: number;
  totalSales: number;
  totalPaid: number;
  outstandingAmount: number;
}

export interface CustomerPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface CustomerListResult {
  customers: SafeCustomer[];
  pagination: CustomerPagination;
  meta: {
    search: string | null;
    sortBy: string;
    sortOrder: 'asc' | 'desc';
    status: 'all' | 'active' | 'inactive';
  };
}
