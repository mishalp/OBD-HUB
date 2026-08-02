import { Types } from 'mongoose';
import { ApiError } from '../../../utils/ApiError';
import { Customer, ICustomerDocument } from '../models/customer.model';
import {
  CreateCustomerInput,
  ListCustomersQuery,
  UpdateCustomerInput,
} from '../validators/customer.validator';
import {
  CustomerDetails,
  CustomerListResult,
  SafeCustomer,
} from '../types/customer.types';

const toSafeCustomer = (customer: ICustomerDocument): SafeCustomer => ({
  id: customer._id.toString(),
  businessId: customer.businessId.toString(),
  customerCode: customer.customerCode,
  name: customer.name,
  phone: customer.phone ?? null,
  email: customer.email,
  addressLine1: customer.addressLine1,
  addressLine2: customer.addressLine2,
  city: customer.city,
  state: customer.state,
  country: customer.country,
  postalCode: customer.postalCode,
  gstNumber: customer.gstNumber,
  notes: customer.notes,
  avatar: customer.avatar ?? null,
  isActive: customer.isActive,
  createdAt: customer.createdAt,
  updatedAt: customer.updatedAt,
});

const normalizePhone = (phone: string | null | undefined): string | null => {
  if (!phone || phone.trim().length === 0) {
    return null;
  }
  return phone.trim();
};

type CustomerFilter = {
  businessId: Types.ObjectId;
  isDeleted: boolean;
  isActive?: boolean;
  _id?: { $ne: Types.ObjectId };
  phone?: string;
  $or?: Array<Record<string, RegExp>>;
};

export const generateCustomerCode = async (businessId: string): Promise<string> => {
  const count = await Customer.countDocuments({
    businessId: new Types.ObjectId(businessId),
  }).exec();

  return `CUS-${String(count + 1).padStart(6, '0')}`;
};

/**
 * Replaces the legacy unique phone index so multiple name-only customers
 * (phone = null) can coexist. Safe to run on every boot.
 */
export const ensureCustomerIndexes = async (): Promise<void> => {
  try {
    const indexes = await Customer.collection.indexes();
    const legacyPhoneIndex = indexes.find(
      (index) =>
        index.name === 'businessId_1_phone_1' &&
        !index.partialFilterExpression,
    );

    if (legacyPhoneIndex?.name) {
      await Customer.collection.dropIndex(legacyPhoneIndex.name);
    }
  } catch {
    // Index may already be gone or collection not ready yet.
  }

  await Customer.syncIndexes();
};

const assertUniquePhone = async (
  businessId: string,
  phone: string,
  excludeId?: string,
): Promise<void> => {
  const query: CustomerFilter = {
    businessId: new Types.ObjectId(businessId),
    phone: normalizePhone(phone) ?? phone,
    isDeleted: false,
  };

  if (excludeId) {
    query._id = { $ne: new Types.ObjectId(excludeId) };
  }

  const existing = await Customer.findOne(query).exec();

  if (existing) {
    throw new ApiError(409, 'Phone number already exists for this business', [
      { path: 'phone', message: 'Phone number already exists for this business' },
    ]);
  }
};

/** Exact-name matches used by Quick Create duplicate confirmation. */
export const findCustomersByExactName = async (
  businessId: string,
  name: string,
): Promise<SafeCustomer[]> => {
  const trimmed = name.trim();
  if (!trimmed) {
    return [];
  }

  const customers = await Customer.find({
    businessId: new Types.ObjectId(businessId),
    isDeleted: false,
    name: trimmed,
  })
    .sort({ createdAt: -1 })
    .limit(10)
    .exec();

  return customers.map(toSafeCustomer);
};

export const listCustomers = async (
  businessId: string,
  query: ListCustomersQuery,
): Promise<CustomerListResult> => {
  const filter: CustomerFilter = {
    businessId: new Types.ObjectId(businessId),
    isDeleted: false,
  };

  if (query.status === 'active') {
    filter.isActive = true;
  } else if (query.status === 'inactive') {
    filter.isActive = false;
  }

  if (query.search) {
    const searchRegex = new RegExp(query.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    filter.$or = [
      { name: searchRegex },
      { phone: searchRegex },
      { email: searchRegex },
      { customerCode: searchRegex },
    ];
  }

  const sortDirection = query.sortOrder === 'asc' ? 1 : -1;
  const skip = (query.page - 1) * query.limit;

  const [customers, total] = await Promise.all([
    Customer.find(filter)
      .sort({ [query.sortBy]: sortDirection })
      .skip(skip)
      .limit(query.limit)
      .exec(),
    Customer.countDocuments(filter).exec(),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / query.limit));

  return {
    customers: customers.map(toSafeCustomer),
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages,
      hasNextPage: query.page < totalPages,
      hasPrevPage: query.page > 1,
    },
    meta: {
      search: query.search || null,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
      status: query.status,
    },
  };
};

