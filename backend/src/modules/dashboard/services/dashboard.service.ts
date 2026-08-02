import { ApiError } from '../../../utils/ApiError';
import { findUserById } from '../../auth/repositories/user.repository';
import { getBusinessForUser } from '../../business/services/business.service';
import { Customer } from '../../customers/models/customer.model';
import { Item } from '../../items/models/item.model';
import { Invoice } from '../../invoices/models/invoice.model';
import { getInventorySummary } from '../../items/services/inventory.service';
import {
  DashboardBusinessSummary,
  DashboardData,
  DashboardInvoiceItem,
  DashboardOutstandingPaymentItem,
  DashboardStatistics,
} from '../types/dashboard.types';
import { Types } from 'mongoose';
import { roundMoney } from '../../invoices/utils/invoiceCalculations';

const emptyStatistics = (): DashboardStatistics => ({
  totalCustomers: 0,
  totalProductsAndServices: 0,
  totalInvoices: 0,
  todaysSales: 0,
  outstandingAmount: 0,
  totalRevenue: 0,
  inventoryProducts: 0,
  inventoryTracked: 0,
  inventoryOutOfStock: 0,
  inventoryLowStock: 0,
  inventoryTotalUnits: 0,
});

const getCustomerStatistics = async (businessId: string): Promise<number> => {
  return Customer.countDocuments({
    businessId: new Types.ObjectId(businessId),
    isDeleted: false,
  }).exec();
};

const getItemStatistics = async (businessId: string): Promise<number> => {
  return Item.countDocuments({
    businessId: new Types.ObjectId(businessId),
    isDeleted: false,
  }).exec();
};

const startOfToday = (): Date => {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
};

const getInvoiceStatistics = async (businessId: string): Promise<{
  totalInvoices: number;
  todaysSales: number;
  outstandingAmount: number;
  totalRevenue: number;
}> => {
  const businessObjectId = new Types.ObjectId(businessId);
  const today = startOfToday();

  const [totalInvoices, todaysSalesAgg, outstandingAgg, revenueAgg] = await Promise.all([
    Invoice.countDocuments({
      businessId: businessObjectId,
      isDeleted: { $ne: true },
    }).exec(),
    Invoice.aggregate<{ total: number }>([
      {
        $match: {
          businessId: businessObjectId,
          isDeleted: { $ne: true },
          status: { $nin: ['Draft', 'Cancelled'] },
          invoiceDate: { $gte: today },
        },
      },
      { $group: { _id: null, total: { $sum: '$grandTotal' } } },
    ]).exec(),
    Invoice.aggregate<{ total: number }>([
      {
        $match: {
          businessId: businessObjectId,
          isDeleted: { $ne: true },
          status: { $in: ['Unpaid', 'Partially Paid'] },
        },
      },
      {
        $group: {
          _id: null,
          total: {
            $sum: {
              $max: [
                {
                  $subtract: ['$grandTotal', { $ifNull: ['$totalPaid', 0] }],
                },
                0,
              ],
            },
          },
        },
      },
    ]).exec(),
    Invoice.aggregate<{ total: number }>([
      {
        $match: {
          businessId: businessObjectId,
          isDeleted: { $ne: true },
          status: { $in: ['Paid', 'Partially Paid'] },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: { $ifNull: ['$totalPaid', 0] } },
        },
      },
    ]).exec(),
  ]);

  return {
    totalInvoices,
    todaysSales: roundMoney(todaysSalesAgg[0]?.total ?? 0),
    outstandingAmount: roundMoney(outstandingAgg[0]?.total ?? 0),
    totalRevenue: roundMoney(revenueAgg[0]?.total ?? 0),
  };
};

const getRecentInvoices = async (
  businessId: string,
): Promise<DashboardInvoiceItem[]> => {
  const invoices = await Invoice.find({
    businessId: new Types.ObjectId(businessId),
    isDeleted: { $ne: true },
  })
    .sort({ createdAt: -1 })
    .limit(5)
    .exec();

  const customerIds = [...new Set(invoices.map((invoice) => invoice.customerId.toString()))];
  const customers = await Customer.find({ _id: { $in: customerIds } })
    .select('name')
    .exec();
  const customerMap = new Map(customers.map((customer) => [customer._id.toString(), customer]));

  return invoices.map((invoice) => ({
    id: invoice._id.toString(),
    invoiceNo: invoice.invoiceNumber,
    customer: customerMap.get(invoice.customerId.toString())?.name ?? '—',
    amount: invoice.grandTotal,
    status: invoice.status,
    date: invoice.invoiceDate.toISOString(),
  }));
};

