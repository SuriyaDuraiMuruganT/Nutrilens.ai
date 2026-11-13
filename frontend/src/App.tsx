import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  Sparkles,
  Camera,
  PlusCircle,
  TrendingUp,
  AlertCircle,
  HelpCircle,
  Home,
  User,
} from 'lucide-react';
import { Navbar } from './components/common/Navbar';
import { ImageInput } from './components/upload/ImageInput';
import { MealReviewModal } from './components/review/MealReviewModal';
import { ProfileGoalsModal } from './components/profile/ProfileGoalsModal';
import { AuthModal } from './components/auth/AuthModal';
import { CalorieRing } from './components/dashboard/CalorieRing';
import { ThaliMacroPlate } from './components/dashboard/ThaliMacroPlate';
import { MicronutrientsCard } from './components/dashboard/MicronutrientsCard';
import { MealTimeline } from './components/dashboard/MealTimeline';
import { WeeklyTrendChart } from './components/dashboard/WeeklyTrendChart';
import { InsightsCard } from './components/dashboard/InsightsCard';
import { dashboardApi } from './api/dashboardApi';
import { mealsApi } from './api/mealsApi';
import { AnalyzedMealResponse, Meal } from './types';

export function App() {
  const queryClient = useQueryClient();

  // Selected date state (defaults to today's date formatted as YYYY-MM-DD)
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });

  // Modal visibility states
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [analyzedMealData, setAnalyzedMealData] = useState<{
    analysis: AnalyzedMealResponse;
    previewUrl: string;
  } | null>(null);

  // Selected meal for detail/edit
  const [selectedMealForEdit, setSelectedMealForEdit] = useState<Meal | null>(null);

  // Fetch Daily Dashboard Query
  const { data: dailyData, isLoading: isDailyLoading } = useQuery({
    queryKey: ['dailyDashboard', selectedDate],
    queryFn: () => dashboardApi.getDaily(selectedDate),
  });

  // Fetch Weekly Dashboard Query
  const { data: weeklyData } = useQuery({
    queryKey: ['weeklyDashboard', selectedDate],
    queryFn: () => dashboardApi.getWeekly(selectedDate),
  });

  // Date Navigation handlers
  const handlePrevDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - 1);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const handleNextDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + 1);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const handleToday = () => {
    setSelectedDate(new Date().toISOString().split('T')[0]);
  };

  // Delete Meal Mutation
  const deleteMealMutation = useMutation({
    mutationFn: (id: number) => mealsApi.deleteMeal(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dailyDashboard'] });
      queryClient.invalidateQueries({ queryKey: ['weeklyDashboard'] });
    },
  });

  const handleDeleteMeal = (mealId: number) => {
    if (confirm('Are you sure you want to remove this logged meal?')) {
      deleteMealMutation.mutate(mealId);
    }
  };

  const handleAnalysisComplete = (result: AnalyzedMealResponse, localPreviewUrl: string) => {
    setIsUploadOpen(false);
    setAnalyzedMealData({ analysis: result, previewUrl: localPreviewUrl });
  };

  const handleSaveMealSuccess = () => {
    setAnalyzedMealData(null);
    setSelectedMealForEdit(null);
    queryClient.invalidateQueries({ queryKey: ['dailyDashboard'] });
    queryClient.invalidateQueries({ queryKey: ['weeklyDashboard'] });
  };

  // Check if viewing today
  const isToday = selectedDate === new Date().toISOString().split('T')[0];

  return (
    <div className="min-h-screen bg-fresh-bg text-fresh-text flex flex-col font-sans transition-colors duration-200">
      {/* Top Navbar */}
      <Navbar
        onOpenUpload={() => setIsUploadOpen(true)}
        onOpenProfile={() => setIsProfileOpen(true)}
        onOpenAuth={() => setIsAuthOpen(true)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Date Selector Navigation Bar */}
        <div className="bg-fresh-surface rounded-card p-3 border border-fresh-border shadow-soft flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-1.5">
            <button
              onClick={handlePrevDay}
              className="p-1.5 text-fresh-muted hover:text-fresh-text hover:bg-fresh-surface-alt rounded-btn transition"
              title="Previous Day"
              aria-label="Previous Day"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 px-2">
              <Calendar className="w-4 h-4 text-fresh-primary" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="text-sm font-medium text-fresh-text bg-transparent border-none outline-none cursor-pointer"
              />
            </div>
            <button
              onClick={handleNextDay}
              className="p-1.5 text-fresh-muted hover:text-fresh-text hover:bg-fresh-surface-alt rounded-btn transition"
              title="Next Day"
              aria-label="Next Day"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            {!isToday && (
              <button
                onClick={handleToday}
                className="text-xs font-medium px-3.5 py-1.5 rounded-full bg-fresh-surface-alt hover:bg-fresh-border text-fresh-text border border-fresh-border transition"
              >
                Jump to Today
              </button>
            )}
          </div>
        </div>

        {/* Hero Section / Quiet Welcome Banner */}
        <div className="rounded-card bg-fresh-surface p-6 sm:p-7 border border-fresh-border shadow-soft transition-colors">
          <div className="max-w-3xl space-y-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-fresh-primary-soft text-fresh-primary border border-fresh-primary/20">
                <Sparkles className="w-3.5 h-3.5" />
                Fresh Table · Intelligent Food Analysis
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-display font-medium tracking-tight text-fresh-text">
              Mindful Nourishment, Plate by Plate
            </h1>
            <p className="text-sm text-fresh-muted leading-relaxed font-sans">
              NutriLens gently identifies dishes, estimates balanced portions, and calculates nutrition.
              The UI stays quiet so your meals take center stage. Photo estimates can be off by 10–20%; tap any item to adjust.
            </p>

            <div className="pt-2 flex items-center gap-3 flex-wrap">
              <button
                onClick={() => setIsUploadOpen(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-btn bg-fresh-primary hover:opacity-90 active:scale-[0.98] text-fresh-on-primary font-medium text-sm shadow-soft transition"
              >
                <Camera className="w-4 h-4" />
                <span>Log a Meal</span>
              </button>
              <button
                onClick={() => setIsProfileOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-btn bg-fresh-primary-soft hover:opacity-80 text-fresh-primary font-medium text-sm transition border border-fresh-border"
              >
                <span>Edit Nutrition Goals</span>
              </button>
            </div>
          </div>
        </div>

        {/* Dashboard Cards Grid */}
        {isDailyLoading ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
              <div className="md:col-span-4 h-64 bg-fresh-surface-alt animate-pulse rounded-card border border-fresh-border" />
              <div className="md:col-span-4 h-64 bg-fresh-surface-alt animate-pulse rounded-card border border-fresh-border" />
              <div className="md:col-span-4 h-64 bg-fresh-surface-alt animate-pulse rounded-card border border-fresh-border" />
            </div>
          </div>
        ) : dailyData ? (
          <div className="space-y-6">
            {/* Top Metrics Row: Calorie Ring, Macro Plate, Micronutrients Progress */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
              {/* Calorie Ring (md:col-span-4) */}
              <div className="md:col-span-4">
                <CalorieRing
                  consumed={dailyData.consumed.kcal}
                  target={dailyData.target.kcal}
                  remaining={dailyData.remaining.kcal}
                  percentage={dailyData.percentage}
                />
              </div>

              {/* Macro Display (md:col-span-4) with compact rows and donut toggle */}
              <div className="md:col-span-4">
                <ThaliMacroPlate
                  protein_g={dailyData.consumed.protein_g}
                  fat_g={dailyData.consumed.fat_g}
                  carbs_g={dailyData.consumed.carbs_g}
                  fiber_g={dailyData.consumed.fiber_g}
                  targetProtein={dailyData.target.protein_g}
                  targetFat={dailyData.target.fat_g}
                  targetCarbs={dailyData.target.carbs_g}
                  targetFiber={dailyData.target.fiber_g}
                />
              </div>

              {/* Micronutrients Progress & Quick Actions (md:col-span-4) */}
              <div className="md:col-span-4 flex flex-col justify-between space-y-5">
                <MicronutrientsCard
                  fiber_g={dailyData.consumed.fiber_g}
                  fiber_target={dailyData.target.fiber_g}
                  sugar_g={dailyData.consumed.sugar_g ?? 0}
                  sugar_target={dailyData.target.sugar_g ?? 36}
                  sodium_mg={dailyData.consumed.sodium_mg ?? 0}
                  sodium_target={dailyData.target.sodium_mg ?? 2300}
                />
                <InsightsCard insights={dailyData.insights} />
              </div>
            </div>

            {/* Bottom Row: Meal Timeline (left) and 7-day Weekly Trend (right) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              {/* Meal Timeline (lg:col-span-7) */}
              <div className="lg:col-span-7">
                <MealTimeline
                  meals={dailyData.meals}
                  onSelectMeal={(meal) => {
                    setAnalyzedMealData({
                      analysis: {
                        image_path: meal.image_path || '',
                        meal_type: meal.meal_type as any,
                        is_food: true,
                        items: meal.items,
                        total_kcal: meal.total_kcal,
                        total_protein: meal.total_protein,
                        total_fat: meal.total_fat,
                        total_carbs: meal.total_carbs,
                        total_fiber: meal.total_fiber,
                        total_sugar: meal.total_sugar,
                        total_sodium: meal.total_sodium,
                        disclaimer: 'Photo estimates can be off by 10-20%. Tap any item to adjust.',
                      },
                      previewUrl: meal.image_path ? `/uploads/${meal.image_path}` : '',
                    });
                  }}
                  onDeleteMeal={handleDeleteMeal}
                  onOpenUpload={() => setIsUploadOpen(true)}
                />
              </div>

              {/* Weekly Trend (lg:col-span-5) */}
              <div className="lg:col-span-5">
                {weeklyData && (
                  <WeeklyTrendChart
                    days={weeklyData.days}
                    targetCalories={dailyData.target.kcal}
                  />
                )}
              </div>
            </div>
          </div>
        ) : null}
      </main>

      {/* Upload Dialog Modal */}
      {isUploadOpen && (
        <div className="fixed inset-0 z-50 bg-fresh-text/50 flex items-center justify-center p-4">
          <ImageInput
            onAnalysisComplete={handleAnalysisComplete}
            onCancel={() => setIsUploadOpen(false)}
          />
        </div>
      )}

      {/* Review and Edit Modal */}
      {analyzedMealData && (
        <MealReviewModal
          initialAnalysis={analyzedMealData.analysis}
          previewUrl={analyzedMealData.previewUrl}
          onSaveSuccess={handleSaveMealSuccess}
          onClose={() => setAnalyzedMealData(null)}
        />
      )}

      {/* Profile & Goals Modal */}
      {isProfileOpen && (
        <ProfileGoalsModal
          onClose={() => setIsProfileOpen(false)}
          onSaved={() => {
            queryClient.invalidateQueries({ queryKey: ['dailyDashboard'] });
            queryClient.invalidateQueries({ queryKey: ['weeklyDashboard'] });
          }}
          onOpenAuth={() => setIsAuthOpen(true)}
        />
      )}

      {/* Auth Modal (Login / Register) */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['dailyDashboard'] });
          queryClient.invalidateQueries({ queryKey: ['weeklyDashboard'] });
        }}
      />

      {/* Footer */}
      <footer className="border-t border-fresh-border bg-fresh-surface py-6 mt-12 mb-16 md:mb-0 text-center text-xs text-fresh-muted transition-colors">
        <p className="font-medium text-fresh-text font-display text-sm tracking-wide">
          NutriLens — Fresh Table Nutrition
        </p>
        <p className="mt-1 font-sans">
          Curated nutritional knowledge. Photo estimates can be off by 10–20%. Tap any item to adjust.
        </p>
      </footer>

      {/* Mobile Floating Bottom Navigation Bar (Visible on mobile/tablet screens) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-fresh-surface/95 backdrop-blur-md border-t border-fresh-border px-6 py-2 flex items-center justify-between shadow-soft-lg">
        <button
          onClick={handleToday}
          className="flex flex-col items-center gap-1 text-fresh-muted hover:text-fresh-text"
        >
          <Home className="w-5 h-5 text-fresh-primary" />
          <span className="text-[10px] font-medium">Today</span>
        </button>

        {/* Center Prominent Native Camera Trigger */}
        <div className="relative -top-4">
          <button
            onClick={() => setIsUploadOpen(true)}
            className="w-13 h-13 rounded-full bg-fresh-primary text-fresh-on-primary flex items-center justify-center shadow-lg active:scale-95 transition transform hover:scale-105"
            aria-label="Capture Meal Photo"
          >
            <Camera className="w-6 h-6" />
          </button>
        </div>

        <button
          onClick={() => setIsProfileOpen(true)}
          className="flex flex-col items-center gap-1 text-fresh-muted hover:text-fresh-text"
        >
          <User className="w-5 h-5 text-fresh-muted" />
          <span className="text-[10px] font-medium">Profile</span>
        </button>
      </div>
    </div>
  );
}
