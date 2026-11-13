export interface FoodItem {
  id: number;
  name: string;
  aliases?: string[];
  category: string;
  kcal_per_100g: number;
  protein_per_100g: number;
  fat_per_100g: number;
  carbs_per_100g: number;
  fiber_per_100g: number;
  sugar_per_100g?: number;
  sodium_mg_per_100g?: number;
  default_serving_g: number;
  source: string;
}

export interface MealItem {
  id?: number;
  meal_id?: number;
  food_id: number | null;
  detected_name: string;
  grams: number;
  serving_description?: string;
  confidence: number;
  user_edited: boolean;
  has_extra_oil: boolean;
  kcal: number;
  protein: number;
  fat: number;
  carbs: number;
  fiber: number;
  sugar?: number;
  sodium?: number;
  added_sugars?: number | null;
  saturated_fat?: number | null;
  trans_fat?: number | null;
  cholesterol?: number | null;
  food?: FoodItem | null;
}

export interface Meal {
  id: number;
  user_id: number;
  meal_type: 'breakfast' | 'lunch' | 'snack' | 'dinner';
  eaten_at: string;
  image_path?: string;
  total_kcal: number;
  total_protein: number;
  total_fat: number;
  total_carbs: number;
  total_fiber: number;
  total_sugar?: number;
  total_sodium?: number;
  items: MealItem[];
  created_at: string;
}

export interface AnalyzedMealResponse {
  image_path: string;
  meal_type: 'breakfast' | 'lunch' | 'snack' | 'dinner';
  is_food: boolean;
  quality_feedback?: string;
  items: MealItem[];
  total_kcal: number;
  total_protein: number;
  total_fat: number;
  total_carbs: number;
  total_fiber: number;
  total_sugar?: number;
  total_sodium?: number;
  disclaimer: string;
}

export interface MacroSummary {
  kcal: number;
  protein_g: number;
  fat_g: number;
  carbs_g: number;
  fiber_g: number;
  sugar_g?: number;
  sodium_mg?: number;
}

export interface DailyDashboardData {
  date: string;
  target: MacroSummary;
  consumed: MacroSummary;
  remaining: MacroSummary;
  percentage: number;
  meals: Meal[];
  insights: string[];
}

export interface WeeklyDayTrend {
  date: string;
  day_name: string;
  calories: number;
  protein_g: number;
  target_calories: number;
}

export interface WeeklyDashboardData {
  days: WeeklyDayTrend[];
  avg_calories: number;
  avg_protein_g: number;
}

export interface UserProfile {
  id: number;
  name: string;
  email?: string;
  age: number;
  sex: 'male' | 'female';
  height_cm: number;
  weight_kg: number;
  activity_level: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
  goal: 'lose' | 'maintain' | 'gain';
}

export interface UserGoals {
  id: number;
  user_id: number;
  kcal_target: number;
  protein_g: number;
  fat_g: number;
  carbs_g: number;
  fiber_g: number;
}

export interface TargetCalculationResult {
  bmr: number;
  tdee: number;
  calculated_kcal: number;
  clamped_kcal: number;
  is_clamped_by_safety: boolean;
  protein_g: number;
  fat_g: number;
  carbs_g: number;
  fiber_g: number;
  message?: string;
}

export interface AuthResponse {
  user: UserProfile;
  goals?: UserGoals;
  token: string;
  message: string;
}