const getOutstandingPayments = async (
  businessId: string,
): Promise<DashboardOutstandingPaymentItem[]> => {
  const invoices = await Invoice.find({
    businessId: new Types.ObjectId(businessId),
    isDeleted: { $ne: true },
    status: { $in: ['Unpaid', 'Partially Paid'] },
  })
    .sort({ dueDate: 1, invoiceDate: 1 })
    .limit(8)
    .exec();

  const customerIds = [...new Set(invoices.map((invoice) => invoice.customerId.toString()))];
  const customers = await Customer.find({ _id: { $in: customerIds } })
    .select('name')
    .exec();
  const customerMap = new Map(customers.map((customer) => [customer._id.toString(), customer]));

  return invoices.map((invoice) => {
    const outstanding = roundMoney(
      Math.max(invoice.grandTotal - (invoice.totalPaid ?? 0), 0),
    );

    return {
      id: invoice._id.toString(),
      customer: customerMap.get(invoice.customerId.toString())?.name ?? '—',
      invoice: invoice.invoiceNumber,
      amountDue: outstanding,
      dueDate: (invoice.dueDate ?? invoice.invoiceDate).toISOString(),
      status: invoice.paymentStatus ?? invoice.status,
    };
  });
};

const getRecentActivity = async (_businessId: string) => [];

export const getDashboardData = async (userId: string): Promise<DashboardData> => {
  const user = await findUserById(userId);

  if (!user) {
    throw new ApiError(401, 'Unauthorized');
  }

  if (!user.businessSetupCompleted || !user.businessId) {
    throw new ApiError(403, 'Business profile setup is required');
  }

  const business = await getBusinessForUser(userId);
  const businessId = business.id;

  const [
    totalCustomers,
    totalProductsAndServices,
    invoiceStats,
    recentActivity,
    recentInvoices,
    outstandingPayments,
    inventorySummary,
  ] = await Promise.all([
    getCustomerStatistics(businessId),
    getItemStatistics(businessId),
    getInvoiceStatistics(businessId),
    getRecentActivity(businessId),
    getRecentInvoices(businessId),
    getOutstandingPayments(businessId),
    getInventorySummary(businessId),
  ]);

  const statistics: DashboardStatistics = {
    ...emptyStatistics(),
    totalCustomers,
    totalProductsAndServices,
    totalInvoices: invoiceStats.totalInvoices,
    todaysSales: invoiceStats.todaysSales,
    outstandingAmount: invoiceStats.outstandingAmount,
    totalRevenue: invoiceStats.totalRevenue,
    inventoryProducts: inventorySummary.products,
    inventoryTracked: inventorySummary.trackedProducts,
    inventoryOutOfStock: inventorySummary.outOfStock,
    inventoryLowStock: inventorySummary.lowStock,
    inventoryTotalUnits: inventorySummary.totalStockUnits,
  };

  const businessSummary: DashboardBusinessSummary = {
    id: business.id,
    businessName: business.businessName,
    businessLogo: business.businessLogo,
    phone: business.phone,
    email: business.email,
    addressLine1: business.addressLine1,
    addressLine2: business.addressLine2,
    city: business.city,
    state: business.state,
    country: business.country,
    postalCode: business.postalCode,
    gstEnabled: business.gstEnabled,
    gstNumber: business.gstNumber,
    invoicePrefix: business.invoicePrefix,
    currency: business.currency,
    currencySymbol: business.currencySymbol,
  };

  return {
    statistics,
    business: businessSummary,
    recentActivity,
    recentInvoices,
    outstandingPayments,
    recentInventoryAdjustments: inventorySummary.recentAdjustments.map((row) => ({
      id: row.id,
      itemId: row.itemId,
      quantity: row.quantity,
      previousStock: row.previousStock,
      newStock: row.newStock,
      notes: row.notes,
      performedByName: row.performedByName,
      createdAt: row.createdAt.toISOString(),
    })),
  };
};
