export interface Business {
  id: string;
  ownerId: string;
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
  currency: string;
  currencySymbol: string;
  dateFormat: string;
  timezone: string;
  createdAt: string;
  updatedAt: string;
}

export interface BusinessFormValues {
  businessName: string;
  businessType: string;
  ownerName: string;
  email: string;
  phone: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  gstEnabled: boolean;
  gstNumber: string;
  invoicePrefix: string;
  invoiceStartingNumber: number;
  currency: string;
  currencySymbol: string;
  dateFormat: 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD';
  timezone: string;
}

export interface BusinessSetupResponse {
  business: Business;
  user: {
    businessId: string;
    businessSetupCompleted: boolean;
    businessName: string;
    logo: string | null;
  };
}
