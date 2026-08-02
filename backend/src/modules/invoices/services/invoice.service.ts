import { Types } from 'mongoose';
import { ApiError } from '../../../utils/ApiError';
import { Business } from '../../business/models/business.model';
import { toSafeBusiness } from '../../business/services/business.mapper';
import { Customer, ICustomerDocument } from '../../customers/models/customer.model';
import { Item } from '../../items/models/item.model';
import { User } from '../../auth/models/user.model';
import {
  EDITABLE_INVOICE_STATUSES,
  IInvoiceDocument,
  IInvoiceItem,
  Invoice,
  InvoiceStatus,
} from '../models/invoice.model';
import {
  CreateInvoiceInput,
  ListInvoicesQuery,
  UpdateInvoiceInput,
} from '../validators/invoice.validator';
import {
  calculateInvoiceTotals,
  calculateLineItem,
} from '../utils/invoiceCalculations';
import { isServiceItem } from '../utils/invoiceItemDisplay';
import {
  buildPaymentBalances,
  initialPaymentStatus,
  syncInvoicePaymentState,
} from '../utils/invoicePaymentBalance';
import {
  InvoiceDetails,
  InvoiceListItem,
  InvoiceListResult,
  InvoiceStatistics,
  NextInvoiceNumberResult,
  SafeInvoice,
} from '../types/invoice.types';
import {
  peekNextNumber,
  reserveNextNumber,
} from '../../number-sequence/services/numberSequence.service';
import {
  listTimelineForInvoice,
  recordTimelineEvent,
  recordTimelineEvents,
} from '../../timeline/services/timeline.service';
import {
  buildInvoiceCreatedEvent,
  buildInvoiceUpdatedEvent,
  buildStatusChangedEvent,
} from '../../timeline/utils/timelineEventFactory';
import { createPayment } from '../../payments/services/payment.service';
import {
  applyInvoiceSaleStock,
  restoreInvoiceSaleStock,
  syncInvoiceLineStock,
} from '../../items/services/inventory.service';
import { DEFAULT_DOCUMENT_TYPE } from '../../number-sequence/utils/documentTypes';
import { toInvoiceNumberResult } from '../../number-sequence/types/numberSequence.types';

const toSafeInvoice = (invoice: IInvoiceDocument): SafeInvoice => {
  const balances = buildPaymentBalances(
    invoice.grandTotal,
    invoice.totalPaid ?? 0,
    invoice.status,
  );

  return {
    id: invoice._id.toString(),
    businessId: invoice.businessId.toString(),
    invoiceNumber: invoice.invoiceNumber,
    customerId: invoice.customerId.toString(),
    invoiceDate: invoice.invoiceDate,
    dueDate: invoice.dueDate,
    status: invoice.status,
    paymentStatus: invoice.paymentStatus ?? balances.paymentStatus,
    subtotal: invoice.subtotal,
    discountTotal: invoice.discountTotal,
    taxTotal: invoice.taxTotal,
    grandTotal: invoice.grandTotal,
    totalPaid: balances.totalPaid,
    outstandingBalance: balances.outstandingBalance,
    notes: invoice.notes,
    terms: invoice.terms,
    items: invoice.items.map((item) => ({
      itemId: item.itemId.toString(),
      itemCode: item.itemCode,
      itemName: item.itemName,
      type: item.type,
      quantity: item.quantity,
      unit: item.unit,
      unitPrice: item.unitPrice,
      discount: item.discount,
      taxRate: item.taxRate,
      taxAmount: item.taxAmount,
      lineTotal: item.lineTotal,
    })),
    createdBy: invoice.createdBy.toString(),
    createdAt: invoice.createdAt,
    updatedAt: invoice.updatedAt,
  };
};

