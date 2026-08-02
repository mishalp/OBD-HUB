import { Document, Model, Schema, Types, model } from 'mongoose';

export const STOCK_TRANSACTION_TYPES = [
  'Opening Stock',
  'Manual Adjustment',
  'Invoice Sale',
  'Purchase',
  'Purchase Return',
  'Sales Return',
  'Stock Correction',
] as const;

export type StockTransactionType = (typeof STOCK_TRANSACTION_TYPES)[number];

export const STOCK_REFERENCE_TYPES = [
  'item',
  'invoice',
  'manual',
  'system',
] as const;

export type StockReferenceType = (typeof STOCK_REFERENCE_TYPES)[number];

export interface IStockTransaction {
  businessId: Types.ObjectId;
  itemId: Types.ObjectId;
  transactionType: StockTransactionType;
  quantity: number;
  previousStock: number;
  newStock: number;
  referenceType: StockReferenceType | null;
  referenceId: Types.ObjectId | null;
  notes: string | null;
  performedBy: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface IStockTransactionDocument extends IStockTransaction, Document {
  _id: Types.ObjectId;
}

const stockTransactionSchema = new Schema<IStockTransactionDocument>(
  {
    businessId: {
      type: Schema.Types.ObjectId,
      ref: 'Business',
      required: true,
      index: true,
    },
    itemId: {
      type: Schema.Types.ObjectId,
      ref: 'Item',
      required: true,
      index: true,
    },
    transactionType: {
      type: String,
      enum: STOCK_TRANSACTION_TYPES,
      required: true,
      index: true,
    },
    quantity: {
      type: Number,
      required: true,
    },
    previousStock: {
      type: Number,
      required: true,
      min: 0,
    },
    newStock: {
      type: Number,
      required: true,
      min: 0,
    },
    referenceType: {
      type: String,
      enum: [...STOCK_REFERENCE_TYPES, null],
      default: null,
    },
    referenceId: {
      type: Schema.Types.ObjectId,
      default: null,
    },
    notes: {
      type: String,
      default: null,
      trim: true,
      maxlength: 1000,
    },
    performedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

stockTransactionSchema.index({ businessId: 1, itemId: 1, createdAt: -1 });
stockTransactionSchema.index({ businessId: 1, transactionType: 1, createdAt: -1 });
stockTransactionSchema.index({ businessId: 1, referenceType: 1, referenceId: 1 });

export const StockTransaction: Model<IStockTransactionDocument> = model<IStockTransactionDocument>(
  'StockTransaction',
  stockTransactionSchema,
);
