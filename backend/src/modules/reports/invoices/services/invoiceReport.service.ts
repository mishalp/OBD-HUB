import { PipelineStage, Types } from 'mongoose';
import { Customer } from '../../../customers/models/customer.model';
import { Invoice } from '../../../invoices/models/invoice.model';
import { roundMoney } from '../../../invoices/utils/invoiceCalculations';
import {
  granularityToDateTruncUnit,
  resolveDateRange,
} from '../../shared/reportDateRange';
import {
  InvoiceListQuery,
  InvoiceStatusQuery,
  InvoiceSummaryQuery,
  InvoiceTrendQuery,
} from '../validators/invoiceReport.validator';
import {
  InvoiceReportListItem,
  InvoiceReportListResult,
  InvoiceReportSummaryResult,
  InvoiceStatusResult,
  InvoiceTrendResult,
  ReportDateRangeMeta,
} from '../types/invoiceReport.types';

/** Statuses that represent real financial transactions (drafts excluded). */
const FINANCIAL_STATUSES = ['Unpaid', 'Partially Paid', 'Paid'] as const;

/** Every status reported by the status distribution endpoint, in display order. */
const REPORTED_STATUSES = [
  'Draft',
  'Unpaid',
  'Partially Paid',
  'Paid',
  'Cancelled',
] as const;

type SharedFilters = {
  period: InvoiceSummaryQuery['period'];
  fromDate: string;
  toDate: string;
  status: InvoiceSummaryQuery['status'];
  paymentStatus: InvoiceSummaryQuery['paymentStatus'];
  customer: string;
  outstandingOnly: boolean;
  overdueOnly: boolean;
  minAmount?: number;
  maxAmount?: number;
  search: string;
};

const escapeRegex = (value: string): string =>
  value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Mongo expression for the outstanding balance derived from stored totals. */
const outstandingExpression = {
  $max: [{ $subtract: ['$grandTotal', { $ifNull: ['$totalPaid', 0] }] }, 0],
};

const isFinancialExpression = { $in: ['$status', [...FINANCIAL_STATUSES]] };

/**
 * Resolves customer ids matching a free-text search in a single query so the
 * invoice pipelines never need a per-row lookup.
 */
const resolveSearchCustomerIds = async (
  businessObjectId: Types.ObjectId,
  search: string,
): Promise<Types.ObjectId[]> => {
  const regex = new RegExp(escapeRegex(search), 'i');

  const ids = await Customer.distinct('_id', {
    businessId: businessObjectId,
    isDeleted: { $ne: true },
    $or: [{ name: regex }, { phone: regex }],
  });

  return ids as Types.ObjectId[];
};

const buildInvoiceMatch = (
  businessObjectId: Types.ObjectId,
  filters: SharedFilters,
  range: { from: Date; to: Date },
  searchCustomerIds: Types.ObjectId[] | null,
): Record<string, unknown> => {
  const match: Record<string, unknown> = {
    businessId: businessObjectId,
    isDeleted: { $ne: true },
    invoiceDate: { $gte: range.from, $lte: range.to },
  };

  if (filters.status !== 'all') {
    match.status = filters.status;
  }

  if (filters.paymentStatus !== 'all') {
    match.paymentStatus = filters.paymentStatus;
  }

  if (filters.customer && Types.ObjectId.isValid(filters.customer)) {
    match.customerId = new Types.ObjectId(filters.customer);
  }

  if (filters.minAmount !== undefined || filters.maxAmount !== undefined) {
    const amountFilter: Record<string, number> = {};
    if (filters.minAmount !== undefined) {
      amountFilter.$gte = filters.minAmount;
    }
    if (filters.maxAmount !== undefined) {
      amountFilter.$lte = filters.maxAmount;
    }
    match.grandTotal = amountFilter;
  }

  if (searchCustomerIds) {
    const regex = new RegExp(escapeRegex(filters.search), 'i');
    match.$or = [{ invoiceNumber: regex }, { customerId: { $in: searchCustomerIds } }];
  }

  return match;
};

/**
 * Post-match stages for filters that depend on the derived outstanding balance.
 * Kept separate so the indexed field match above runs first.
 */
