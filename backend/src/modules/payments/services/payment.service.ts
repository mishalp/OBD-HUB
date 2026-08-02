import { Types } from 'mongoose';
import { ApiError } from '../../../utils/ApiError';
import { User } from '../../auth/models/user.model';
import { Customer } from '../../customers/models/customer.model';
import { IInvoiceDocument, Invoice } from '../../invoices/models/invoice.model';
import { reserveNextNumber } from '../../number-sequence/services/numberSequence.service';
import { roundMoney } from '../../invoices/utils/invoiceCalculations';
import {
  calculateOutstandingBalance,
  syncInvoicePaymentState,
} from '../../invoices/utils/invoicePaymentBalance';
import { IPaymentDocument, Payment, PaymentMethod } from '../models/payment.model';
import {
  CreatePaymentInput,
  ListPaymentsQuery,
} from '../validators/payment.validator';
import {
  CreatePaymentResult,
  PaymentDetails,
  PaymentHistoryItem,
  PaymentListItem,
  PaymentListResult,
  PaymentStatistics,
  SafePayment,
} from '../types/payment.types';
import { recordTimelineEvent } from '../../timeline/services/timeline.service';
import { buildPaymentTimelineEvent } from '../../timeline/utils/timelineEventFactory';

const escapeRegex = (value: string): string =>
  value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const parseDate = (value: string): Date | null => {
  if (!value) {
    return null;
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const toSafePayment = (payment: IPaymentDocument): SafePayment => ({
  id: payment._id.toString(),
  businessId: payment.businessId.toString(),
  invoiceId: payment.invoiceId.toString(),
  customerId: payment.customerId.toString(),
  paymentNumber: payment.paymentNumber,
  amount: payment.amount,
  paymentDate: payment.paymentDate,
  paymentMethod: payment.paymentMethod,
  referenceNumber: payment.referenceNumber,
  notes: payment.notes,
  recordedBy: payment.recordedBy.toString(),
  createdAt: payment.createdAt,
  updatedAt: payment.updatedAt,
});

const getDisplayName = (
  user: { firstName?: string; lastName?: string } | null | undefined,
): string | null => {
  if (!user) {
    return null;
  }
  return `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || null;
};

const sumPaymentsForInvoice = async (
  businessId: Types.ObjectId,
  invoiceId: Types.ObjectId,
): Promise<number> => {
  const rows = await Payment.aggregate<{ totalPaid: number }>([
    { $match: { businessId, invoiceId } },
    { $group: { _id: null, totalPaid: { $sum: '$amount' } } },
  ]).exec();

  return roundMoney(rows[0]?.totalPaid ?? 0);
};

const resolveOutstanding = (invoice: IInvoiceDocument): number =>
  calculateOutstandingBalance(invoice.grandTotal, invoice.totalPaid ?? 0);

const startOfToday = (): Date => {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
};

const endOfToday = (): Date => {
  const date = new Date();
  date.setHours(23, 59, 59, 999);
  return date;
};

const emptyStatistics = (): PaymentStatistics => ({
  totalPayments: 0,
  todaysCollections: 0,
  totalCollected: 0,
  pendingAmount: 0,
});

const getPaymentStatistics = async (
  businessObjectId: Types.ObjectId,
): Promise<PaymentStatistics> => {
  const todayStart = startOfToday();
  const todayEnd = endOfToday();

  const [paymentAgg, invoiceAgg] = await Promise.all([
    Payment.aggregate<{
      totalPayments: number;
      totalCollected: number;
      todaysCollections: number;
    }>([
      { $match: { businessId: businessObjectId } },
      {
        $group: {
          _id: null,
          totalPayments: { $sum: 1 },
          totalCollected: { $sum: '$amount' },
          todaysCollections: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $gte: ['$paymentDate', todayStart] },
                    { $lte: ['$paymentDate', todayEnd] },
                  ],
                },
                '$amount',
                0,
              ],
            },
          },
        },
      },
    ]).exec(),
    Invoice.aggregate<{ pendingAmount: number }>([
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
          pendingAmount: {
            $sum: {
              $max: [
                {
                  $subtract: [
                    '$grandTotal',
                    { $ifNull: ['$totalPaid', 0] },
                  ],
                },
                0,
              ],
            },
          },
        },
      },
    ]).exec(),
  ]);

  const stats = emptyStatistics();
  const paymentRow = paymentAgg[0];
  const invoiceRow = invoiceAgg[0];

  if (paymentRow) {
    stats.totalPayments = paymentRow.totalPayments;
    stats.totalCollected = roundMoney(paymentRow.totalCollected);
    stats.todaysCollections = roundMoney(paymentRow.todaysCollections);
  }

  if (invoiceRow) {
    stats.pendingAmount = roundMoney(invoiceRow.pendingAmount);
  }

  return stats;
};

const findInvoiceForPayment = async (
  businessId: string,
  invoiceId: string,
): Promise<IInvoiceDocument> => {
  if (!Types.ObjectId.isValid(invoiceId)) {
    throw new ApiError(400, 'Invalid invoice id');
  }

  const invoice = await Invoice.findOne({
    _id: new Types.ObjectId(invoiceId),
    businessId: new Types.ObjectId(businessId),
    isDeleted: { $ne: true },
  }).exec();

  if (!invoice) {
    throw new ApiError(404, 'Invoice not found');
  }

  return invoice;
};

export const createPayment = async (
  businessId: string,
  userId: string,
  input: CreatePaymentInput,
): Promise<CreatePaymentResult> => {
  const businessObjectId = new Types.ObjectId(businessId);
  const invoice = await findInvoiceForPayment(businessId, input.invoiceId);

  if (invoice.status === 'Draft') {
    throw new ApiError(409, 'Draft invoices cannot receive payments');
  }

  if (invoice.status === 'Cancelled') {
    throw new ApiError(409, 'Cancelled invoices cannot receive payments');
  }

  if (invoice.status === 'Paid' || invoice.paymentStatus === 'Paid') {
    throw new ApiError(409, 'Paid invoices cannot receive additional payments');
  }

  const amount = roundMoney(input.amount);
  if (amount <= 0) {
    throw new ApiError(400, 'Amount must be greater than zero');
  }

  const outstanding = resolveOutstanding(invoice);
  if (amount > outstanding) {
    throw new ApiError(
      400,
      `Payment amount cannot exceed outstanding balance of ${outstanding.toFixed(2)}`,
    );
  }

  const reserved = await reserveNextNumber(businessId, 'payment');
  const paymentNumber = reserved.documentNumber;

  const payment = await Payment.create({
    businessId: businessObjectId,
    invoiceId: invoice._id,
    customerId: invoice.customerId,
    paymentNumber,
    amount,
    paymentDate: input.paymentDate,
    paymentMethod: input.paymentMethod,
    referenceNumber: input.referenceNumber,
    notes: input.notes,
    recordedBy: new Types.ObjectId(userId),
  });

  const previousStatus = invoice.status;
  const previousPaymentStatus = invoice.paymentStatus;
  const previousTotalPaid = invoice.totalPaid ?? 0;
  const previousOutstanding =
    invoice.outstandingBalance ?? resolveOutstanding(invoice);

  const totalPaid = await sumPaymentsForInvoice(businessObjectId, invoice._id);
  const synced = syncInvoicePaymentState(invoice.grandTotal, totalPaid, invoice.status);

  invoice.totalPaid = synced.totalPaid;
  invoice.outstandingBalance = synced.outstandingBalance;
  invoice.paymentStatus = synced.paymentStatus;
  invoice.status = synced.status;
  await invoice.save();

  try {
    await recordTimelineEvent(
      buildPaymentTimelineEvent({
        businessId,
        invoiceId: invoice._id.toString(),
        userId,
        paymentId: payment._id.toString(),
        paymentNumber: payment.paymentNumber,
        amount: payment.amount,
        paymentMethod: payment.paymentMethod,
        outstandingBalance: synced.outstandingBalance,
        paymentStatus: synced.paymentStatus,
        invoiceStatus: synced.status,
      }),
    );
  } catch (error) {
    // Compensating rollback when MongoDB transactions are unavailable.
    await Payment.deleteOne({ _id: payment._id }).exec();
    invoice.totalPaid = previousTotalPaid;
    invoice.outstandingBalance = previousOutstanding;
    invoice.paymentStatus = previousPaymentStatus;
    invoice.status = previousStatus;
    await invoice.save();

    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(500, 'Failed to sync invoice timeline. Payment was rolled back.');
  }

  return {
    payment: toSafePayment(payment),
    invoice: {
      id: invoice._id.toString(),
      invoiceNumber: invoice.invoiceNumber,
      status: invoice.status,
      paymentStatus: invoice.paymentStatus,
      grandTotal: invoice.grandTotal,
      totalPaid: invoice.totalPaid,
      outstandingBalance: invoice.outstandingBalance,
    },
  };
};

type PaymentFilter = {
  businessId: Types.ObjectId;
  paymentMethod?: PaymentMethod;
  customerId?: Types.ObjectId;
  invoiceId?: Types.ObjectId;
  paymentDate?: { $gte?: Date; $lte?: Date };
  $or?: Array<Record<string, unknown>>;
};

export const listPayments = async (
  businessId: string,
  query: ListPaymentsQuery,
): Promise<PaymentListResult> => {
  const businessObjectId = new Types.ObjectId(businessId);

  const filter: PaymentFilter = {
    businessId: businessObjectId,
  };

  if (query.paymentMethod !== 'all') {
    filter.paymentMethod = query.paymentMethod;
  }

  if (query.customer && Types.ObjectId.isValid(query.customer)) {
    filter.customerId = new Types.ObjectId(query.customer);
  }

  if (query.invoice && Types.ObjectId.isValid(query.invoice)) {
    filter.invoiceId = new Types.ObjectId(query.invoice);
  }

  const fromDate = parseDate(query.fromDate);
  const toDate = parseDate(query.toDate);
  if (fromDate || toDate) {
    filter.paymentDate = {};
    if (fromDate) {
      fromDate.setHours(0, 0, 0, 0);
      filter.paymentDate.$gte = fromDate;
    }
    if (toDate) {
      toDate.setHours(23, 59, 59, 999);
      filter.paymentDate.$lte = toDate;
    }
  }

  if (query.search) {
    const searchRegex = new RegExp(escapeRegex(query.search), 'i');

    const [matchingCustomers, matchingInvoices] = await Promise.all([
      Customer.find({
        businessId: businessObjectId,
        isDeleted: false,
        name: searchRegex,
      })
        .select('_id')
        .exec(),
      Invoice.find({
        businessId: businessObjectId,
        isDeleted: { $ne: true },
        invoiceNumber: searchRegex,
      })
        .select('_id')
        .exec(),
    ]);

    filter.$or = [
      { paymentNumber: searchRegex },
      { referenceNumber: searchRegex },
      { customerId: { $in: matchingCustomers.map((customer) => customer._id) } },
      { invoiceId: { $in: matchingInvoices.map((invoice) => invoice._id) } },
    ];
  }

  const sortDirection = query.sortOrder === 'asc' ? 1 : -1;
  const skip = (query.page - 1) * query.limit;

  const [payments, total, statistics] = await Promise.all([
    Payment.find(filter)
      .sort({ [query.sortBy]: sortDirection })
      .skip(skip)
      .limit(query.limit)
      .exec(),
    Payment.countDocuments(filter).exec(),
    getPaymentStatistics(businessObjectId),
  ]);

  const customerIds = [...new Set(payments.map((payment) => payment.customerId.toString()))];
  const invoiceIds = [...new Set(payments.map((payment) => payment.invoiceId.toString()))];
  const recorderIds = [...new Set(payments.map((payment) => payment.recordedBy.toString()))];

  const [customers, invoices, recorders] = await Promise.all([
    Customer.find({ _id: { $in: customerIds } })
      .select('customerCode name phone email')
      .exec(),
    Invoice.find({ _id: { $in: invoiceIds } })
      .select(
        'invoiceNumber status paymentStatus grandTotal totalPaid outstandingBalance invoiceDate dueDate',
      )
      .exec(),
    User.find({ _id: { $in: recorderIds } })
      .select('firstName lastName')
      .exec(),
  ]);

  const customerMap = new Map(customers.map((customer) => [customer._id.toString(), customer]));
  const invoiceMap = new Map(invoices.map((invoice) => [invoice._id.toString(), invoice]));
  const recorderMap = new Map(recorders.map((user) => [user._id.toString(), user]));

  const listItems: PaymentListItem[] = payments.map((payment) => {
    const customer = customerMap.get(payment.customerId.toString());
    const invoice = invoiceMap.get(payment.invoiceId.toString());
    const recorder = recorderMap.get(payment.recordedBy.toString());

    return {
      ...toSafePayment(payment),
      customer: customer
        ? {
            id: customer._id.toString(),
            customerCode: customer.customerCode,
            name: customer.name,
            phone: customer.phone,
            email: customer.email,
          }
        : null,
      invoice: invoice
        ? {
            id: invoice._id.toString(),
            invoiceNumber: invoice.invoiceNumber,
            status: invoice.status,
            paymentStatus: invoice.paymentStatus ?? 'Unpaid',
            grandTotal: invoice.grandTotal,
            totalPaid: invoice.totalPaid ?? 0,
            outstandingBalance: calculateOutstandingBalance(
              invoice.grandTotal,
              invoice.totalPaid ?? 0,
            ),
            invoiceDate: invoice.invoiceDate,
            dueDate: invoice.dueDate,
          }
        : null,
      recordedByName: getDisplayName(recorder),
    };
  });

  const totalPages = Math.max(1, Math.ceil(total / query.limit));

  return {
    payments: listItems,
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages,
      hasNextPage: query.page < totalPages,
      hasPrevPage: query.page > 1,
    },
    statistics,
    meta: {
      search: query.search || null,
      paymentMethod: query.paymentMethod,
      customer: query.customer || null,
      invoice: query.invoice || null,
      fromDate: query.fromDate || null,
      toDate: query.toDate || null,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
    },
  };
};

export const getPaymentById = async (
  businessId: string,
  paymentId: string,
): Promise<PaymentDetails> => {
  if (!Types.ObjectId.isValid(paymentId)) {
    throw new ApiError(400, 'Invalid payment id');
  }

  const payment = await Payment.findOne({
    _id: new Types.ObjectId(paymentId),
    businessId: new Types.ObjectId(businessId),
  }).exec();

  if (!payment) {
    throw new ApiError(404, 'Payment not found');
  }

  const [customer, invoice, recorder] = await Promise.all([
    Customer.findById(payment.customerId)
      .select('customerCode name phone email')
      .exec(),
    Invoice.findById(payment.invoiceId)
      .select(
        'invoiceNumber status paymentStatus grandTotal totalPaid outstandingBalance invoiceDate dueDate',
      )
      .exec(),
    User.findById(payment.recordedBy).select('firstName lastName').exec(),
  ]);

  return {
    ...toSafePayment(payment),
    customer: customer
      ? {
          id: customer._id.toString(),
          customerCode: customer.customerCode,
          name: customer.name,
          phone: customer.phone,
          email: customer.email,
        }
      : null,
    invoice: invoice
      ? {
          id: invoice._id.toString(),
          invoiceNumber: invoice.invoiceNumber,
          status: invoice.status,
          paymentStatus: invoice.paymentStatus ?? 'Unpaid',
          grandTotal: invoice.grandTotal,
          totalPaid: invoice.totalPaid ?? 0,
          outstandingBalance: calculateOutstandingBalance(
            invoice.grandTotal,
            invoice.totalPaid ?? 0,
          ),
          invoiceDate: invoice.invoiceDate,
          dueDate: invoice.dueDate,
        }
      : null,
    recordedByName: getDisplayName(recorder),
  };
};

export const listPaymentsForInvoice = async (
  businessId: string,
  invoiceId: string,
): Promise<{ invoiceId: string; payments: PaymentHistoryItem[] }> => {
  const invoice = await findInvoiceForPayment(businessId, invoiceId);

  const payments = await Payment.find({
    businessId: new Types.ObjectId(businessId),
    invoiceId: invoice._id,
  })
    .sort({ paymentDate: -1, createdAt: -1 })
    .exec();

  const recorderIds = [...new Set(payments.map((payment) => payment.recordedBy.toString()))];
  const recorders = await User.find({ _id: { $in: recorderIds } })
    .select('firstName lastName')
    .exec();
  const recorderMap = new Map(recorders.map((user) => [user._id.toString(), user]));

  return {
    invoiceId: invoice._id.toString(),
    payments: payments.map((payment) => ({
      id: payment._id.toString(),
      paymentNumber: payment.paymentNumber,
      paymentDate: payment.paymentDate,
      amount: payment.amount,
      paymentMethod: payment.paymentMethod,
      referenceNumber: payment.referenceNumber,
      recordedBy: payment.recordedBy.toString(),
      recordedByName: getDisplayName(recorderMap.get(payment.recordedBy.toString())),
      createdAt: payment.createdAt,
    })),
  };
};
