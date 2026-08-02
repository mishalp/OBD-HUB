import { PipelineStage, Types } from 'mongoose';
import { Invoice } from '../../../invoices/models/invoice.model';
import { Payment } from '../../../payments/models/payment.model';
import { roundMoney } from '../../../invoices/utils/invoiceCalculations';
import {
  granularityToDateTruncUnit,
  resolveDateRange,
} from '../../shared/reportDateRange';
import {
  SalesSummaryQuery,
  SalesTopCustomersQuery,
  SalesTopItemsQuery,
  SalesTrendQuery,
} from '../validators/salesReport.validator';
import {
  ReportDateRangeMeta,
  SalesSummaryResult,
  SalesTrendResult,
  TopCustomersResult,
  TopItemsResult,
} from '../types/salesReport.types';

type BaseFilters = {
  period: SalesSummaryQuery['period'];
  fromDate: string;
  toDate: string;
  customer: string;
  item: string;
  paymentStatus: SalesSummaryQuery['paymentStatus'];
  invoiceStatus: SalesSummaryQuery['invoiceStatus'];
  paymentMethod: SalesSummaryQuery['paymentMethod'];
};

/**
 * Restricts to invoices that received at least one payment with the given
 * method. Runs a single distinct query to avoid N+1 lookups.
 */
const resolvePaymentMethodInvoiceIds = async (
  businessObjectId: Types.ObjectId,
  paymentMethod: BaseFilters['paymentMethod'],
): Promise<Types.ObjectId[] | null> => {
  if (paymentMethod === 'all') {
    return null;
  }

  const invoiceIds = await Payment.distinct('invoiceId', {
    businessId: businessObjectId,
    paymentMethod,
  });

  return invoiceIds as Types.ObjectId[];
};

const buildInvoiceMatch = (
  businessObjectId: Types.ObjectId,
  filters: BaseFilters,
  range: { from: Date; to: Date },
  paymentMethodInvoiceIds: Types.ObjectId[] | null,
): Record<string, unknown> => {
  const match: Record<string, unknown> = {
    businessId: businessObjectId,
    isDeleted: { $ne: true },
    invoiceDate: { $gte: range.from, $lte: range.to },
  };

  // Sales reports always exclude drafts; cancelled excluded unless explicitly requested.
  if (filters.invoiceStatus === 'all') {
    match.status = { $nin: ['Draft', 'Cancelled'] };
  } else {
    match.status = filters.invoiceStatus;
  }

  if (filters.paymentStatus !== 'all') {
    match.paymentStatus = filters.paymentStatus;
  }

  if (filters.customer && Types.ObjectId.isValid(filters.customer)) {
    match.customerId = new Types.ObjectId(filters.customer);
  }

  if (filters.item && Types.ObjectId.isValid(filters.item)) {
    match['items.itemId'] = new Types.ObjectId(filters.item);
  }

  if (paymentMethodInvoiceIds) {
    match._id = { $in: paymentMethodInvoiceIds };
  }

  return match;
};

const buildMeta = (
  filters: BaseFilters,
  range: { from: Date; to: Date },
): ReportDateRangeMeta => ({
  period: filters.period,
  fromDate: range.from.toISOString(),
  toDate: range.to.toISOString(),
});

export const getSalesSummary = async (
  businessId: string,
  query: SalesSummaryQuery,
): Promise<SalesSummaryResult> => {
  const businessObjectId = new Types.ObjectId(businessId);
  const range = resolveDateRange(query.period, query.fromDate, query.toDate);
  const paymentMethodInvoiceIds = await resolvePaymentMethodInvoiceIds(
    businessObjectId,
    query.paymentMethod,
  );
  const match = buildInvoiceMatch(businessObjectId, query, range, paymentMethodInvoiceIds);

  const rows = await Invoice.aggregate<{
    grossSales: number;
    discountTotal: number;
    taxTotal: number;
    netSales: number;
    invoiceCount: number;
    collectedAmount: number;
    outstandingAmount: number;
  }>([
    { $match: match },
    {
      $group: {
        _id: null,
        grossSales: { $sum: '$grandTotal' },
        discountTotal: { $sum: '$discountTotal' },
        taxTotal: { $sum: '$taxTotal' },
        netSales: { $sum: { $subtract: ['$grandTotal', '$taxTotal'] } },
        invoiceCount: { $sum: 1 },
        collectedAmount: { $sum: { $ifNull: ['$totalPaid', 0] } },
        outstandingAmount: {
          $sum: {
            $max: [{ $subtract: ['$grandTotal', { $ifNull: ['$totalPaid', 0] }] }, 0],
          },
        },
      },
    },
  ]).exec();

  const row = rows[0];
  const grossSales = roundMoney(row?.grossSales ?? 0);
  const invoiceCount = row?.invoiceCount ?? 0;
  const collectedAmount = roundMoney(row?.collectedAmount ?? 0);

  return {
    summary: {
      grossSales,
      discountTotal: roundMoney(row?.discountTotal ?? 0),
      taxTotal: roundMoney(row?.taxTotal ?? 0),
      netSales: roundMoney(row?.netSales ?? 0),
      invoiceCount,
      averageInvoiceValue: invoiceCount > 0 ? roundMoney(grossSales / invoiceCount) : 0,
      collectedAmount,
      outstandingAmount: roundMoney(row?.outstandingAmount ?? 0),
      collectionRate: grossSales > 0 ? roundMoney((collectedAmount / grossSales) * 100) : 0,
    },
    meta: buildMeta(query, range),
  };
};

