import { apiClient } from './client';
import { FoodItem } from '../types';

export interface FoodSearchResultItem extends FoodItem {
  match_score?: number;
}

export const foodsApi = {
  search: async (query: string, limit: number = 15): Promise<FoodSearchResultItem[]> => {
    const response = await apiClient.get<FoodSearchResultItem[]>('/api/foods/search', {
      params: { q: query, limit },
    });
    return response.data;
  },
};
