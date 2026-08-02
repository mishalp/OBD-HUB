import { Document, Model, Schema, Types, model } from 'mongoose';

export type ItemType = 'Product' | 'Service';

export const STOCK_UNITS = [
  'pcs',
  'kg',
  'g',
  'litres',
  'ml',
  'boxes',
  'packets',
  'meters',
  'cm',
  'dozen',
  'sets',
  'hours',
  'other',
] as const;

export type StockUnit = (typeof STOCK_UNITS)[number] | string;

export type InventoryStatus = 'Out of Stock' | 'Low Stock' | 'Normal' | 'Overstock' | 'Not Tracked';

export interface IItem {
  businessId: Types.ObjectId;
  itemCode: string;
  name: string;
  description: string | null;
  type: ItemType;
  category: string | null;
  unit: string;
  price: number;
  costPrice: number | null;
  taxRate: number;
  sku: string | null;
  barcode: string | null;
  /** Product-only: whether stock is tracked. Always false for services. */
  trackInventory: boolean;
  currentStock: number;
  openingStock: number;
  minimumStock: number;
  maximumStock: number | null;
  stockUnit: string | null;
  /** Future placeholder for valued inventory. */
  stockValue: number | null;
  lastStockUpdate: Date | null;
  isActive: boolean;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IItemDocument extends IItem, Document {
  _id: Types.ObjectId;
}

const itemSchema = new Schema<IItemDocument>(
  {
    businessId: {
      type: Schema.Types.ObjectId,
      ref: 'Business',
      required: true,
      index: true,
    },
    itemCode: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 150,
      index: true,
    },
    description: {
      type: String,
      default: null,
      trim: true,
      maxlength: 2000,
    },
    type: {
      type: String,
      enum: ['Product', 'Service'],
      required: true,
      index: true,
    },
    category: {
      type: String,
      default: null,
      trim: true,
    },
    unit: {
      type: String,
      required: true,
      trim: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    costPrice: {
      type: Number,
      default: null,
      min: 0,
    },
    taxRate: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    sku: {
      type: String,
      default: null,
      trim: true,
      uppercase: true,
    },
    barcode: {
      type: String,
      default: null,
      trim: true,
    },
    trackInventory: {
      type: Boolean,
      default: false,
      required: true,
      index: true,
    },
    currentStock: {
      type: Number,
      default: 0,
      min: 0,
    },
    openingStock: {
      type: Number,
      default: 0,
      min: 0,
    },
    minimumStock: {
      type: Number,
      default: 0,
      min: 0,
    },
    maximumStock: {
      type: Number,
      default: null,
      min: 0,
    },
    stockUnit: {
      type: String,
      default: null,
      trim: true,
      maxlength: 30,
    },
    stockValue: {
      type: Number,
      default: null,
      min: 0,
    },
    lastStockUpdate: {
      type: Date,
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
      required: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

itemSchema.index(
  { businessId: 1, name: 1 },
  {
    unique: true,
    partialFilterExpression: { isDeleted: false },
    collation: { locale: 'en', strength: 2 },
  },
);

itemSchema.index({ businessId: 1, itemCode: 1 }, { unique: true });
itemSchema.index({ businessId: 1, type: 1, trackInventory: 1, currentStock: 1 });
itemSchema.index({ businessId: 1, trackInventory: 1, minimumStock: 1, currentStock: 1 });

export const Item: Model<IItemDocument> = model<IItemDocument>('Item', itemSchema);
