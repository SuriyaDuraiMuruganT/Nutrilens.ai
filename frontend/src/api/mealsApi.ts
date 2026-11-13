import { apiClient } from './client';
import { Meal, AnalyzedMealResponse, MealItem } from '../types';

export interface AiStatusResponse {
  provider: 'mock' | 'gemini';
  has_gemini_key: boolean;
  model: string;
  masked_key?: string | null;
}

export const mealsApi = {
  getAiStatus: async (): Promise<AiStatusResponse> => {
    const response = await apiClient.get<AiStatusResponse>('/api/config/ai-status');
    return response.data;
  },

  setGeminiKey: async (apiKey: string): Promise<{ status: string; provider: string; message: string }> => {
    const response = await apiClient.post('/api/config/gemini-key', {
      gemini_api_key: apiKey,
    });
    return response.data;
  },

  analyzeImage: async (
    imageBlob: Blob,
    filename: string = 'meal.jpg',
    hint?: string
  ): Promise<AnalyzedMealResponse> => {
    const formData = new FormData();
    formData.append('file', imageBlob, filename);
    if (hint && hint.trim()) {
      formData.append('hint', hint.trim());
    }
    const response = await apiClient.post<AnalyzedMealResponse>('/api/analyze', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  createMeal: async (mealData: {
    meal_type: string;
    image_path?: string;
    eaten_at?: string;
    items: Omit<MealItem, 'id' | 'meal_id' | 'food'>[];
  }): Promise<Meal> => {
    const response = await apiClient.post<Meal>('/api/meals', mealData);
    return response.data;
  },

  getMeals: async (date?: string): Promise<Meal[]> => {
    const response = await apiClient.get<Meal[]>('/api/meals', {
      params: date ? { date } : undefined,
    });
    return response.data;
  },

  getMealById: async (id: number): Promise<Meal> => {
    const response = await apiClient.get<Meal>(`/api/meals/${id}`);
    return response.data;
  },

  updateMeal: async (
    id: number,
    mealData: {
      meal_type?: string;
      eaten_at?: string;
      items: Omit<MealItem, 'id' | 'meal_id' | 'food'>[];
    }
  ): Promise<Meal> => {
    const response = await apiClient.put<Meal>(`/api/meals/${id}`, mealData);
    return response.data;
  },

  deleteMeal: async (id: number): Promise<void> => {
    await apiClient.delete(`/api/meals/${id}`);
  },
};