/** @deprecated Prefer /api/invoice-number/peek — kept for invoice module internals. */
export const peekNextInvoiceNumber = async (
  businessId: string,
): Promise<NextInvoiceNumberResult> => {
  const result = await peekNextNumber(businessId, DEFAULT_DOCUMENT_TYPE);
  const mapped = toInvoiceNumberResult(result);

  return {
    invoiceNumber: mapped.invoiceNumber,
    prefix: mapped.prefix,
    nextNumber: mapped.numericValue,
  };
};

/**
 * Reserves the next invoice number via the shared NumberSequence module.
 * Concurrency-safe atomic $inc — never accept invoiceNumber from the client.
 */
export const allocateInvoiceNumber = async (
  businessId: string,
): Promise<{ invoiceNumber: string; sequence: number }> => {
  const result = await reserveNextNumber(businessId, DEFAULT_DOCUMENT_TYPE);

  return {
    invoiceNumber: result.documentNumber,
    sequence: result.numericValue,
  };
};

/**
 * Validates the customer + items against the catalog and recomputes every
 * line and total on the server. The frontend calculations are never trusted.
 * Prices are snapshotted from the catalog item at the time of the request.
 */
const buildInvoicePricing = async (
  businessObjectId: Types.ObjectId,
  input: CreateInvoiceInput | UpdateInvoiceInput,
): Promise<{
  customer: ICustomerDocument;
  calculatedLines: IInvoiceItem[];
  totals: ReturnType<typeof calculateInvoiceTotals>;
}> => {
  const customer = await Customer.findOne({
    _id: input.customerId,
    businessId: businessObjectId,
    isDeleted: false,
  }).exec();

  if (!customer) {
    throw new ApiError(404, 'Customer not found', [
      { path: 'customerId', message: 'Customer not found' },
    ]);
  }

  if (!customer.isActive) {
    throw new ApiError(400, 'Selected customer is inactive', [
      { path: 'customerId', message: 'Selected customer is inactive' },
    ]);
  }

  const itemIds = [...new Set(input.items.map((item) => item.itemId))];
  const catalogItems = await Item.find({
    _id: { $in: itemIds },
    businessId: businessObjectId,
    isDeleted: false,
  }).exec();

  const catalogMap = new Map(catalogItems.map((item) => [item._id.toString(), item]));

  const calculatedLines: IInvoiceItem[] = [];
  const lineTotalsForAggregation: Array<{
    lineSubtotal: number;
    discount: number;
    taxAmount: number;
    lineTotal: number;
  }> = [];

  for (let index = 0; index < input.items.length; index += 1) {
    const row = input.items[index];
    const catalogItem = catalogMap.get(row.itemId);

    if (!catalogItem) {
      throw new ApiError(404, 'Item not found', [
        { path: `items.${index}.itemId`, message: 'Item not found' },
      ]);
    }

    if (!catalogItem.isActive) {
      throw new ApiError(400, 'Selected item is inactive', [
        { path: `items.${index}.itemId`, message: 'Selected item is inactive' },
      ]);
    }

    if (!catalogItem.type || !['Product', 'Service'].includes(catalogItem.type)) {
      throw new ApiError(400, 'Invalid item type', [
        {
          path: `items.${index}.itemId`,
          message: 'Item has an invalid or missing type',
        },
      ]);
    }

    const serviceLine = isServiceItem(catalogItem.type);
    let quantity = row.quantity;
    let unit = row.unit ?? catalogItem.unit;

    if (serviceLine) {
      // Services always calculate as quantity 1; never expose editable qty in the UI.
      if (quantity != null && quantity < 1) {
        throw new ApiError(400, 'Service quantity must be at least 1', [
          {
            path: `items.${index}.quantity`,
            message: 'Service quantity must be at least 1',
          },
        ]);
      }
      quantity = 1;
      unit = (unit && unit.trim()) || catalogItem.unit || 'svc';
    } else {
      if (quantity == null || quantity <= 0) {
        throw new ApiError(400, 'Quantity must be greater than 0', [
          {
            path: `items.${index}.quantity`,
            message: 'Quantity must be greater than 0',
          },
        ]);
      }
      if (!unit || !unit.trim()) {
        throw new ApiError(400, 'Unit is required', [
          { path: `items.${index}.unit`, message: 'Unit is required' },
        ]);
      }
      unit = unit.trim();
    }

    const calculated = calculateLineItem({
      quantity,
      unitPrice: row.unitPrice,
      discount: row.discount,
      taxRate: row.taxRate,
    });

    calculatedLines.push({
      itemId: catalogItem._id,
      itemCode: catalogItem.itemCode,
      itemName: catalogItem.name,
      type: catalogItem.type,
      quantity: calculated.quantity,
      unit,
      unitPrice: calculated.unitPrice,
      discount: calculated.discount,
      taxRate: calculated.taxRate,
      taxAmount: calculated.taxAmount,
      lineTotal: calculated.lineTotal,
    });

    lineTotalsForAggregation.push({
      lineSubtotal: calculated.lineSubtotal,
      discount: calculated.discount,
      taxAmount: calculated.taxAmount,
      lineTotal: calculated.lineTotal,
    });
  }

  const totals = calculateInvoiceTotals(lineTotalsForAggregation);

  return { customer, calculatedLines, totals };
};

