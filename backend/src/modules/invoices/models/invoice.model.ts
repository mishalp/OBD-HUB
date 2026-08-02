import { Document, Model, Schema, Types, model } from 'mongoose';

export type InvoiceStatus =
  | 'Draft'
  | 'Unpaid'
  | 'Partially Paid'
  | 'Paid'
  | 'Cancelled';

/** Statuses that Invoice Management is allowed to set/edit. */
export const EDITABLE_INVOICE_STATUSES: InvoiceStatus[] = ['Draft', 'Unpaid'];

export const INVOICE_STATUSES: InvoiceStatus[] = [
  'Draft',
  'Unpaid',
  'Partially Paid',
  'Paid',
  'Cancelled',
];

export type InvoiceItemType = 'Product' | 'Service';

export interface IInvoiceItem {
  itemId: Types.ObjectId;
  itemCode: string;
  itemName: string;
  type: InvoiceItemType;
  quantity: number;
  unit: string;
  unitPrice: number;
  discount: number;
  taxRate: number;
  taxAmount: number;
  lineTotal: number;
}

export type InvoicePaymentStatus = 'Draft' | 'Unpaid' | 'Partially Paid' | 'Paid';

export interface IInvoice {
  businessId: Types.ObjectId;
  invoiceNumber: string;
  customerId: Types.ObjectId;
  invoiceDate: Date;
  dueDate: Date | null;
  status: InvoiceStatus;
  paymentStatus: InvoicePaymentStatus;
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  grandTotal: number;
  totalPaid: number;
  outstandingBalance: number;
  notes: string | null;
  terms: string | null;
  items: IInvoiceItem[];
  isDeleted: boolean;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface IInvoiceDocument extends IInvoice, Document {
  _id: Types.ObjectId;
}

const invoiceItemSchema = new Schema<IInvoiceItem>(
  {
    itemId: {
      type: Schema.Types.ObjectId,
      ref: 'Item',
      required: true,
    },
    itemCode: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
    itemName: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ['Product', 'Service'],
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 0.01,
    },
    unit: {
      type: String,
      required: true,
      trim: true,
    },
    unitPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    discount: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    taxRate: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    taxAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    lineTotal: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { _id: false },
);

const invoiceSchema = new Schema<IInvoiceDocument>(
  {
    businessId: {
      type: Schema.Types.ObjectId,
      ref: 'Business',
      required: true,
      index: true,
    },
    invoiceNumber: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    customerId: {
      type: Schema.Types.ObjectId,
      ref: 'Customer',
      required: true,
      index: true,
    },
    invoiceDate: {
      type: Date,
      required: true,
    },
    dueDate: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: ['Draft', 'Unpaid', 'Partially Paid', 'Paid', 'Cancelled'],
      required: true,
      index: true,
    },
    paymentStatus: {
      type: String,
      enum: ['Draft', 'Unpaid', 'Partially Paid', 'Paid'],
      required: true,
      default: 'Unpaid',
      index: true,
    },
    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },
    discountTotal: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    taxTotal: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    grandTotal: {
      type: Number,
      required: true,
      min: 0,
    },
    totalPaid: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    // No default of 0 — must be set to grandTotal on create / repair.
    outstandingBalance: {
      type: Number,
      required: true,
      min: 0,
    },
    notes: {
      type: String,
      default: null,
      trim: true,
      maxlength: 5000,
    },
    terms: {
      type: String,
      default: null,
      trim: true,
      maxlength: 5000,
    },
    items: {
      type: [invoiceItemSchema],
      required: true,
      validate: {
        validator: (value: IInvoiceItem[]) => Array.isArray(value) && value.length > 0,
        message: 'Invoice must contain at least one item',
      },
    },
    isDeleted: {
      type: Boolean,
      default: false,
      required: true,
      index: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

invoiceSchema.index({ businessId: 1, invoiceNumber: 1 }, { unique: true });
invoiceSchema.index({ businessId: 1, customerId: 1 });
invoiceSchema.index({ businessId: 1, createdAt: -1 });
invoiceSchema.index({ businessId: 1, isDeleted: 1, status: 1 });

export const Invoice: Model<IInvoiceDocument> = model<IInvoiceDocument>('Invoice', invoiceSchema);
