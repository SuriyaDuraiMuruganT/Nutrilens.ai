import { apiClient } from './client';
import { UserProfile, UserGoals, TargetCalculationResult } from '../types';

export const profileApi = {
  getProfile: async (): Promise<UserProfile> => {
    const response = await apiClient.get<UserProfile>('/api/profile');
    return response.data;
  },

  updateProfile: async (profile: Partial<UserProfile>): Promise<UserProfile> => {
    const response = await apiClient.put<UserProfile>('/api/profile', profile);
    return response.data;
  },

  getGoals: async (): Promise<UserGoals> => {
    const response = await apiClient.get<UserGoals>('/api/goals');
    return response.data;
  },

  updateGoals: async (goals: Partial<UserGoals>): Promise<UserGoals> => {
    const response = await apiClient.put<UserGoals>('/api/goals', goals);
    return response.data;
  },

  calculateTargets: async (profile: Partial<UserProfile>): Promise<TargetCalculationResult> => {
    const response = await apiClient.post<TargetCalculationResult>('/api/profile/calculate-targets', profile);
    return response.data;
  },
};
