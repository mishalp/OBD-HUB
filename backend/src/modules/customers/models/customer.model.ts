import { Document, Model, Schema, Types, model } from 'mongoose';

export interface ICustomer {
  businessId: Types.ObjectId;
  customerCode: string;
  name: string;
  phone: string | null;
  email: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  postalCode: string | null;
  gstNumber: string | null;
  notes: string | null;
  avatar: string | null;
  isActive: boolean;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICustomerDocument extends ICustomer, Document {
  _id: Types.ObjectId;
}

const customerSchema = new Schema<ICustomerDocument>(
  {
    businessId: {
      type: Schema.Types.ObjectId,
      ref: 'Business',
      required: true,
      index: true,
    },
    customerCode: {
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
      maxlength: 100,
    },
    phone: {
      type: String,
      default: null,
      trim: true,
      index: true,
    },
    email: {
      type: String,
      default: null,
      trim: true,
      lowercase: true,
    },
    addressLine1: {
      type: String,
      default: null,
      trim: true,
    },
    addressLine2: {
      type: String,
      default: null,
      trim: true,
    },
    city: {
      type: String,
      default: null,
      trim: true,
    },
    state: {
      type: String,
      default: null,
      trim: true,
    },
    country: {
      type: String,
      default: null,
      trim: true,
    },
    postalCode: {
      type: String,
      default: null,
      trim: true,
    },
    gstNumber: {
      type: String,
      default: null,
      trim: true,
      uppercase: true,
    },
    notes: {
      type: String,
      default: null,
      trim: true,
      maxlength: 1000,
    },
    avatar: {
      type: String,
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

// Phone uniqueness only when a phone number is present (name-only customers allowed).
customerSchema.index(
  { businessId: 1, phone: 1 },
  {
    unique: true,
    partialFilterExpression: {
      isDeleted: false,
      phone: { $type: 'string', $gt: '' },
    },
  },
);

customerSchema.index(
  { businessId: 1, customerCode: 1 },
  { unique: true },
);

customerSchema.index({ businessId: 1, name: 1, isDeleted: 1 });

export const Customer: Model<ICustomerDocument> = model<ICustomerDocument>(
  'Customer',
  customerSchema,
);
