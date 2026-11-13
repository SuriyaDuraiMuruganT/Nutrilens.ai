import { apiClient } from './client';
import { DailyDashboardData, WeeklyDashboardData } from '../types';

export const dashboardApi = {
  getDaily: async (date?: string): Promise<DailyDashboardData> => {
    const response = await apiClient.get<DailyDashboardData>('/api/dashboard/daily', {
      params: date ? { date } : undefined,
    });
    return response.data;
  },

  getWeekly: async (date?: string): Promise<WeeklyDashboardData> => {
    const response = await apiClient.get<WeeklyDashboardData>('/api/dashboard/weekly', {
      params: date ? { date } : undefined,
    });
    return response.data;
  },
};
