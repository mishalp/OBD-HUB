export interface SafeBusiness {
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
  createdAt: Date;
  updatedAt: Date;
}

export interface BusinessSetupResponse {
  business: SafeBusiness;
  user: {
    businessId: string;
    businessSetupCompleted: boolean;
    businessName: string;
    logo: string | null;
  };
}
