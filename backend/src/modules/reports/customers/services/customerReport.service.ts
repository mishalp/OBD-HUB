import { Types } from 'mongoose';
import { Customer } from '../../../customers/models/customer.model';
import { Invoice } from '../../../invoices/models/invoice.model';
import { Payment } from '../../../payments/models/payment.model';
import { roundMoney } from '../../../invoices/utils/invoiceCalculations';
import { ApiError } from '../../../../utils/ApiError';
import { resolveDateRange } from '../../shared/reportDateRange';
import {
  CustomerDetailQuery,
  CustomerListQuery,
  CustomerSummaryQuery,
  CustomerTopQuery,
} from '../validators/customerReport.validator';
import {
  AcquisitionTrendPoint,
  CustomerDetailReportResult,
  CustomerReportListItem,
  CustomerReportListResult,
  CustomerReportStatus,
  CustomerReportSummaryResult,
  CustomerReportTopResult,
  CustomerRevenueTrendPoint,
  PurchaseFrequencyBucket,
  PurchaseTimelineItem,
  RecentInvoiceItem,
  RecentPaymentItem,
  ReportDateRangeMeta,
  RevenueByCustomerPoint,
} from '../types/customerReport.types';

const SALES_INVOICE_STATUSES = ['Unpaid', 'Partially Paid', 'Paid'] as const;

const buildMeta = (
  period: string,
  range: { from: Date; to: Date },
): ReportDateRangeMeta => ({
  period,
  fromDate: range.from.toISOString(),
  toDate: range.to.toISOString(),
});

const salesInvoiceMatch = (
  businessObjectId: Types.ObjectId,
  range: { from: Date; to: Date },
  customerId?: Types.ObjectId,
): Record<string, unknown> => {
  const match: Record<string, unknown> = {
    businessId: businessObjectId,
    isDeleted: { $ne: true },
    status: { $in: [...SALES_INVOICE_STATUSES] },
    invoiceDate: { $gte: range.from, $lte: range.to },
  };

  if (customerId) {
    match.customerId = customerId;
  }

  return match;
};

const deriveCustomerStatus = (input: {
  createdAt: Date;
  invoiceCount: number;
  rangeFrom: Date;
  rangeTo: Date;
}): CustomerReportStatus => {
  const isNew =
    input.createdAt >= input.rangeFrom && input.createdAt <= input.rangeTo;

  if (input.invoiceCount === 0) {
    return isNew ? 'new' : 'inactive';
  }

  if (input.invoiceCount >= 2) {
    return 'repeat';
  }

  return isNew ? 'new' : 'active';
};

const purchaseFrequencyBuckets = (invoiceCounts: number[]): PurchaseFrequencyBucket[] => {
  const buckets = [
    { label: '0 invoices', count: 0 },
    { label: '1 invoice', count: 0 },
    { label: '2–3 invoices', count: 0 },
    { label: '4–5 invoices', count: 0 },
    { label: '6+ invoices', count: 0 },
  ];

  for (const count of invoiceCounts) {
    if (count <= 0) {
      buckets[0].count += 1;
    } else if (count === 1) {
      buckets[1].count += 1;
    } else if (count <= 3) {
      buckets[2].count += 1;
    } else if (count <= 5) {
      buckets[3].count += 1;
    } else {
      buckets[4].count += 1;
    }
  }

  return buckets;
};

type CustomerMetricsRow = {
  _id: Types.ObjectId;
  customerCode: string;
  name: string;
  phone: string | null;
  email: string | null;
  isActive: boolean;
  createdAt: Date;
  invoiceCount: number;
  revenue: number;
  outstandingAmount: number;
  lastPurchaseDate: Date | null;
};

