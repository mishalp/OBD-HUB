import { Document, Model, Schema, Types, model } from 'mongoose';

export const PAYMENT_METHODS = [
  'Cash',
  'UPI',
  'Card',
  'Bank Transfer',
  'Cheque',
  'Other',
] as const;

export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export interface IPayment {
  businessId: Types.ObjectId;
  invoiceId: Types.ObjectId;
  customerId: Types.ObjectId;
  paymentNumber: string;
  amount: number;
  paymentDate: Date;
  paymentMethod: PaymentMethod;
  referenceNumber: string | null;
  notes: string | null;
  recordedBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface IPaymentDocument extends IPayment, Document {
  _id: Types.ObjectId;
}

const paymentSchema = new Schema<IPaymentDocument>(
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
    customerId: {
      type: Schema.Types.ObjectId,
      ref: 'Customer',
      required: true,
      index: true,
    },
    paymentNumber: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0.01,
    },
    paymentDate: {
      type: Date,
      required: true,
      index: true,
    },
    paymentMethod: {
      type: String,
      enum: PAYMENT_METHODS,
      required: true,
    },
    referenceNumber: {
      type: String,
      default: null,
      trim: true,
    },
    notes: {
      type: String,
      default: null,
      trim: true,
      maxlength: 1000,
    },
    recordedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

paymentSchema.index({ businessId: 1, paymentNumber: 1 }, { unique: true });
paymentSchema.index({ businessId: 1, paymentDate: -1 });
paymentSchema.index({ businessId: 1, invoiceId: 1, paymentDate: -1 });
paymentSchema.index({ businessId: 1, customerId: 1, paymentDate: -1 });

export const Payment: Model<IPaymentDocument> =
  model<IPaymentDocument>('Payment', paymentSchema);
