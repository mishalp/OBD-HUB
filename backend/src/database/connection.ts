import mongoose from 'mongoose';
import { env } from '../config/env';
import { ensureCustomerIndexes } from '../modules/customers/services/customer.service';

export const connectDatabase = async (): Promise<void> => {
  mongoose.set('strictQuery', true);

  await mongoose.connect(env.MONGODB_URI);
  await ensureCustomerIndexes();

  console.log('MongoDB connected');
};

export const getDatabaseStatus = (): string => {
  const states: Record<number, string> = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };

  return states[mongoose.connection.readyState] ?? 'unknown';
};