const buildDerivedStages = (filters: SharedFilters, now: Date): PipelineStage[] => {
  const stages: PipelineStage[] = [
    {
      $addFields: {
        collectedAmount: { $ifNull: ['$totalPaid', 0] },
        outstandingAmount: outstandingExpression,
      },
    },
  ];

  const derivedMatch: Record<string, unknown> = {};

  if (filters.outstandingOnly) {
    derivedMatch.outstandingAmount = { $gt: 0 };
  }

  if (filters.overdueOnly) {
    derivedMatch.outstandingAmount = { $gt: 0 };
    derivedMatch.dueDate = { $ne: null, $lt: now };
    derivedMatch.status = { $in: [...FINANCIAL_STATUSES] };
  }

  if (Object.keys(derivedMatch).length > 0) {
    stages.push({ $match: derivedMatch });
  }

  return stages;
};

const buildMeta = (
  filters: SharedFilters,
  range: { from: Date; to: Date },
): ReportDateRangeMeta => ({
  period: filters.period,
  fromDate: range.from.toISOString(),
  toDate: range.to.toISOString(),
});

/** Shared setup: resolves the range, search ids, and the base pipeline prefix. */
const preparePipeline = async (
  businessId: string,
  filters: SharedFilters,
): Promise<{
  range: { from: Date; to: Date };
  prefix: PipelineStage[];
}> => {
  const businessObjectId = new Types.ObjectId(businessId);
  const range = resolveDateRange(filters.period, filters.fromDate, filters.toDate);
  const now = new Date();

  const searchCustomerIds = filters.search
    ? await resolveSearchCustomerIds(businessObjectId, filters.search)
    : null;

  const match = buildInvoiceMatch(businessObjectId, filters, range, searchCustomerIds);

  return {
    range,
    prefix: [{ $match: match }, ...buildDerivedStages(filters, now)],
  };
};

export const getInvoiceSummary = async (
  businessId: string,
  query: InvoiceSummaryQuery,
): Promise<InvoiceReportSummaryResult> => {
  const { range, prefix } = await preparePipeline(businessId, query);
  const now = new Date();

  const rows = await Invoice.aggregate<{
    totalInvoices: number;
    draftCount: number;
    unpaidCount: number;
    partiallyPaidCount: number;
    paidCount: number;
    cancelledCount: number;
    grossInvoiceAmount: number;
    collectedAmount: number;
    outstandingAmount: number;
    financialCount: number;
    outstandingInvoiceCount: number;
    overdueInvoiceCount: number;
    overdueAmount: number;
  }>([
    ...prefix,
    {
      $group: {
        _id: null,
        totalInvoices: { $sum: 1 },
        draftCount: { $sum: { $cond: [{ $eq: ['$status', 'Draft'] }, 1, 0] } },
        unpaidCount: { $sum: { $cond: [{ $eq: ['$status', 'Unpaid'] }, 1, 0] } },
        partiallyPaidCount: {
          $sum: { $cond: [{ $eq: ['$status', 'Partially Paid'] }, 1, 0] },
        },
        paidCount: { $sum: { $cond: [{ $eq: ['$status', 'Paid'] }, 1, 0] } },
        cancelledCount: { $sum: { $cond: [{ $eq: ['$status', 'Cancelled'] }, 1, 0] } },
        // Financial totals exclude drafts and cancelled invoices.
        grossInvoiceAmount: {
          $sum: { $cond: [isFinancialExpression, '$grandTotal', 0] },
        },
        collectedAmount: {
          $sum: { $cond: [isFinancialExpression, '$collectedAmount', 0] },
        },
        outstandingAmount: {
          $sum: { $cond: [isFinancialExpression, '$outstandingAmount', 0] },
        },
        financialCount: { $sum: { $cond: [isFinancialExpression, 1, 0] } },
        outstandingInvoiceCount: {
          $sum: {
            $cond: [
              {
                $and: [isFinancialExpression, { $gt: ['$outstandingAmount', 0] }],
              },
              1,
              0,
            ],
          },
        },
        overdueInvoiceCount: {
          $sum: {
            $cond: [
              {
                $and: [
                  isFinancialExpression,
                  { $gt: ['$outstandingAmount', 0] },
                  { $ne: ['$dueDate', null] },
                  { $lt: ['$dueDate', now] },
                ],
              },
              1,
              0,
            ],
          },
        },
        overdueAmount: {
          $sum: {
            $cond: [
              {
                $and: [
                  isFinancialExpression,
                  { $gt: ['$outstandingAmount', 0] },
                  { $ne: ['$dueDate', null] },
                  { $lt: ['$dueDate', now] },
                ],
              },
              '$outstandingAmount',
              0,
            ],
          },
        },
      },
    },
  ]).exec();

  const row = rows[0];
  const grossInvoiceAmount = roundMoney(row?.grossInvoiceAmount ?? 0);
  const collectedAmount = roundMoney(row?.collectedAmount ?? 0);
  const outstandingAmount = roundMoney(row?.outstandingAmount ?? 0);
  const financialCount = row?.financialCount ?? 0;
  const outstandingInvoiceCount = row?.outstandingInvoiceCount ?? 0;

  return {
    summary: {
      totalInvoices: row?.totalInvoices ?? 0,
      draftCount: row?.draftCount ?? 0,
      unpaidCount: row?.unpaidCount ?? 0,
      partiallyPaidCount: row?.partiallyPaidCount ?? 0,
      paidCount: row?.paidCount ?? 0,
      cancelledCount: row?.cancelledCount ?? 0,
      grossInvoiceAmount,
      collectedAmount,
      outstandingAmount,
      averageInvoiceValue:
        financialCount > 0 ? roundMoney(grossInvoiceAmount / financialCount) : 0,
      collectionRate:
        grossInvoiceAmount > 0
          ? roundMoney((collectedAmount / grossInvoiceAmount) * 100)
          : 0,
      averageOutstandingBalance:
        outstandingInvoiceCount > 0
          ? roundMoney(outstandingAmount / outstandingInvoiceCount)
          : 0,
      outstandingInvoiceCount,
      overdueInvoiceCount: row?.overdueInvoiceCount ?? 0,
      overdueAmount: roundMoney(row?.overdueAmount ?? 0),
      averageDaysToPayment: null,
    },
    meta: buildMeta(query, range),
  };
};

