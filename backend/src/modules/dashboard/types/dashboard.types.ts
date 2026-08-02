export interface DashboardStatistics {
  totalCustomers: number;
  totalProductsAndServices: number;
  totalInvoices: number;
  todaysSales: number;
  outstandingAmount: number;
  totalRevenue: number;
  inventoryProducts: number;
  inventoryTracked: number;
  inventoryOutOfStock: number;
  inventoryLowStock: number;
  inventoryTotalUnits: number;
}

export interface DashboardInventoryAdjustment {
  id: string;
  itemId: string;
  quantity: number;
  previousStock: number;
  newStock: number;
  notes: string | null;
  performedByName: string | null;
  createdAt: string;
}

export interface DashboardBusinessSummary {
  id: string;
  businessName: string;
  businessLogo: string | null;
  phone: string;
  email: string;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  gstEnabled: boolean;
  gstNumber: string | null;
  invoicePrefix: string;
  currency: string;
  currencySymbol: string;
}

export interface DashboardActivityItem {
  id: string;
  type: string;
  title: string;
  description: string;
  createdAt: string;
}

export interface DashboardInvoiceItem {
  id: string;
  invoiceNo: string;
  customer: string;
  amount: number;
  status: string;
  date: string;
}

export interface DashboardOutstandingPaymentItem {
  id: string;
  customer: string;
  invoice: string;
  amountDue: number;
  dueDate: string;
  status: string;
}

export interface DashboardData {
  statistics: DashboardStatistics;
  business: DashboardBusinessSummary;
  recentActivity: DashboardActivityItem[];
  recentInvoices: DashboardInvoiceItem[];
  outstandingPayments: DashboardOutstandingPaymentItem[];
  recentInventoryAdjustments: DashboardInventoryAdjustment[];
}