const buildCustomerMetricsPipeline = (
  businessObjectId: Types.ObjectId,
  range: { from: Date; to: Date },
  options: {
    search?: string;
    status?: 'all' | 'active' | 'inactive';
  } = {},
) => {
  const customerMatch: Record<string, unknown> = {
    businessId: businessObjectId,
    isDeleted: { $ne: true },
  };

  if (options.status === 'active') {
    customerMatch.isActive = true;
  } else if (options.status === 'inactive') {
    customerMatch.isActive = false;
  }

  if (options.search && options.search.trim()) {
    const escaped = options.search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escaped, 'i');
    customerMatch.$or = [
      { name: regex },
      { phone: regex },
      { email: regex },
      { customerCode: regex },
    ];
  }

  return [
    { $match: customerMatch },
    {
      $lookup: {
        from: 'invoices',
        let: { customerId: '$_id' },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ['$customerId', '$$customerId'] },
                  { $eq: ['$businessId', businessObjectId] },
                  { $ne: ['$isDeleted', true] },
                  { $in: ['$status', [...SALES_INVOICE_STATUSES]] },
                  { $gte: ['$invoiceDate', range.from] },
                  { $lte: ['$invoiceDate', range.to] },
                ],
              },
            },
          },
          {
            $project: {
              grandTotal: 1,
              totalPaid: 1,
              invoiceDate: 1,
            },
          },
        ],
        as: 'periodInvoices',
      },
    },
    {
      $addFields: {
        invoiceCount: { $size: '$periodInvoices' },
        revenue: { $sum: '$periodInvoices.grandTotal' },
        outstandingAmount: {
          $sum: {
            $map: {
              input: '$periodInvoices',
              as: 'inv',
              in: {
                $max: [
                  {
                    $subtract: ['$$inv.grandTotal', { $ifNull: ['$$inv.totalPaid', 0] }],
                  },
                  0,
                ],
              },
            },
          },
        },
        lastPurchaseDate: { $max: '$periodInvoices.invoiceDate' },
      },
    },
    {
      $project: {
        _id: 1,
        customerCode: 1,
        name: 1,
        phone: 1,
        email: 1,
        isActive: 1,
        createdAt: 1,
        invoiceCount: 1,
        revenue: 1,
        outstandingAmount: 1,
        lastPurchaseDate: 1,
      },
    },
  ];
};

const toListItem = (
  row: CustomerMetricsRow,
  range: { from: Date; to: Date },
): CustomerReportListItem => {
  const revenue = roundMoney(row.revenue ?? 0);
  const invoiceCount = row.invoiceCount ?? 0;

  return {
    customerId: row._id.toString(),
    customerCode: row.customerCode,
    name: row.name,
    phone: row.phone,
    email: row.email,
    isActive: row.isActive,
    customerStatus: deriveCustomerStatus({
      createdAt: row.createdAt,
      invoiceCount,
      rangeFrom: range.from,
      rangeTo: range.to,
    }),
    invoiceCount,
    revenue,
    outstandingAmount: roundMoney(row.outstandingAmount ?? 0),
    averageInvoiceValue: invoiceCount > 0 ? roundMoney(revenue / invoiceCount) : 0,
    lastPurchaseDate: row.lastPurchaseDate
      ? new Date(row.lastPurchaseDate).toISOString()
      : null,
    createdAt: new Date(row.createdAt).toISOString(),
  };
};

