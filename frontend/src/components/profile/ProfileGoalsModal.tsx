import React, { useState, useEffect } from 'react';
import { X, Calculator, ShieldAlert, Check, Target } from 'lucide-react';
import { profileApi } from '../../api/profileApi';
import { UserProfile, UserGoals } from '../../types';

import { useAuth } from '../../context/AuthContext';

interface ProfileGoalsModalProps {
  onClose: () => void;
  onSaved: () => void;
  onOpenAuth?: () => void;
}

export const ProfileGoalsModal: React.FC<ProfileGoalsModalProps> = ({ onClose, onSaved, onOpenAuth }) => {
  const { user: authUser, isAuthenticated, updateUserContext, logout } = useAuth();
  const [profile, setProfile] = useState<UserProfile>({
    id: 1,
    name: 'Default User',
    email: '',
    age: 28,
    sex: 'male',
    height_cm: 175,
    weight_kg: 70,
    activity_level: 'moderate',
    goal: 'maintain',
  });

  const [goals, setGoals] = useState<UserGoals>({
    id: 1,
    user_id: 1,
    kcal_target: 2000,
    protein_g: 120,
    fat_g: 65,
    carbs_g: 220,
    fiber_g: 30,
  });

  const [serverUrl, setServerUrl] = useState(() => {
    const saved = localStorage.getItem('nutrilens_server_url');
    if (saved && (saved.includes('10.50.') || saved.includes('192.168.') || saved.includes('localhost'))) {
      localStorage.removeItem('nutrilens_server_url');
      return 'https://nutrilens-app-production.up.railway.app';
    }
    return saved || 'https://nutrilens-app-production.up.railway.app';
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [safetyNotice, setSafetyNotice] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [profData, goalData] = await Promise.all([
          profileApi.getProfile(),
          profileApi.getGoals(),
        ]);
        setProfile(profData);
        setGoals(goalData);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleCalculateMifflin = async () => {
    try {
      const calc = await profileApi.calculateTargets(profile);
      setGoals((prev) => ({
        ...prev,
        kcal_target: calc.clamped_kcal,
        protein_g: calc.protein_g,
        fat_g: calc.fat_g,
        carbs_g: calc.carbs_g,
        fiber_g: calc.fiber_g,
      }));

      if (calc.is_clamped_by_safety) {
        setSafetyNotice(calc.message || 'Calorie target clamped to the safe floor of 1,200 kcal/day.');
      } else {
        setSafetyNotice(null);
        setSuccessMsg(`Targets calculated via Mifflin-St Jeor formula (BMR: ${calc.bmr} kcal, TDEE: ${calc.tdee} kcal).`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleKcalTargetChange = (val: number) => {
    if (val < 1200) {
      setSafetyNotice('Safety Guardrail: Calorie target cannot be set below 1,200 kcal/day.');
      setGoals({ ...goals, kcal_target: 1200 });
    } else {
      setSafetyNotice(null);
      setGoals({ ...goals, kcal_target: val });
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      if (serverUrl && serverUrl.trim()) {
        localStorage.setItem('nutrilens_server_url', serverUrl.trim());
      }
      const [updatedUser, updatedGoals] = await Promise.all([
        profileApi.updateProfile(profile),
        profileApi.updateGoals(goals),
      ]);
      if (isAuthenticated) {
        updateUserContext(updatedUser, updatedGoals);
      }
      setIsSaving(false);
      onSaved();
      onClose();
    } catch (err: any) {
      setIsSaving(false);
      setSafetyNotice(err.response?.data?.detail || 'Failed to save settings.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-fresh-text/50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-fresh-surface text-fresh-text rounded-card shadow-soft-lg border border-fresh-border w-full max-w-2xl my-auto overflow-hidden transition-colors duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-fresh-border flex items-center justify-between bg-fresh-surface-alt">
          <div>
            <h2 className="font-display font-medium text-lg text-fresh-text flex items-center gap-2">
              <Target className="w-5 h-5 text-fresh-primary" />
              Nutrition Goals & Personal Profile
            </h2>
            <p className="text-xs text-fresh-muted">
              {isAuthenticated && authUser?.email
                ? `Signed in as ${authUser.email}`
                : 'Guest Profile — Sign in to sync and track across sessions'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-fresh-muted hover:text-fresh-text rounded-btn border border-fresh-border bg-fresh-surface hover:bg-fresh-surface-alt transition"
            aria-label="Close settings"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[78vh] overflow-y-auto">
          {!isAuthenticated && onOpenAuth && (
            <div className="p-3 bg-fresh-primary-soft/50 border border-fresh-primary/20 rounded-card flex items-center justify-between gap-3 text-xs">
              <div>
                <p className="font-semibold text-fresh-primary">Looking to save your meals & progress?</p>
                <p className="text-fresh-muted text-[11px]">Sign in or create an account to retain your calorie tracking history.</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenAuth();
                }}
                className="px-3 py-1.5 rounded-btn bg-fresh-primary text-fresh-on-primary font-medium hover:opacity-90 shrink-0"
              >
                Sign In / Register
              </button>
            </div>
          )}

          {safetyNotice && (
            <div className="p-4 bg-fresh-warning-soft border border-fresh-warning/30 rounded-card flex items-start gap-3 text-fresh-warning text-xs">
              <ShieldAlert className="w-5 h-5 text-fresh-warning shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Safety Notice</p>
                <p className="mt-0.5 leading-relaxed">{safetyNotice}</p>
              </div>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-fresh-primary-soft border border-fresh-primary/20 rounded-card flex items-center gap-2 text-fresh-primary text-xs font-medium">
              <Check className="w-4 h-4 text-fresh-primary" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Section 1: User Profile & Metrics */}
          <div>
            <h3 className="text-xs font-medium text-fresh-muted uppercase tracking-wider mb-3">
              1. Account & Body Metrics
            </h3>

            {/* Name and Email */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
              <div>
                <label className="block text-xs font-medium text-fresh-text mb-1">Display Name</label>
                <input
                  type="text"
                  value={profile.name}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-fresh-surface-alt border border-fresh-border rounded-btn outline-none focus:border-fresh-primary font-medium text-fresh-text"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-fresh-text mb-1">Email</label>
                <input
                  type="email"
                  value={profile.email || ''}
                  onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                  placeholder="name@example.com"
                  className="w-full px-3 py-2 text-sm bg-fresh-surface-alt border border-fresh-border rounded-btn outline-none focus:border-fresh-primary font-medium text-fresh-text"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-medium text-fresh-text mb-1">Age</label>
                <input
                  type="number"
                  value={profile.age}
                  onChange={(e) => setProfile({ ...profile, age: Number(e.target.value) })}
                  className="w-full px-3 py-2 text-sm bg-fresh-surface-alt border border-fresh-border rounded-btn outline-none focus:border-fresh-primary font-medium text-fresh-text tabular-nums"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-fresh-text mb-1">Sex</label>
                <select
                  value={profile.sex}
                  onChange={(e) => setProfile({ ...profile, sex: e.target.value as 'male' | 'female' })}
                  className="w-full px-3 py-2 text-sm bg-fresh-surface-alt border border-fresh-border rounded-btn outline-none focus:border-fresh-primary font-medium capitalize text-fresh-text"
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-fresh-text mb-1">Height (cm)</label>
                <input
                  type="number"
                  value={profile.height_cm}
                  onChange={(e) => setProfile({ ...profile, height_cm: Number(e.target.value) })}
                  className="w-full px-3 py-2 text-sm bg-fresh-surface-alt border border-fresh-border rounded-btn outline-none focus:border-fresh-primary font-medium text-fresh-text tabular-nums"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-fresh-text mb-1">Weight (kg)</label>
                <input
                  type="number"
                  value={profile.weight_kg}
                  onChange={(e) => setProfile({ ...profile, weight_kg: Number(e.target.value) })}
                  className="w-full px-3 py-2 text-sm bg-fresh-surface-alt border border-fresh-border rounded-btn outline-none focus:border-fresh-primary font-medium text-fresh-text tabular-nums"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
              <div>
                <label className="block text-xs font-medium text-fresh-text mb-1">Activity Level</label>
                <select
                  value={profile.activity_level}
                  onChange={(e) => setProfile({ ...profile, activity_level: e.target.value as any })}
                  className="w-full px-3 py-2 text-sm bg-fresh-surface-alt border border-fresh-border rounded-btn outline-none focus:border-fresh-primary font-medium text-fresh-text"
                >
                  <option value="sedentary">Sedentary (Little or no exercise)</option>
                  <option value="light">Lightly Active (1-3 days/wk)</option>
                  <option value="moderate">Moderately Active (3-5 days/wk)</option>
                  <option value="active">Active (6-7 days/wk)</option>
                  <option value="very_active">Very Active (Twice daily training)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-fresh-text mb-1">Primary Goal</label>
                <select
                  value={profile.goal}
                  onChange={(e) => setProfile({ ...profile, goal: e.target.value as any })}
                  className="w-full px-3 py-2 text-sm bg-fresh-surface-alt border border-fresh-border rounded-btn outline-none focus:border-fresh-primary font-medium text-fresh-text"
                >
                  <option value="lose">Gentle Deficit (-500 kcal/day)</option>
                  <option value="maintain">Maintenance</option>
                  <option value="gain">Surplus & Strength (+400 kcal/day)</option>
                </select>
              </div>
            </div>

            {/* Calculate Button */}
            <div className="mt-4">
              <button
                type="button"
                onClick={handleCalculateMifflin}
                className="w-full py-2.5 px-4 rounded-btn bg-fresh-primary-soft hover:opacity-90 text-fresh-primary font-medium text-xs flex items-center justify-center gap-2 border border-fresh-primary/20 transition"
              >
                <Calculator className="w-4 h-4 text-fresh-primary" />
                <span>Auto-Calculate Targets via Mifflin-St Jeor</span>
              </button>
            </div>
          </div>

          {/* Section 2: Daily Macro Targets */}
          <div className="pt-4 border-t border-fresh-border">
            <h3 className="text-xs font-medium text-fresh-muted uppercase tracking-wider mb-3">
              2. Daily Nutrition Targets
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <div className="col-span-2 sm:col-span-1">
                <label className="block text-xs font-medium text-fresh-text mb-1">Calories (kcal)</label>
                <input
                  type="number"
                  min="1200"
                  max="6000"
                  value={goals.kcal_target}
                  onChange={(e) => handleKcalTargetChange(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm bg-fresh-surface-alt border border-fresh-border rounded-btn outline-none focus:border-fresh-primary font-display font-medium text-[var(--nutrient-calories-from)] tabular-nums"
                />
                <span className="text-[10px] text-fresh-muted mt-0.5 block">Safety floor 1,200</span>
              </div>

              <div>
                <label className="block text-xs font-medium text-fresh-text mb-1">Protein (g)</label>
                <input
                  type="number"
                  min="20"
                  value={goals.protein_g}
                  onChange={(e) => setGoals({ ...goals, protein_g: Number(e.target.value) })}
                  className="w-full px-3 py-2 text-sm bg-fresh-surface-alt border border-fresh-border rounded-btn outline-none font-medium tabular-nums text-[var(--nutrient-protein)]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-fresh-text mb-1">Carbs (g)</label>
                <input
                  type="number"
                  min="30"
                  value={goals.carbs_g}
                  onChange={(e) => setGoals({ ...goals, carbs_g: Number(e.target.value) })}
                  className="w-full px-3 py-2 text-sm bg-fresh-surface-alt border border-fresh-border rounded-btn outline-none font-medium tabular-nums text-[var(--nutrient-carbs)]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-fresh-text mb-1">Fat (g)</label>
                <input
                  type="number"
                  min="10"
                  value={goals.fat_g}
                  onChange={(e) => setGoals({ ...goals, fat_g: Number(e.target.value) })}
                  className="w-full px-3 py-2 text-sm bg-fresh-surface-alt border border-fresh-border rounded-btn outline-none font-medium tabular-nums text-[var(--nutrient-fat)]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-fresh-text mb-1">Fiber (g)</label>
                <input
                  type="number"
                  min="5"
                  value={goals.fiber_g}
                  onChange={(e) => setGoals({ ...goals, fiber_g: Number(e.target.value) })}
                  className="w-full px-3 py-2 text-sm bg-fresh-surface-alt border border-fresh-border rounded-btn outline-none font-medium tabular-nums text-[var(--nutrient-fiber)]"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Mobile App Backend Connection */}
          <div className="pt-2 border-t border-fresh-border">
            <h3 className="text-xs font-medium text-fresh-muted uppercase tracking-wider mb-2">
              3. Mobile App Connection (Backend Server)
            </h3>
            <p className="text-[11px] text-fresh-muted mb-2">
              If running on a mobile phone, set your PC's local Wi-Fi IP address so the phone can reach the backend.
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                value={serverUrl}
                onChange={(e) => setServerUrl(e.target.value)}
                placeholder="http://10.50.6.248:8000"
                className="flex-1 px-3 py-2 text-xs bg-fresh-surface-alt border border-fresh-border rounded-btn outline-none text-fresh-text"
              />
              <button
                type="button"
                onClick={() => setServerUrl('http://10.50.6.248:8000')}
                className="px-3 py-2 rounded-btn bg-fresh-surface-alt border border-fresh-border text-xs text-fresh-primary hover:bg-fresh-surface font-medium"
              >
                Reset Default
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-fresh-surface-alt border-t border-fresh-border flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-btn text-xs font-medium text-fresh-muted hover:text-fresh-text border border-fresh-border bg-fresh-surface hover:bg-fresh-surface-alt transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-6 py-2.5 rounded-btn bg-fresh-primary hover:opacity-90 active:scale-[0.98] text-fresh-on-primary font-medium text-xs shadow-soft transition"
          >
            {isSaving ? 'Saving...' : 'Save Targets'}
          </button>
        </div>
      </div>
    </div>
  );
};