export const getInvoiceStatusBreakdown = async (
  businessId: string,
  query: InvoiceStatusQuery,
): Promise<InvoiceStatusResult> => {
  const { range, prefix } = await preparePipeline(businessId, query);

  const rows = await Invoice.aggregate<{
    _id: string;
    invoiceCount: number;
    totalAmount: number;
  }>([
    ...prefix,
    {
      $group: {
        _id: '$status',
        invoiceCount: { $sum: 1 },
        totalAmount: { $sum: '$grandTotal' },
      },
    },
  ]).exec();

  const byStatus = new Map(rows.map((row) => [row._id, row]));
  const totalCount = rows.reduce((sum, row) => sum + row.invoiceCount, 0);
  const totalAmount = rows.reduce((sum, row) => sum + row.totalAmount, 0);

  return {
    statuses: REPORTED_STATUSES.map((status) => {
      const row = byStatus.get(status);
      const invoiceCount = row?.invoiceCount ?? 0;
      const amount = roundMoney(row?.totalAmount ?? 0);

      return {
        status,
        invoiceCount,
        totalAmount: amount,
        percentage: totalCount > 0 ? roundMoney((invoiceCount / totalCount) * 100) : 0,
        amountPercentage: totalAmount > 0 ? roundMoney((amount / totalAmount) * 100) : 0,
      };
    }),
    totals: {
      invoiceCount: totalCount,
      totalAmount: roundMoney(totalAmount),
    },
    meta: buildMeta(query, range),
  };
};