const isStockEffectiveStatus = (status: InvoiceStatus): boolean =>
  status !== 'Draft' && status !== 'Cancelled';

const toStockLines = (
  items: Array<{
    itemId: Types.ObjectId | string;
    type: string;
    quantity: number;
    itemName?: string;
  }>,
) =>
  items.map((item) => ({
    itemId: item.itemId.toString(),
    type: item.type,
    quantity: item.quantity,
    itemName: item.itemName,
  }));

export const createInvoice = async (
  businessId: string,
  userId: string,
  input: CreateInvoiceInput,
): Promise<SafeInvoice> => {
  const businessObjectId = new Types.ObjectId(businessId);

  const { customer, calculatedLines, totals } = await buildInvoicePricing(
    businessObjectId,
    input,
  );

  if (input.status === 'Paid' && totals.grandTotal <= 0) {
    throw new ApiError(400, 'Paid invoices require a grand total greater than zero', [
      { path: 'status', message: 'Grand total must be greater than zero for Paid invoices' },
    ]);
  }

  if (input.status === 'Paid' && !input.payment) {
    throw new ApiError(400, 'Payment information is required when status is Paid', [
      { path: 'payment', message: 'Payment information is required when status is Paid' },
    ]);
  }

  const { invoiceNumber } = await allocateInvoiceNumber(businessId);

  // Paid-on-creation starts as Unpaid so PaymentService can settle it atomically
  // via the shared createPayment path (no duplicated payment logic).
  const initialStatus: InvoiceStatus =
    input.status === 'Paid' ? 'Unpaid' : input.status;

  try {
    const invoice = await Invoice.create({
      businessId: businessObjectId,
      invoiceNumber,
      customerId: customer._id,
      invoiceDate: input.invoiceDate,
      dueDate: input.dueDate,
      status: initialStatus,
      paymentStatus: initialPaymentStatus(initialStatus),
      subtotal: totals.subtotal,
      discountTotal: totals.discountTotal,
      taxTotal: totals.taxTotal,
      grandTotal: totals.grandTotal,
      totalPaid: 0,
      outstandingBalance: totals.grandTotal,
      notes: input.notes,
      terms: input.terms,
      items: calculatedLines,
      isDeleted: false,
      createdBy: new Types.ObjectId(userId),
    });

    try {
      await recordTimelineEvent(
        buildInvoiceCreatedEvent({
          businessId,
          invoiceId: invoice._id.toString(),
          userId,
          invoiceNumber: invoice.invoiceNumber,
          status: input.status === 'Paid' ? 'Paid' : invoice.status,
          grandTotal: invoice.grandTotal,
        }),
      );
    } catch (timelineError) {
      invoice.isDeleted = true;
      await invoice.save();
      if (timelineError instanceof ApiError) {
        throw timelineError;
      }
      throw new ApiError(500, 'Failed to create invoice timeline event');
    }

    if (isStockEffectiveStatus(initialStatus)) {
      try {
        await applyInvoiceSaleStock({
          businessId,
          invoiceId: invoice._id.toString(),
          userId,
          lines: toStockLines(calculatedLines),
        });
      } catch (stockError) {
        invoice.isDeleted = true;
        await invoice.save();
        if (stockError instanceof ApiError) {
          throw stockError;
        }
        throw new ApiError(500, 'Failed to update inventory for invoice');
      }
    }

    if (input.status === 'Paid' && input.payment) {
      try {
        await createPayment(businessId, userId, {
          invoiceId: invoice._id.toString(),
          amount: totals.grandTotal,
          paymentDate: input.payment.paymentDate,
          paymentMethod: input.payment.paymentMethod,
          referenceNumber: input.payment.referenceNumber,
          notes: input.payment.notes,
        });
      } catch (paymentError) {
        invoice.isDeleted = true;
        await invoice.save();
        if (paymentError instanceof ApiError) {
          throw paymentError;
        }
        throw new ApiError(500, 'Failed to record payment for paid invoice');
      }

      const settled = await Invoice.findById(invoice._id).exec();
      if (!settled || settled.isDeleted) {
        throw new ApiError(500, 'Invoice could not be finalized after payment');
      }

      return toSafeInvoice(settled);
    }

    return toSafeInvoice(invoice);
  } catch (error) {
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as { code?: number }).code === 11000
    ) {
      throw new ApiError(409, 'Invoice number conflict. Please try again.');
    }

    throw error;
  }
};

