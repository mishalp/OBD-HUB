import { IBusinessDocument } from '../models/business.model';
import { SafeBusiness } from '../types/business.types';

export const toSafeBusiness = (business: IBusinessDocument): SafeBusiness => {
  return {
    id: business._id.toString(),
    ownerId: business.ownerId.toString(),
    businessName: business.businessName,
    businessLogo: business.businessLogo,
    businessType: business.businessType,
    ownerName: business.ownerName,
    email: business.email,
    phone: business.phone,
    addressLine1: business.addressLine1,
    addressLine2: business.addressLine2,
    city: business.city,
    state: business.state,
    country: business.country,
    postalCode: business.postalCode,
    gstEnabled: business.gstEnabled,
    gstNumber: business.gstNumber,
    invoicePrefix: business.invoicePrefix,
    invoiceStartingNumber: business.invoiceStartingNumber,
    currency: business.currency,
    currencySymbol: business.currencySymbol,
    dateFormat: business.dateFormat,
    timezone: business.timezone,
    createdAt: business.createdAt,
    updatedAt: business.updatedAt,
  };
};
