import { apiClient } from './client';
import { AuthResponse, UserProfile, UserGoals } from '../types';

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  age?: number;
  sex?: 'male' | 'female';
  height_cm?: number;
  weight_kg?: number;
  activity_level?: string;
  goal?: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export const authApi = {
  register: async (payload: RegisterPayload): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>('/api/auth/register', payload);
    return response.data;
  },

  login: async (payload: LoginPayload): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>('/api/auth/login', payload);
    return response.data;
  },

  guestLogin: async (): Promise<{ access_token: string; token_type: string }> => {
    const response = await apiClient.post<{ access_token: string; token_type: string }>('/api/auth/guest');
    return response.data;
  },

  getCurrentUser: async (): Promise<AuthResponse> => {
    const response = await apiClient.get<AuthResponse>('/api/auth/me');
    return response.data;
  },
};