export const getCustomerById = async (
  businessId: string,
  customerId: string,
): Promise<CustomerDetails> => {
  if (!Types.ObjectId.isValid(customerId)) {
    throw new ApiError(404, 'Customer not found');
  }

  const customer = await Customer.findOne({
    _id: customerId,
    businessId: new Types.ObjectId(businessId),
    isDeleted: false,
  }).exec();

  if (!customer) {
    throw new ApiError(404, 'Customer not found');
  }

  return {
    ...toSafeCustomer(customer),
    invoiceCount: 0,
    totalSales: 0,
    totalPaid: 0,
    outstandingAmount: 0,
  };
};

export const createCustomer = async (
  businessId: string,
  input: CreateCustomerInput,
): Promise<SafeCustomer> => {
  const phone = normalizePhone(input.phone);

  if (phone) {
    await assertUniquePhone(businessId, phone);
  }

  const customerCode = await generateCustomerCode(businessId);

  try {
    const customer = await Customer.create({
      businessId: new Types.ObjectId(businessId),
      customerCode,
      name: input.name.trim(),
      phone,
      email: input.email ?? null,
      addressLine1: input.addressLine1 ?? null,
      addressLine2: input.addressLine2 ?? null,
      city: input.city ?? null,
      state: input.state ?? null,
      country: input.country ?? null,
      postalCode: input.postalCode ?? null,
      gstNumber: input.gstNumber ?? null,
      notes: input.notes ?? null,
      avatar: input.avatar ?? null,
      isActive: input.isActive ?? true,
      isDeleted: false,
    });

    return toSafeCustomer(customer);
  } catch (error) {
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as { code?: number }).code === 11000
    ) {
      throw new ApiError(409, 'Phone number already exists for this business', [
        { path: 'phone', message: 'Phone number already exists for this business' },
      ]);
    }

    throw error;
  }
};

export const updateCustomer = async (
  businessId: string,
  customerId: string,
  input: UpdateCustomerInput,
): Promise<SafeCustomer> => {
  if (!Types.ObjectId.isValid(customerId)) {
    throw new ApiError(404, 'Customer not found');
  }

  const customer = await Customer.findOne({
    _id: customerId,
    businessId: new Types.ObjectId(businessId),
    isDeleted: false,
  }).exec();

  if (!customer) {
    throw new ApiError(404, 'Customer not found');
  }

  const phone = normalizePhone(input.phone);

  if (phone) {
    await assertUniquePhone(businessId, phone, customerId);
  }

  customer.name = input.name.trim();
  customer.phone = phone;
  customer.email = input.email ?? null;
  customer.addressLine1 = input.addressLine1 ?? null;
  customer.addressLine2 = input.addressLine2 ?? null;
  customer.city = input.city ?? null;
  customer.state = input.state ?? null;
  customer.country = input.country ?? null;
  customer.postalCode = input.postalCode ?? null;
  customer.gstNumber = input.gstNumber ?? null;
  customer.notes = input.notes ?? null;
  if (input.avatar !== undefined) {
    customer.avatar = input.avatar;
  }
  customer.isActive = input.isActive ?? customer.isActive;

  try {
    await customer.save();
  } catch (error) {
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as { code?: number }).code === 11000
    ) {
      throw new ApiError(409, 'Phone number already exists for this business', [
        { path: 'phone', message: 'Phone number already exists for this business' },
      ]);
    }

    throw error;
  }

  return toSafeCustomer(customer);
};

export const deleteCustomer = async (
  businessId: string,
  customerId: string,
): Promise<void> => {
  if (!Types.ObjectId.isValid(customerId)) {
    throw new ApiError(404, 'Customer not found');
  }

  const customer = await Customer.findOne({
    _id: customerId,
    businessId: new Types.ObjectId(businessId),
    isDeleted: false,
  }).exec();

  if (!customer) {
    throw new ApiError(404, 'Customer not found');
  }

  customer.isDeleted = true;
  customer.isActive = false;
  await customer.save();
};
