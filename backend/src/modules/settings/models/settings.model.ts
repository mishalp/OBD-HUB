import { Document, Model, Schema, Types, model } from 'mongoose';

export const THEMES = ['light', 'dark', 'system'] as const;
export type Theme = (typeof THEMES)[number];

export const LANGUAGES = ['default', 'en'] as const;
export type Language = (typeof LANGUAGES)[number];

export const ITEMS_PER_PAGE_OPTIONS = [10, 25, 50, 100] as const;

export const DASHBOARD_PERIODS = [
  'today',
  'last_7_days',
  'last_30_days',
  'current_month',
] as const;
export type DashboardPeriod = (typeof DASHBOARD_PERIODS)[number];

export const TAX_MODES = ['inclusive', 'exclusive'] as const;
export type TaxMode = (typeof TAX_MODES)[number];

/**
 * Business-scoped configuration that does not belong to the Business profile
 * itself. Canonical business fields (name, GST number, currency, invoice
 * prefix) stay in the Business / NumberSequence models to avoid duplication.
 */
export interface ISettings {
  businessId: Types.ObjectId;
  invoiceFooter: string | null;
  invoiceTerms: string | null;
  defaultTaxRate: number;
  taxMode: TaxMode;
  defaultTaxLabel: string;
  cgstRate: number;
  sgstRate: number;
  igstRate: number;
  theme: Theme;
  language: Language;
  itemsPerPage: number;
  defaultDashboardPeriod: DashboardPeriod;
  createdAt: Date;
  updatedAt: Date;
}

export interface ISettingsDocument extends ISettings, Document {
  _id: Types.ObjectId;
}

const settingsSchema = new Schema<ISettingsDocument>(
  {
    businessId: {
      type: Schema.Types.ObjectId,
      ref: 'Business',
      required: true,
      unique: true,
      index: true,
    },
    invoiceFooter: {
      type: String,
      default: null,
      trim: true,
      maxlength: 2000,
    },
    invoiceTerms: {
      type: String,
      default: null,
      trim: true,
      maxlength: 5000,
    },
    defaultTaxRate: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
      default: 0,
    },
    taxMode: {
      type: String,
      enum: TAX_MODES,
      required: true,
      default: 'exclusive',
    },
    defaultTaxLabel: {
      type: String,
      required: true,
      trim: true,
      maxlength: 30,
      default: 'GST',
    },
    // Future-ready split-rate fields; no advanced GST maths yet.
    cgstRate: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
      default: 0,
    },
    sgstRate: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
      default: 0,
    },
    igstRate: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
      default: 0,
    },
    theme: {
      type: String,
      enum: THEMES,
      required: true,
      default: 'system',
    },
    language: {
      type: String,
      enum: LANGUAGES,
      required: true,
      default: 'default',
    },
    itemsPerPage: {
      type: Number,
      required: true,
      enum: ITEMS_PER_PAGE_OPTIONS,
      default: 25,
    },
    defaultDashboardPeriod: {
      type: String,
      enum: DASHBOARD_PERIODS,
      required: true,
      default: 'last_30_days',
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

export const Settings: Model<ISettingsDocument> = model<ISettingsDocument>(
  'Settings',
  settingsSchema,
);
