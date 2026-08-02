import { apiRequest } from '@/lib/api/client';
import type { DashboardData } from '@/lib/types/dashboard';

export const dashboardApi = {
  get(): Promise<DashboardData> {
    return apiRequest<DashboardData>('/api/dashboard');
  },
};