const escapeRegex = (value: string): string =>
  value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const parseDate = (value: string): Date | null => {
  if (!value) {
    return null;
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const emptyStatistics = (): InvoiceStatistics => ({
  totalInvoices: 0,
  draft: 0,
  unpaid: 0,
  partiallyPaid: 0,
  paid: 0,
});

const getInvoiceStatistics = async (
  businessObjectId: Types.ObjectId,
): Promise<InvoiceStatistics> => {
  const rows = await Invoice.aggregate<{ _id: string; count: number }>([
    { $match: { businessId: businessObjectId, isDeleted: { $ne: true } } },
    { $group: { _id: '$status', count: { $sum: 1 } } },
  ]).exec();

  const stats = emptyStatistics();

  for (const row of rows) {
    stats.totalInvoices += row.count;
    if (row._id === 'Draft') {
      stats.draft = row.count;
    } else if (row._id === 'Unpaid') {
      stats.unpaid = row.count;
    } else if (row._id === 'Partially Paid') {
      stats.partiallyPaid = row.count;
    } else if (row._id === 'Paid') {
      stats.paid = row.count;
    }
  }

  return stats;
};

type InvoiceFilter = {
  businessId: Types.ObjectId;
  isDeleted: { $ne: true };
  status?: InvoiceStatus;
  customerId?: Types.ObjectId | { $in: Types.ObjectId[] };
  invoiceDate?: { $gte?: Date; $lte?: Date };
  $or?: Array<Record<string, unknown>>;
};

export const listInvoices = async (
  businessId: string,
  query: ListInvoicesQuery,
): Promise<InvoiceListResult> => {
  const businessObjectId = new Types.ObjectId(businessId);

  const filter: InvoiceFilter = {
    businessId: businessObjectId,
    isDeleted: { $ne: true },
  };

  if (query.status !== 'all') {
    filter.status = query.status;
  }

  if (query.customer && Types.ObjectId.isValid(query.customer)) {
    filter.customerId = new Types.ObjectId(query.customer);
  }

  const fromDate = parseDate(query.fromDate);
  const toDate = parseDate(query.toDate);
  if (fromDate || toDate) {
    filter.invoiceDate = {};
    if (fromDate) {
      fromDate.setHours(0, 0, 0, 0);
      filter.invoiceDate.$gte = fromDate;
    }
    if (toDate) {
      toDate.setHours(23, 59, 59, 999);
      filter.invoiceDate.$lte = toDate;
    }
  }

  if (query.search) {
    const searchRegex = new RegExp(escapeRegex(query.search), 'i');
    const matchingCustomers = await Customer.find({
      businessId: businessObjectId,
      isDeleted: false,
      $or: [{ name: searchRegex }, { phone: searchRegex }],
    })
      .select('_id')
      .exec();

    filter.$or = [
      { invoiceNumber: searchRegex },
      { customerId: { $in: matchingCustomers.map((customer) => customer._id) } },
    ];
  }

  const sortDirection = query.sortOrder === 'asc' ? 1 : -1;
  const skip = (query.page - 1) * query.limit;

  const [invoices, total, statistics] = await Promise.all([
    Invoice.find(filter)
      .sort({ [query.sortBy]: sortDirection })
      .skip(skip)
      .limit(query.limit)
      .exec(),
    Invoice.countDocuments(filter).exec(),
    getInvoiceStatistics(businessObjectId),
  ]);

  const customerIds = [...new Set(invoices.map((invoice) => invoice.customerId.toString()))];
  const creatorIds = [...new Set(invoices.map((invoice) => invoice.createdBy.toString()))];

  const [customers, creators] = await Promise.all([
    Customer.find({ _id: { $in: customerIds } })
      .select('customerCode name phone email')
      .exec(),
    User.find({ _id: { $in: creatorIds } })
      .select('firstName lastName')
      .exec(),
  ]);

  const customerMap = new Map(customers.map((customer) => [customer._id.toString(), customer]));
  const creatorMap = new Map(creators.map((creator) => [creator._id.toString(), creator]));

  const listItems: InvoiceListItem[] = invoices.map((invoice) => {
    const customer = customerMap.get(invoice.customerId.toString());
    const creator = creatorMap.get(invoice.createdBy.toString());

    return {
      ...toSafeInvoice(invoice),
      customer: customer
        ? {
            id: customer._id.toString(),
            customerCode: customer.customerCode,
            name: customer.name,
            phone: customer.phone,
            email: customer.email,
          }
        : null,
      createdByName: creator
        ? `${creator.firstName} ${creator.lastName}`.trim()
        : null,
    };
  });

  const totalPages = Math.max(1, Math.ceil(total / query.limit));

  return {
    invoices: listItems,
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
      status: query.status,
      customer: query.customer || null,
      fromDate: query.fromDate || null,
      toDate: query.toDate || null,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
    },
  };
};

const findInvoiceForBusiness = async (
  businessId: string,
  invoiceId: string,
): Promise<IInvoiceDocument> => {
  if (!Types.ObjectId.isValid(invoiceId)) {
    throw new ApiError(404, 'Invoice not found');
  }

  const invoice = await Invoice.findOne({
    _id: invoiceId,
    businessId: new Types.ObjectId(businessId),
    isDeleted: { $ne: true },
  }).exec();

  if (!invoice) {
    throw new ApiError(404, 'Invoice not found');
  }

  return invoice;
};

export const getInvoiceById = async (
  businessId: string,
  invoiceId: string,
): Promise<InvoiceDetails> => {
  const invoice = await findInvoiceForBusiness(businessId, invoiceId);

  const [business, customer, creator, timeline] = await Promise.all([
    Business.findById(businessId).exec(),
    Customer.findById(invoice.customerId).exec(),
    User.findById(invoice.createdBy).select('firstName lastName').exec(),
    listTimelineForInvoice(businessId, invoiceId),
  ]);

  if (!business) {
    throw new ApiError(404, 'Business not found');
  }

  return {
    ...toSafeInvoice(invoice),
    business: toSafeBusiness(business),
    customer: customer
      ? {
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
        }
      : null,
    createdByName: creator ? `${creator.firstName} ${creator.lastName}`.trim() : null,
    timeline,
  };
};

export const getInvoicePrintDocument = async (
  businessId: string,
  invoiceId: string,
): Promise<{
  document: InvoiceDetails;
  documentType: 'invoice';
  generatedAt: string;
}> => {
  const document = await getInvoiceById(businessId, invoiceId);

  return {
    document,
    documentType: 'invoice',
    generatedAt: new Date().toISOString(),
  };
};

export const updateInvoice = async (
  businessId: string,
  invoiceId: string,
  userId: string,
  input: UpdateInvoiceInput,
): Promise<SafeInvoice> => {
  const businessObjectId = new Types.ObjectId(businessId);
  const invoice = await findInvoiceForBusiness(businessId, invoiceId);

  if (!EDITABLE_INVOICE_STATUSES.includes(invoice.status)) {
    throw new ApiError(
      409,
      `A ${invoice.status} invoice cannot be edited`,
    );
  }

  const previousStatus = invoice.status;
  const previousLines = toStockLines(invoice.items);
  const previouslyEffective = isStockEffectiveStatus(previousStatus);

  const { customer, calculatedLines, totals } = await buildInvoicePricing(
    businessObjectId,
    input,
  );

  invoice.customerId = customer._id;
  invoice.invoiceDate = input.invoiceDate;
  invoice.dueDate = input.dueDate;
  invoice.status = input.status;
  invoice.notes = input.notes;
  invoice.terms = input.terms;
  invoice.items = calculatedLines;
  invoice.subtotal = totals.subtotal;
  invoice.discountTotal = totals.discountTotal;
  invoice.taxTotal = totals.taxTotal;
  invoice.grandTotal = totals.grandTotal;

  const synced = syncInvoicePaymentState(
    totals.grandTotal,
    invoice.totalPaid ?? 0,
    input.status,
  );
  invoice.totalPaid = synced.totalPaid;
  invoice.outstandingBalance = synced.outstandingBalance;
  invoice.paymentStatus = synced.paymentStatus;
  invoice.status = synced.status;

  await invoice.save();

  try {
    await syncInvoiceLineStock({
      businessId,
      invoiceId: invoice._id.toString(),
      userId,
      previousLines,
      nextLines: toStockLines(calculatedLines),
      previouslyEffective,
      nextEffective: isStockEffectiveStatus(invoice.status),
    });
  } catch (stockError) {
    if (stockError instanceof ApiError) {
      throw stockError;
    }
    throw new ApiError(500, 'Failed to sync inventory for invoice update');
  }

  const timelineInputs = [
    buildInvoiceUpdatedEvent({
      businessId,
      invoiceId: invoice._id.toString(),
      userId,
      invoiceNumber: invoice.invoiceNumber,
      status: invoice.status,
      previousStatus,
      grandTotal: invoice.grandTotal,
    }),
  ];

  if (previousStatus !== invoice.status) {
    timelineInputs.push(
      buildStatusChangedEvent({
        businessId,
        invoiceId: invoice._id.toString(),
        userId,
        invoiceNumber: invoice.invoiceNumber,
        fromStatus: previousStatus,
        toStatus: invoice.status,
      }),
    );
  }

  await recordTimelineEvents(timelineInputs);

  return toSafeInvoice(invoice);
};

export const deleteInvoice = async (
  businessId: string,
  invoiceId: string,
  userId?: string,
): Promise<void> => {
  const invoice = await findInvoiceForBusiness(businessId, invoiceId);

  if (isStockEffectiveStatus(invoice.status) && !invoice.isDeleted) {
    await restoreInvoiceSaleStock({
      businessId,
      invoiceId: invoice._id.toString(),
      userId: userId ?? null,
      lines: toStockLines(invoice.items),
    });
  }

  invoice.isDeleted = true;
  await invoice.save();
};
