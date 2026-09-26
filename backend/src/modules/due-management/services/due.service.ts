import { Types } from 'mongoose';
import { ApiError } from '../../../utils/ApiError';
import { Customer } from '../../customers/models/customer.model';
import { Invoice } from '../../invoices/models/invoice.model';
import { calculateOutstandingBalance } from '../../invoices/utils/invoicePaymentBalance';
import { roundMoney } from '../../invoices/utils/invoiceCalculations';
import { listPaymentsForInvoice } from '../../payments/services/payment.service';
import { ListDuesQuery } from '../validators/due.validator';
import {
  AgeingBucketSummary,
  DueDetails,
  DueListItem,
  DueListResult,
  DueSummary,
  TopOutstandingCustomer,
} from '../types/due.types';
import {
  AGEING_BUCKETS,
  AgeingBucket,
  calculateAgeingBucket,
  calculateDaysOutstanding,
  calculateDaysOverdue,
  calculateDueStatus,
  DueStatus,
  endOfDay,
  startOfDay,
} from '../utils/dueCalculations';

const escapeRegex = (value: string): string =>
  value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const parseDate = (value: string): Date | null => {
  if (!value) {
    return null;
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const emptyAgeingBuckets = (): AgeingBucketSummary[] =>
  AGEING_BUCKETS.map((bucket) => ({
    bucket,
    invoiceCount: 0,
    outstandingAmount: 0,
  }));

type InvoiceLean = {
  _id: Types.ObjectId;
  invoiceNumber: string;
  customerId: Types.ObjectId;
  invoiceDate: Date;
  dueDate: Date | null;
  status: string;
  paymentStatus: string;
  grandTotal: number;
  totalPaid: number;
  outstandingBalance?: number;
  subtotal?: number;
  discountTotal?: number;
  taxTotal?: number;
  notes?: string | null;
  terms?: string | null;
};

const toDueListItem = (
  invoice: InvoiceLean,
  customer:
    | {
        _id: Types.ObjectId;
        customerCode: string;
        name: string;
        phone: string | null;
        email: string | null;
      }
    | null
    | undefined,
  today: Date,
): DueListItem => {
  const totalPaid = invoice.totalPaid ?? 0;
  const outstandingBalance = calculateOutstandingBalance(invoice.grandTotal, totalPaid);
  const dueStatus = calculateDueStatus({
    grandTotal: invoice.grandTotal,
    totalPaid,
    invoiceDate: invoice.invoiceDate,
    dueDate: invoice.dueDate,
    today,
  });
  const ageingBucket = calculateAgeingBucket({
    grandTotal: invoice.grandTotal,
    totalPaid,
    invoiceDate: invoice.invoiceDate,
    dueDate: invoice.dueDate,
    today,
  });

  return {
    invoiceId: invoice._id.toString(),
    invoiceNumber: invoice.invoiceNumber,
    customer: customer
      ? {
          id: customer._id.toString(),
          customerCode: customer.customerCode,
          name: customer.name,
          phone: customer.phone,
          email: customer.email,
        }
      : null,
    invoiceDate: invoice.invoiceDate,
    dueDate: invoice.dueDate,
    grandTotal: invoice.grandTotal,
    totalPaid: roundMoney(totalPaid),
    outstandingBalance,
    daysOutstanding: calculateDaysOutstanding(invoice.invoiceDate, today),
    daysOverdue: calculateDaysOverdue({
      grandTotal: invoice.grandTotal,
      totalPaid,
      dueDate: invoice.dueDate,
      invoiceDate: invoice.invoiceDate,
      today,
    }),
    dueStatus,
    paymentStatus: (invoice.paymentStatus as DueListItem['paymentStatus']) ?? 'Unpaid',
    ageingBucket,
  };
};

const matchesStatus = (item: DueListItem, status: ListDuesQuery['status']): boolean => {
  if (status === 'all') {
    return true;
  }
  return item.dueStatus === status;
};

const matchesAgeingBucket = (
  item: DueListItem,
  ageingBucket: ListDuesQuery['ageingBucket'],
): boolean => {
  if (ageingBucket === 'all') {
    return true;
  }
  return item.ageingBucket === ageingBucket;
};

const sortDues = (
  dues: DueListItem[],
  sortBy: ListDuesQuery['sortBy'],
  sortOrder: ListDuesQuery['sortOrder'],
): DueListItem[] => {
  const direction = sortOrder === 'asc' ? 1 : -1;

  return [...dues].sort((a, b) => {
    let left: string | number = 0;
    let right: string | number = 0;

    switch (sortBy) {
      case 'invoiceNumber':
        left = a.invoiceNumber;
        right = b.invoiceNumber;
        break;
      case 'invoiceDate':
        left = new Date(a.invoiceDate).getTime();
        right = new Date(b.invoiceDate).getTime();
        break;
      case 'dueDate':
        left = a.dueDate ? new Date(a.dueDate).getTime() : Number.MAX_SAFE_INTEGER;
        right = b.dueDate ? new Date(b.dueDate).getTime() : Number.MAX_SAFE_INTEGER;
        break;
      case 'grandTotal':
        left = a.grandTotal;
        right = b.grandTotal;
        break;
      case 'outstandingBalance':
        left = a.outstandingBalance;
        right = b.outstandingBalance;
        break;
      case 'daysOutstanding':
        left = a.daysOutstanding;
        right = b.daysOutstanding;
        break;
      case 'dueStatus':
        left = a.dueStatus;
        right = b.dueStatus;
        break;
      default:
        left = a.dueDate ? new Date(a.dueDate).getTime() : 0;
        right = b.dueDate ? new Date(b.dueDate).getTime() : 0;
    }

    if (left < right) {
      return -1 * direction;
    }
    if (left > right) {
      return 1 * direction;
    }
    return 0;
  });
};

/**
 * Base invoice scope for due management: exclude drafts and cancelled.
 */
const buildBaseFilter = (
  businessObjectId: Types.ObjectId,
  query: Pick<ListDuesQuery, 'customer' | 'fromDate' | 'toDate' | 'search'>,
  matchingCustomerIds?: Types.ObjectId[],
): Record<string, unknown> => {
  const filter: Record<string, unknown> = {
    businessId: businessObjectId,
    isDeleted: { $ne: true },
    status: { $nin: ['Draft', 'Cancelled'] },
  };

  if (query.customer && Types.ObjectId.isValid(query.customer)) {
    filter.customerId = new Types.ObjectId(query.customer);
  }

  const fromDate = parseDate(query.fromDate);
  const toDate = parseDate(query.toDate);
  if (fromDate || toDate) {
    const dueDateFilter: { $gte?: Date; $lte?: Date } = {};
    if (fromDate) {
      dueDateFilter.$gte = startOfDay(fromDate);
    }
    if (toDate) {
      dueDateFilter.$lte = endOfDay(toDate);
    }
    filter.dueDate = dueDateFilter;
  }

  if (query.search) {
    const searchRegex = new RegExp(escapeRegex(query.search), 'i');
    const orConditions: Array<Record<string, unknown>> = [{ invoiceNumber: searchRegex }];

    if (matchingCustomerIds && matchingCustomerIds.length > 0) {
      orConditions.push({ customerId: { $in: matchingCustomerIds } });
    }

    filter.$or = orConditions;
  }

  return filter;
};

export const listDues = async (
  businessId: string,
  query: ListDuesQuery,
): Promise<DueListResult> => {
  const businessObjectId = new Types.ObjectId(businessId);
  const today = new Date();

  let matchingCustomerIds: Types.ObjectId[] | undefined;
  if (query.search) {
    const searchRegex = new RegExp(escapeRegex(query.search), 'i');
    const customers = await Customer.find({
      businessId: businessObjectId,
      isDeleted: false,
      $or: [{ name: searchRegex }, { phone: searchRegex }],
    })
      .select('_id')
      .lean()
      .exec();
    matchingCustomerIds = customers.map((customer) => customer._id);
  }

  const filter = buildBaseFilter(businessObjectId, query, matchingCustomerIds);

  const invoices = await Invoice.find(filter)
    .select(
      'invoiceNumber customerId invoiceDate dueDate status paymentStatus grandTotal totalPaid outstandingBalance',
    )
    .lean<InvoiceLean[]>()
    .exec();

  const customerIds = [...new Set(invoices.map((invoice) => invoice.customerId.toString()))];
  const customers = await Customer.find({ _id: { $in: customerIds } })
    .select('customerCode name phone email')
    .lean()
    .exec();
  const customerMap = new Map(customers.map((customer) => [customer._id.toString(), customer]));

  let dues = invoices.map((invoice) =>
    toDueListItem(invoice, customerMap.get(invoice.customerId.toString()), today),
  );

  dues = dues.filter(
    (item) => matchesStatus(item, query.status) && matchesAgeingBucket(item, query.ageingBucket),
  );
  dues = sortDues(dues, query.sortBy, query.sortOrder);

  const total = dues.length;
  const skip = (query.page - 1) * query.limit;
  const paged = dues.slice(skip, skip + query.limit);
  const totalPages = Math.max(1, Math.ceil(total / query.limit));

  return {
    dues: paged,
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages,
      hasNextPage: query.page < totalPages,
      hasPrevPage: query.page > 1,
    },
    meta: {
      search: query.search || null,
      customer: query.customer || null,
      status: query.status,
      fromDate: query.fromDate || null,
      toDate: query.toDate || null,
      ageingBucket: query.ageingBucket,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
    },
  };
};

export const getDueSummary = async (businessId: string): Promise<DueSummary> => {
  const businessObjectId = new Types.ObjectId(businessId);
  const today = new Date();

  const invoices = await Invoice.find({
    businessId: businessObjectId,
    isDeleted: { $ne: true },
    status: { $nin: ['Draft', 'Cancelled'] },
  })
    .select(
      'invoiceNumber customerId invoiceDate dueDate status paymentStatus grandTotal totalPaid',
    )
    .lean<InvoiceLean[]>()
    .exec();

  const customerIds = [...new Set(invoices.map((invoice) => invoice.customerId.toString()))];
  const customers = await Customer.find({ _id: { $in: customerIds } })
    .select('customerCode name')
    .lean()
    .exec();
  const customerMap = new Map(customers.map((customer) => [customer._id.toString(), customer]));

  const dues = invoices.map((invoice) =>
    toDueListItem(invoice, null, today),
  );

  let totalOutstandingAmount = 0;
  let totalOverdueAmount = 0;
  let outstandingInvoiceCount = 0;
  let overdueInvoiceCount = 0;

  const ageingBuckets = emptyAgeingBuckets();
  const ageingMap = new Map<AgeingBucket, AgeingBucketSummary>(
    ageingBuckets.map((bucket) => [bucket.bucket, bucket]),
  );

  const customerTotals = new Map<
    string,
    { outstandingAmount: number; invoiceCount: number }
  >();

  for (let index = 0; index < invoices.length; index += 1) {
    const invoice = invoices[index];
    const due = dues[index];
    const outstanding = due.outstandingBalance;

    if (outstanding > 0) {
      totalOutstandingAmount = roundMoney(totalOutstandingAmount + outstanding);
      outstandingInvoiceCount += 1;

      const existing = customerTotals.get(invoice.customerId.toString()) ?? {
        outstandingAmount: 0,
        invoiceCount: 0,
      };
      existing.outstandingAmount = roundMoney(existing.outstandingAmount + outstanding);
      existing.invoiceCount += 1;
      customerTotals.set(invoice.customerId.toString(), existing);

      if (due.ageingBucket) {
        const bucket = ageingMap.get(due.ageingBucket);
        if (bucket) {
          bucket.invoiceCount += 1;
          bucket.outstandingAmount = roundMoney(bucket.outstandingAmount + outstanding);
        }
      }
    }

    if (due.dueStatus === 'Overdue' && outstanding > 0) {
      totalOverdueAmount = roundMoney(totalOverdueAmount + outstanding);
      overdueInvoiceCount += 1;
    }
  }

  const topOutstandingCustomers: TopOutstandingCustomer[] = [...customerTotals.entries()]
    .map(([customerId, totals]) => {
      const customer = customerMap.get(customerId);
      return {
        customerId,
        customerCode: customer?.customerCode ?? '',
        name: customer?.name ?? 'Unknown customer',
        outstandingAmount: totals.outstandingAmount,
        invoiceCount: totals.invoiceCount,
      };
    })
    .sort((a, b) => b.outstandingAmount - a.outstandingAmount)
    .slice(0, 10);

  return {
    totalOutstandingAmount,
    totalOverdueAmount,
    outstandingInvoiceCount,
    overdueInvoiceCount,
    averageCollectionPeriod: null,
    ageingBuckets: AGEING_BUCKETS.map(
      (bucket) => ageingMap.get(bucket) ?? { bucket, invoiceCount: 0, outstandingAmount: 0 },
    ),
    topOutstandingCustomers,
  };
};

export const getDueDetails = async (
  businessId: string,
  invoiceId: string,
): Promise<DueDetails> => {
  if (!Types.ObjectId.isValid(invoiceId)) {
    throw new ApiError(400, 'Invalid invoice id');
  }

  const invoice = await Invoice.findOne({
    _id: new Types.ObjectId(invoiceId),
    businessId: new Types.ObjectId(businessId),
    isDeleted: { $ne: true },
  })
    .lean<InvoiceLean>()
    .exec();

  if (!invoice) {
    throw new ApiError(404, 'Invoice not found');
  }

  if (invoice.status === 'Draft' || invoice.status === 'Cancelled') {
    throw new ApiError(404, 'Due record not found for this invoice');
  }

  const today = new Date();
  const customer = await Customer.findById(invoice.customerId)
    .select(
      'customerCode name phone email addressLine1 addressLine2 city state country postalCode gstNumber',
    )
    .lean()
    .exec();

  if (!customer) {
    throw new ApiError(404, 'Customer not found');
  }

  const dueItem = toDueListItem(invoice, customer, today);
  const paymentHistory = await listPaymentsForInvoice(businessId, invoiceId);

  return {
    invoiceId: invoice._id.toString(),
    invoiceNumber: invoice.invoiceNumber,
    invoiceDate: invoice.invoiceDate,
    dueDate: invoice.dueDate,
    status: invoice.status,
    paymentStatus: dueItem.paymentStatus,
    grandTotal: invoice.grandTotal,
    totalPaid: dueItem.totalPaid,
    outstandingBalance: dueItem.outstandingBalance,
    subtotal: invoice.subtotal ?? 0,
    discountTotal: invoice.discountTotal ?? 0,
    taxTotal: invoice.taxTotal ?? 0,
    notes: invoice.notes ?? null,
    terms: invoice.terms ?? null,
    customer: {
      id: customer._id.toString(),
      customerCode: customer.customerCode,
      name: customer.name,
      phone: customer.phone,
      email: customer.email,
      addressLine1: customer.addressLine1,
      addressLine2: customer.addressLine2,
      city: customer.city,
      state: customer.state,
      country: customer.country,
      postalCode: customer.postalCode,
      gstNumber: customer.gstNumber,
    },
    dueStatus: dueItem.dueStatus,
    ageingBucket: dueItem.ageingBucket,
    daysOutstanding: dueItem.daysOutstanding,
    daysOverdue: dueItem.daysOverdue,
    payments: paymentHistory.payments.map((payment) => ({
      id: payment.id,
      paymentNumber: payment.paymentNumber,
      paymentDate: payment.paymentDate,
      amount: payment.amount,
      paymentMethod: payment.paymentMethod,
      referenceNumber: payment.referenceNumber,
      recordedByName: payment.recordedByName,
    })),
    quickActions: {
      viewInvoice: `/invoices/view?id=${invoice._id.toString()}`,
      recordPayment:
        dueItem.outstandingBalance > 0 &&
        dueItem.dueStatus !== 'Paid' &&
        dueItem.paymentStatus !== 'Paid',
    },
  };
};

export const calculateDueStatusForInvoice = calculateDueStatus;
export const calculateDaysOutstandingForInvoice = calculateDaysOutstanding;
export const calculateAgeingBucketForInvoice = calculateAgeingBucket;

export type { DueStatus, AgeingBucket };