export const getInvoiceTrend = async (
  businessId: string,
  query: InvoiceTrendQuery,
): Promise<InvoiceTrendResult> => {
  const { range, prefix } = await preparePipeline(businessId, query);
  const unit = granularityToDateTruncUnit(query.granularity);

  const rows = await Invoice.aggregate<{
    _id: Date;
    invoiceCount: number;
    invoiceValue: number;
    collectedAmount: number;
    outstandingAmount: number;
  }>([
    ...prefix,
    {
      $group: {
        _id: { $dateTrunc: { date: '$invoiceDate', unit } },
        invoiceCount: { $sum: { $cond: [isFinancialExpression, 1, 0] } },
        invoiceValue: { $sum: { $cond: [isFinancialExpression, '$grandTotal', 0] } },
        collectedAmount: {
          $sum: { $cond: [isFinancialExpression, '$collectedAmount', 0] },
        },
        outstandingAmount: {
          $sum: { $cond: [isFinancialExpression, '$outstandingAmount', 0] },
        },
      },
    },
    { $sort: { _id: 1 } },
  ]).exec();

  return {
    trend: rows.map((point) => ({
      date: new Date(point._id).toISOString(),
      invoiceCount: point.invoiceCount,
      invoiceValue: roundMoney(point.invoiceValue),
      collectedAmount: roundMoney(point.collectedAmount),
      outstandingAmount: roundMoney(point.outstandingAmount),
    })),
    meta: { ...buildMeta(query, range), granularity: query.granularity },
  };
};

export const listInvoiceReports = async (
  businessId: string,
  query: InvoiceListQuery,
): Promise<InvoiceReportListResult> => {
  const { range, prefix } = await preparePipeline(businessId, query);
  const now = new Date();

  const sortField =
    query.sortBy === 'collectedAmount'
      ? 'collectedAmount'
      : query.sortBy === 'outstandingAmount'
        ? 'outstandingAmount'
        : query.sortBy;
  const sortDirection = query.sortOrder === 'asc' ? 1 : -1;

  const rows = await Invoice.aggregate<{
    data: Array<{
      _id: Types.ObjectId;
      invoiceNumber: string;
      customerId: Types.ObjectId;
      invoiceDate: Date;
      dueDate: Date | null;
      grandTotal: number;
      collectedAmount: number;
      outstandingAmount: number;
      status: string;
      paymentStatus: string;
      customer: { name?: string; phone?: string | null } | null;
    }>;
    total: Array<{ count: number }>;
  }>([
    ...prefix,
    {
      $facet: {
        data: [
          { $sort: { [sortField]: sortDirection, _id: -1 } },
          { $skip: (query.page - 1) * query.limit },
          { $limit: query.limit },
          {
            $lookup: {
              from: 'customers',
              localField: 'customerId',
              foreignField: '_id',
              as: 'customer',
            },
          },
          {
            $project: {
              _id: 1,
              invoiceNumber: 1,
              customerId: 1,
              invoiceDate: 1,
              dueDate: 1,
              grandTotal: 1,
              collectedAmount: 1,
              outstandingAmount: 1,
              status: 1,
              paymentStatus: 1,
              customer: { $arrayElemAt: ['$customer', 0] },
            },
          },
        ],
        total: [{ $count: 'count' }],
      },
    },
  ]).exec();

  const facet = rows[0];
  const total = facet?.total?.[0]?.count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / query.limit));

  const invoices: InvoiceReportListItem[] = (facet?.data ?? []).map((row) => {
    const outstandingAmount = roundMoney(row.outstandingAmount ?? 0);
    const dueDate = row.dueDate ? new Date(row.dueDate) : null;

    return {
      id: row._id.toString(),
      invoiceNumber: row.invoiceNumber,
      customerId: row.customerId.toString(),
      customerName: row.customer?.name ?? 'Unknown customer',
      customerPhone: row.customer?.phone ?? null,
      invoiceDate: new Date(row.invoiceDate).toISOString(),
      dueDate: dueDate ? dueDate.toISOString() : null,
      grandTotal: roundMoney(row.grandTotal),
      collectedAmount: roundMoney(row.collectedAmount ?? 0),
      outstandingAmount,
      status: row.status,
      paymentStatus: row.paymentStatus,
      isOverdue:
        outstandingAmount > 0 &&
        dueDate !== null &&
        dueDate < now &&
        (FINANCIAL_STATUSES as readonly string[]).includes(row.status),
    };
  });

  return {
    invoices,
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages,
      hasNextPage: query.page < totalPages,
      hasPrevPage: query.page > 1,
    },
    meta: {
      ...buildMeta(query, range),
      search: query.search || null,
      status: query.status,
      paymentStatus: query.paymentStatus,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
      outstandingOnly: query.outstandingOnly,
      overdueOnly: query.overdueOnly,
    },
  };
};