export const getSalesTrend = async (
  businessId: string,
  query: SalesTrendQuery,
): Promise<SalesTrendResult> => {
  const businessObjectId = new Types.ObjectId(businessId);
  const range = resolveDateRange(query.period, query.fromDate, query.toDate);
  const paymentMethodInvoiceIds = await resolvePaymentMethodInvoiceIds(
    businessObjectId,
    query.paymentMethod,
  );
  const match = buildInvoiceMatch(businessObjectId, query, range, paymentMethodInvoiceIds);
  const unit = granularityToDateTruncUnit(query.granularity);

  const rows = await Invoice.aggregate<{
    _id: Date;
    grossSales: number;
    collectedAmount: number;
    outstandingAmount: number;
    invoiceCount: number;
  }>([
    { $match: match },
    {
      $group: {
        _id: { $dateTrunc: { date: '$invoiceDate', unit } },
        grossSales: { $sum: '$grandTotal' },
        collectedAmount: { $sum: { $ifNull: ['$totalPaid', 0] } },
        outstandingAmount: {
          $sum: {
            $max: [{ $subtract: ['$grandTotal', { $ifNull: ['$totalPaid', 0] }] }, 0],
          },
        },
        invoiceCount: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]).exec();

  return {
    trend: rows.map((point) => ({
      date: new Date(point._id).toISOString(),
      grossSales: roundMoney(point.grossSales),
      collectedAmount: roundMoney(point.collectedAmount),
      outstandingAmount: roundMoney(point.outstandingAmount),
      invoiceCount: point.invoiceCount,
    })),
    meta: { ...buildMeta(query, range), granularity: query.granularity },
  };
};

export const getTopItems = async (
  businessId: string,
  query: SalesTopItemsQuery,
): Promise<TopItemsResult> => {
  const businessObjectId = new Types.ObjectId(businessId);
  const range = resolveDateRange(query.period, query.fromDate, query.toDate);
  const paymentMethodInvoiceIds = await resolvePaymentMethodInvoiceIds(
    businessObjectId,
    query.paymentMethod,
  );
  const match = buildInvoiceMatch(businessObjectId, query, range, paymentMethodInvoiceIds);

  const pipeline: PipelineStage[] = [
    { $match: match },
    { $unwind: '$items' },
  ];

  if (query.item && Types.ObjectId.isValid(query.item)) {
    pipeline.push({ $match: { 'items.itemId': new Types.ObjectId(query.item) } });
  }

  pipeline.push(
    {
      $group: {
        _id: '$items.itemId',
        itemCode: { $first: '$items.itemCode' },
        itemName: { $first: '$items.itemName' },
        quantitySold: { $sum: '$items.quantity' },
        revenue: { $sum: '$items.lineTotal' },
        invoiceIds: { $addToSet: '$_id' },
      },
    },
    {
      $project: {
        _id: 1,
        itemCode: 1,
        itemName: 1,
        quantitySold: 1,
        revenue: 1,
        invoiceCount: { $size: '$invoiceIds' },
      },
    },
    { $sort: { revenue: -1, quantitySold: -1 } },
    { $limit: query.limit },
  );

  const rows = await Invoice.aggregate<{
    _id: Types.ObjectId;
    itemCode: string;
    itemName: string;
    quantitySold: number;
    revenue: number;
    invoiceCount: number;
  }>(pipeline).exec();

  return {
    items: rows.map((row) => ({
      itemId: row._id.toString(),
      itemCode: row.itemCode,
      itemName: row.itemName,
      quantitySold: roundMoney(row.quantitySold),
      revenue: roundMoney(row.revenue),
      invoiceCount: row.invoiceCount,
    })),
    meta: { ...buildMeta(query, range), limit: query.limit },
  };
};

export const getTopCustomers = async (
  businessId: string,
  query: SalesTopCustomersQuery,
): Promise<TopCustomersResult> => {
  const businessObjectId = new Types.ObjectId(businessId);
  const range = resolveDateRange(query.period, query.fromDate, query.toDate);
  const paymentMethodInvoiceIds = await resolvePaymentMethodInvoiceIds(
    businessObjectId,
    query.paymentMethod,
  );
  const match = buildInvoiceMatch(businessObjectId, query, range, paymentMethodInvoiceIds);

  const rows = await Invoice.aggregate<{
    _id: Types.ObjectId;
    revenue: number;
    invoiceCount: number;
    outstandingAmount: number;
    customer: { customerCode?: string; name?: string; phone?: string | null } | null;
  }>([
    { $match: match },
    {
      $group: {
        _id: '$customerId',
        revenue: { $sum: '$grandTotal' },
        invoiceCount: { $sum: 1 },
        outstandingAmount: {
          $sum: {
            $max: [{ $subtract: ['$grandTotal', { $ifNull: ['$totalPaid', 0] }] }, 0],
          },
        },
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
        customer: { $arrayElemAt: ['$customer', 0] },
      },
    },
  ]).exec();

  return {
    customers: rows.map((row) => ({
      customerId: row._id.toString(),
      customerCode: row.customer?.customerCode ?? '',
      name: row.customer?.name ?? 'Unknown customer',
      phone: row.customer?.phone ?? null,
      revenue: roundMoney(row.revenue),
      invoiceCount: row.invoiceCount,
      outstandingAmount: roundMoney(row.outstandingAmount),
    })),
    meta: { ...buildMeta(query, range), limit: query.limit },
  };
};