export const getCustomerSummary = async (
  businessId: string,
  query: CustomerSummaryQuery,
): Promise<CustomerReportSummaryResult> => {
  const businessObjectId = new Types.ObjectId(businessId);
  const range = resolveDateRange(query.period, query.fromDate, query.toDate);

  const [metricsRows, acquisitionRows, invoiceAgg] = await Promise.all([
    Customer.aggregate<CustomerMetricsRow>(
      buildCustomerMetricsPipeline(businessObjectId, range),
    ).exec(),
    Customer.aggregate<{ _id: Date; count: number }>([
      {
        $match: {
          businessId: businessObjectId,
          isDeleted: { $ne: true },
          createdAt: { $gte: range.from, $lte: range.to },
        },
      },
      {
        $group: {
          _id: { $dateTrunc: { date: '$createdAt', unit: 'day' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]).exec(),
    Invoice.aggregate<{
      invoiceCount: number;
      totalRevenue: number;
      outstandingAmount: number;
    }>([
      { $match: salesInvoiceMatch(businessObjectId, range) },
      {
        $group: {
          _id: null,
          invoiceCount: { $sum: 1 },
          totalRevenue: { $sum: '$grandTotal' },
          outstandingAmount: {
            $sum: {
              $max: [
                { $subtract: ['$grandTotal', { $ifNull: ['$totalPaid', 0] }] },
                0,
              ],
            },
          },
        },
      },
    ]).exec(),
  ]);

  const totalCustomers = metricsRows.length;
  let newCustomers = 0;
  let activeCustomers = 0;
  let inactiveCustomers = 0;
  let repeatCustomers = 0;

  for (const row of metricsRows) {
    if (row.createdAt >= range.from && row.createdAt <= range.to) {
      newCustomers += 1;
    }

    if (row.invoiceCount > 0) {
      activeCustomers += 1;
    } else {
      inactiveCustomers += 1;
    }

    if (row.invoiceCount >= 2) {
      repeatCustomers += 1;
    }
  }

  const invoiceStats = invoiceAgg[0];
  const totalRevenue = roundMoney(invoiceStats?.totalRevenue ?? 0);
  const invoiceCount = invoiceStats?.invoiceCount ?? 0;
  const outstandingAmount = roundMoney(invoiceStats?.outstandingAmount ?? 0);

  const revenueByCustomer: RevenueByCustomerPoint[] = [...metricsRows]
    .filter((row) => (row.revenue ?? 0) > 0)
    .sort((a, b) => (b.revenue ?? 0) - (a.revenue ?? 0))
    .slice(0, 10)
    .map((row) => ({
      customerId: row._id.toString(),
      name: row.name,
      revenue: roundMoney(row.revenue ?? 0),
    }));

  const acquisitionTrend: AcquisitionTrendPoint[] = acquisitionRows.map((row) => ({
    date: new Date(row._id).toISOString(),
    count: row.count,
  }));

  return {
    summary: {
      totalCustomers,
      newCustomers,
      activeCustomers,
      inactiveCustomers,
      repeatCustomers,
      totalRevenue,
      averageRevenuePerCustomer:
        activeCustomers > 0 ? roundMoney(totalRevenue / activeCustomers) : 0,
      outstandingAmount,
      averageInvoiceValue: invoiceCount > 0 ? roundMoney(totalRevenue / invoiceCount) : 0,
      averagePaymentTime: null,
      invoiceCount,
    },
    charts: {
      acquisitionTrend,
      revenueByCustomer,
      purchaseFrequency: purchaseFrequencyBuckets(
        metricsRows.map((row) => row.invoiceCount ?? 0),
      ),
    },
    meta: buildMeta(query.period, range),
  };
};

export const listCustomerReports = async (
  businessId: string,
  query: CustomerListQuery,
): Promise<CustomerReportListResult> => {
  const businessObjectId = new Types.ObjectId(businessId);
  const range = resolveDateRange(query.period, query.fromDate, query.toDate);

  const rows = await Customer.aggregate<CustomerMetricsRow>(
    buildCustomerMetricsPipeline(businessObjectId, range, {
      search: query.search,
      status: query.status,
    }),
  ).exec();

  let items = rows.map((row) => toListItem(row, range));

  if (query.customerType !== 'all') {
    items = items.filter((item) => item.customerStatus === query.customerType);
  }

  if (query.outstandingOnly) {
    items = items.filter((item) => item.outstandingAmount > 0);
  }

  if (query.minRevenue !== undefined) {
    items = items.filter((item) => item.revenue >= query.minRevenue!);
  }

  if (query.maxRevenue !== undefined) {
    items = items.filter((item) => item.revenue <= query.maxRevenue!);
  }

  const sortMultiplier = query.sortOrder === 'asc' ? 1 : -1;
  items.sort((a, b) => {
    const key = query.sortBy;
    const left = a[key];
    const right = b[key];

    if (left === null || left === undefined) {
      return 1 * sortMultiplier;
    }
    if (right === null || right === undefined) {
      return -1 * sortMultiplier;
    }

    if (typeof left === 'string' && typeof right === 'string') {
      return left.localeCompare(right) * sortMultiplier;
    }

    return ((left as number) - (right as number)) * sortMultiplier;
  });

  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / query.limit));
  const page = Math.min(query.page, totalPages);
  const start = (page - 1) * query.limit;
  const paged = items.slice(start, start + query.limit);

  return {
    customers: paged,
    pagination: {
      page,
      limit: query.limit,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
    meta: {
      ...buildMeta(query.period, range),
      search: query.search || null,
      status: query.status,
      customerType: query.customerType,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
      outstandingOnly: query.outstandingOnly,
    },
  };
};

export const getTopCustomersReport = async (
  businessId: string,
  query: CustomerTopQuery,
): Promise<CustomerReportTopResult> => {
  const businessObjectId = new Types.ObjectId(businessId);
  const range = resolveDateRange(query.period, query.fromDate, query.toDate);

  const rows = await Invoice.aggregate<{
    _id: Types.ObjectId;
    revenue: number;
    invoiceCount: number;
    outstandingAmount: number;
    lastPurchaseDate: Date | null;
    customer: {
      customerCode?: string;
      name?: string;
      phone?: string | null;
      isDeleted?: boolean;
    } | null;
  }>([
    { $match: salesInvoiceMatch(businessObjectId, range) },
    {
      $group: {
        _id: '$customerId',
        revenue: { $sum: '$grandTotal' },
        invoiceCount: { $sum: 1 },
        outstandingAmount: {
          $sum: {
            $max: [
              { $subtract: ['$grandTotal', { $ifNull: ['$totalPaid', 0] }] },
              0,
            ],
          },
        },
        lastPurchaseDate: { $max: '$invoiceDate' },
      },
    },
    { $sort: { revenue: -1, invoiceCount: -1 } },
    { $limit: query.limit },
    {
      $lookup: {
        from: 'customers',
        localField: '_id',
        foreignField: '_id',
        as: 'customer',
      },
    },
    {
      $project: {
        _id: 1,
        revenue: 1,
        invoiceCount: 1,
        outstandingAmount: 1,
        lastPurchaseDate: 1,
        customer: { $arrayElemAt: ['$customer', 0] },
      },
    },
  ]).exec();

  return {
    customers: rows
      .filter((row) => row.customer && row.customer.isDeleted !== true)
      .map((row) => {
        const revenue = roundMoney(row.revenue);
        return {
          customerId: row._id.toString(),
          customerCode: row.customer?.customerCode ?? '',
          name: row.customer?.name ?? 'Unknown customer',
          phone: row.customer?.phone ?? null,
          revenue,
          invoiceCount: row.invoiceCount,
          outstandingAmount: roundMoney(row.outstandingAmount),
          averageInvoiceValue:
            row.invoiceCount > 0 ? roundMoney(revenue / row.invoiceCount) : 0,
          lastPurchaseDate: row.lastPurchaseDate
            ? new Date(row.lastPurchaseDate).toISOString()
            : null,
        };
      }),
    meta: { ...buildMeta(query.period, range), limit: query.limit },
  };
};

export const getCustomerDetailReport = async (
  businessId: string,
  customerId: string,
  query: CustomerDetailQuery,
): Promise<CustomerDetailReportResult> => {
  const businessObjectId = new Types.ObjectId(businessId);
  const customerObjectId = new Types.ObjectId(customerId);
  const range = resolveDateRange(query.period, query.fromDate, query.toDate);

  const customer = await Customer.findOne({
    _id: customerObjectId,
    businessId: businessObjectId,
    isDeleted: { $ne: true },
  }).lean();

  if (!customer) {
    throw new ApiError(404, 'Customer not found');
  }

  const [periodInvoices, lifetimeAgg, payments] = await Promise.all([
    Invoice.find(salesInvoiceMatch(businessObjectId, range, customerObjectId))
      .sort({ invoiceDate: -1 })
      .lean()
      .exec(),
    Invoice.aggregate<{
      revenue: number;
      invoiceCount: number;
      outstandingAmount: number;
      draftCount: number;
      paidCount: number;
      unpaidCount: number;
      partiallyPaidCount: number;
    }>([
      {
        $match: {
          businessId: businessObjectId,
          customerId: customerObjectId,
          isDeleted: { $ne: true },
        },
      },
      {
        $group: {
          _id: null,
          revenue: {
            $sum: {
              $cond: [
                { $in: ['$status', [...SALES_INVOICE_STATUSES]] },
                '$grandTotal',
                0,
              ],
            },
          },
          invoiceCount: {
            $sum: {
              $cond: [{ $in: ['$status', [...SALES_INVOICE_STATUSES]] }, 1, 0],
            },
          },
          outstandingAmount: {
            $sum: {
              $cond: [
                { $in: ['$status', [...SALES_INVOICE_STATUSES]] },
                {
                  $max: [
                    { $subtract: ['$grandTotal', { $ifNull: ['$totalPaid', 0] }] },
                    0,
                  ],
                },
                0,
              ],
            },
          },
          draftCount: {
            $sum: { $cond: [{ $eq: ['$status', 'Draft'] }, 1, 0] },
          },
          paidCount: {
            $sum: { $cond: [{ $eq: ['$status', 'Paid'] }, 1, 0] },
          },
          unpaidCount: {
            $sum: { $cond: [{ $eq: ['$status', 'Unpaid'] }, 1, 0] },
          },
          partiallyPaidCount: {
            $sum: { $cond: [{ $eq: ['$status', 'Partially Paid'] }, 1, 0] },
          },
        },
      },
    ]).exec(),
    Payment.find({
      businessId: businessObjectId,
      customerId: customerObjectId,
      paymentDate: { $gte: range.from, $lte: range.to },
    })
      .sort({ paymentDate: -1 })
      .populate('invoiceId', 'invoiceNumber')
      .lean()
      .exec(),
  ]);

  const lifetime = lifetimeAgg[0];
  const lifetimeValue = roundMoney(lifetime?.revenue ?? 0);

  const periodRevenue = roundMoney(
    periodInvoices.reduce((sum, invoice) => sum + invoice.grandTotal, 0),
  );
  const periodInvoiceCount = periodInvoices.length;
  const periodOutstanding = roundMoney(
    periodInvoices.reduce(
      (sum, invoice) =>
        sum + Math.max(invoice.grandTotal - (invoice.totalPaid ?? 0), 0),
      0,
    ),
  );

  const totalCollected = roundMoney(
    payments.reduce((sum, payment) => sum + payment.amount, 0),
  );

  const customerStatus = deriveCustomerStatus({
    createdAt: customer.createdAt,
    invoiceCount: periodInvoiceCount,
    rangeFrom: range.from,
    rangeTo: range.to,
  });

  const recentInvoices: RecentInvoiceItem[] = periodInvoices.slice(0, 10).map((invoice) => ({
    id: invoice._id.toString(),
    invoiceNumber: invoice.invoiceNumber,
    invoiceDate: new Date(invoice.invoiceDate).toISOString(),
    status: invoice.status,
    grandTotal: roundMoney(invoice.grandTotal),
    outstandingBalance: roundMoney(
      Math.max(invoice.grandTotal - (invoice.totalPaid ?? 0), 0),
    ),
  }));

  const recentPayments: RecentPaymentItem[] = payments.slice(0, 10).map((payment) => {
    const invoice = payment.invoiceId as
      | { invoiceNumber?: string }
      | Types.ObjectId
      | null;

    return {
      id: payment._id.toString(),
      paymentNumber: payment.paymentNumber,
      paymentDate: new Date(payment.paymentDate).toISOString(),
      amount: roundMoney(payment.amount),
      paymentMethod: payment.paymentMethod,
      invoiceNumber:
        invoice && typeof invoice === 'object' && 'invoiceNumber' in invoice
          ? (invoice.invoiceNumber ?? null)
          : null,
    };
  });

  const timeline: PurchaseTimelineItem[] = [
    ...periodInvoices.map((invoice) => ({
      date: new Date(invoice.invoiceDate).toISOString(),
      type: 'invoice' as const,
      label: invoice.invoiceNumber,
      amount: roundMoney(invoice.grandTotal),
      referenceId: invoice._id.toString(),
      status: invoice.status,
    })),
    ...payments.map((payment) => ({
      date: new Date(payment.paymentDate).toISOString(),
      type: 'payment' as const,
      label: payment.paymentNumber,
      amount: roundMoney(payment.amount),
      referenceId: payment._id.toString(),
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const trendMap = new Map<string, CustomerRevenueTrendPoint>();
  for (const invoice of periodInvoices) {
    const day = new Date(invoice.invoiceDate);
    day.setHours(0, 0, 0, 0);
    const key = day.toISOString();
    const existing = trendMap.get(key) ?? {
      date: key,
      grossSales: 0,
      collectedAmount: 0,
      outstandingAmount: 0,
      invoiceCount: 0,
    };

    const paid = invoice.totalPaid ?? 0;
    existing.grossSales = roundMoney(existing.grossSales + invoice.grandTotal);
    existing.collectedAmount = roundMoney(existing.collectedAmount + paid);
    existing.outstandingAmount = roundMoney(
      existing.outstandingAmount + Math.max(invoice.grandTotal - paid, 0),
    );
    existing.invoiceCount += 1;
    trendMap.set(key, existing);
  }

  const revenueTrend = Array.from(trendMap.values()).sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );

  return {
    customer: {
      id: customer._id.toString(),
      customerCode: customer.customerCode,
      name: customer.name,
      phone: customer.phone,
      email: customer.email,
      city: customer.city,
      state: customer.state,
      country: customer.country,
      gstNumber: customer.gstNumber,
      isActive: customer.isActive,
      createdAt: new Date(customer.createdAt).toISOString(),
    },
    customerStatus,
    lifetimeValue,
    invoiceSummary: {
      invoiceCount: periodInvoiceCount,
      revenue: periodRevenue,
      averageInvoiceValue:
        periodInvoiceCount > 0 ? roundMoney(periodRevenue / periodInvoiceCount) : 0,
      draftCount: lifetime?.draftCount ?? 0,
      paidCount: periodInvoices.filter((invoice) => invoice.status === 'Paid').length,
      unpaidCount: periodInvoices.filter((invoice) => invoice.status === 'Unpaid').length,
      partiallyPaidCount: periodInvoices.filter(
        (invoice) => invoice.status === 'Partially Paid',
      ).length,
    },
    paymentSummary: {
      paymentCount: payments.length,
      totalCollected,
      averagePayment:
        payments.length > 0 ? roundMoney(totalCollected / payments.length) : 0,
      averagePaymentTime: null,
    },
    outstandingSummary: {
      outstandingAmount: periodOutstanding,
      outstandingInvoiceCount: periodInvoices.filter(
        (invoice) => Math.max(invoice.grandTotal - (invoice.totalPaid ?? 0), 0) > 0,
      ).length,
    },
    purchaseTimeline: timeline.slice(0, 50),
    recentInvoices,
    recentPayments,
    revenueTrend,
    meta: buildMeta(query.period, range),
  };
};
