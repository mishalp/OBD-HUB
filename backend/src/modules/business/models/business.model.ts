import { Document, Model, Schema, Types, model } from 'mongoose';

export interface IBusiness {
  ownerId: Types.ObjectId;
  businessName: string;
  businessLogo: string | null;
  businessType: string;
  ownerName: string;
  email: string;
  phone: string;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  gstEnabled: boolean;
  gstNumber: string | null;
  invoicePrefix: string;
  invoiceStartingNumber: number;
  nextInvoiceNumber?: number;
  currency: string;
  currencySymbol: string;
  dateFormat: string;
  timezone: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IBusinessDocument extends IBusiness, Document {
  _id: Types.ObjectId;
}

const businessSchema = new Schema<IBusinessDocument>(
  {
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    businessName: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 100,
    },
    businessLogo: {
      type: String,
      default: null,
    },
    businessType: {
      type: String,
      required: true,
      trim: true,
    },
    ownerName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    addressLine1: {
      type: String,
      required: true,
      trim: true,
    },
    addressLine2: {
      type: String,
      default: null,
      trim: true,
    },
    city: {
      type: String,
      required: true,
      trim: true,
    },
    state: {
      type: String,
      required: true,
      trim: true,
    },
    country: {
      type: String,
      required: true,
      trim: true,
    },
    postalCode: {
      type: String,
      required: true,
      trim: true,
    },
    gstEnabled: {
      type: Boolean,
      required: true,
      default: false,
    },
    gstNumber: {
      type: String,
      default: null,
      trim: true,
      uppercase: true,
    },
    invoicePrefix: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      maxlength: 10,
    },
    invoiceStartingNumber: {
      type: Number,
      required: true,
      min: 1,
      default: 1,
    },
    nextInvoiceNumber: {
      type: Number,
      min: 1,
      default: 1,
    },
    currency: {
      type: String,
      required: true,
      default: 'INR',
      trim: true,
      uppercase: true,
    },
    currencySymbol: {
      type: String,
      required: true,
      default: '₹',
      trim: true,
    },
    dateFormat: {
      type: String,
      required: true,
      default: 'DD/MM/YYYY',
    },
    timezone: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

export const Business: Model<IBusinessDocument> = model<IBusinessDocument>(
  'Business',
  businessSchema,
);
