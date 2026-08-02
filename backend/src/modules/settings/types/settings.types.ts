import { SafeBusiness } from '../../business/types/business.types';
import {
  DashboardPeriod,
  Language,
  TaxMode,
  Theme,
} from '../models/settings.model';

export interface InvoiceSettings {
  prefix: string;
  startingNumber: number;
  paddingLength: number;
  separator: string;
  dateFormat: string;
  invoiceFooter: string | null;
  invoiceTerms: string | null;
  /** False once numbers have been issued, per the Number Sequence rules. */
  canEditNumbering: boolean;
  numberingLockReason: string | null;
  nextNumberPreview: string;
}

export interface TaxSettings {
  gstEnabled: boolean;
  gstNumber: string | null;
  defaultTaxRate: number;
  taxMode: TaxMode;
  defaultTaxLabel: string;
  cgstRate: number;
  sgstRate: number;
  igstRate: number;
}

export interface PreferenceSettings {
  theme: Theme;
  language: Language;
  itemsPerPage: number;
  defaultDashboardPeriod: DashboardPeriod;
}

export interface ProfileSettings {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  avatar: string | null;
  role: string;
  createdAt: Date;
}

export interface AboutInfo {
  applicationVersion: string;
  databaseVersion: string;
  apiVersion: string;
  buildDate: string;
  environment: string;
  licence: string;
}

export interface SettingsResponse {
  business: SafeBusiness;
  invoice: InvoiceSettings;
  tax: TaxSettings;
  preferences: PreferenceSettings;
  profile: ProfileSettings;
  about: AboutInfo;
}
