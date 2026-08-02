import { Document, Model, Schema, Types, model } from 'mongoose';

export const INVOICE_TIMELINE_EVENT_TYPES = [
  'INVOICE_CREATED',
  'INVOICE_UPDATED',
  'PAYMENT_RECORDED',
  'PARTIAL_PAYMENT',
  'INVOICE_PAID',
  'STATUS_CHANGED',
  'INVOICE_SENT',
  'PAYMENT_REVERSED',
  'INVOICE_CANCELLED',
] as const;

export type InvoiceTimelineEventType = (typeof INVOICE_TIMELINE_EVENT_TYPES)[number];

export interface IInvoiceTimelineEvent {
  businessId: Types.ObjectId;
  invoiceId: Types.ObjectId;
  eventType: InvoiceTimelineEventType;
  title: string;
  description: string;
  userId: Types.ObjectId | null;
  referenceId: Types.ObjectId | null;
  referenceType: string | null;
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface IInvoiceTimelineEventDocument extends IInvoiceTimelineEvent, Document {
  _id: Types.ObjectId;
}

const invoiceTimelineSchema = new Schema<IInvoiceTimelineEventDocument>(
  {
    businessId: {
      type: Schema.Types.ObjectId,
      ref: 'Business',
      required: true,
      index: true,
    },
    invoiceId: {
      type: Schema.Types.ObjectId,
      ref: 'Invoice',
      required: true,
      index: true,
    },
    eventType: {
      type: String,
      enum: INVOICE_TIMELINE_EVENT_TYPES,
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    referenceId: {
      type: Schema.Types.ObjectId,
      default: null,
    },
    referenceType: {
      type: String,
      default: null,
      trim: true,
      maxlength: 40,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  },
);

invoiceTimelineSchema.index({ businessId: 1, invoiceId: 1, createdAt: -1 });
invoiceTimelineSchema.index({ businessId: 1, invoiceId: 1, eventType: 1, createdAt: -1 });

export const InvoiceTimelineEvent: Model<IInvoiceTimelineEventDocument> =
  model<IInvoiceTimelineEventDocument>('InvoiceTimelineEvent', invoiceTimelineSchema);
