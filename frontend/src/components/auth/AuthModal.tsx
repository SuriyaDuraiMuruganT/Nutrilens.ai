import React, { useState } from 'react';
import { X, LogIn, UserPlus, Sparkles, Check, AlertCircle, Shield, User, Mail, Lock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'register';
  onSuccess?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'login',
  onSuccess,
}) => {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [age, setAge] = useState(28);
  const [sex, setSex] = useState<'male' | 'female'>('male');
  const [heightCm, setHeightCm] = useState(172);
  const [weightKg, setWeightKg] = useState(68);
  const [activityLevel, setActivityLevel] = useState('moderate');
  const [goal, setGoal] = useState('maintain');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    try {
      if (mode === 'login') {
        if (!email.trim() || !password) {
          setErrorMsg('Please enter your email and password.');
          setLoading(false);
          return;
        }
        await login(email.trim(), password);
      } else {
        if (!name.trim()) {
          setErrorMsg('Please enter your full name.');
          setLoading(false);
          return;
        }
        if (!email.trim() || !password) {
          setErrorMsg('Please provide a valid email and password (minimum 6 characters).');
          setLoading(false);
          return;
        }
        if (password.length < 6) {
          setErrorMsg('Password must be at least 6 characters long.');
          setLoading(false);
          return;
        }

        await register({
          name: name.trim(),
          email: email.trim(),
          password,
          age: Number(age),
          sex,
          height_cm: Number(heightCm),
          weight_kg: Number(weightKg),
          activity_level: activityLevel,
          goal,
        });
      }

      setLoading(false);
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      setLoading(false);
      setErrorMsg(err.response?.data?.detail || err.message || 'Authentication failed. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-fresh-text/50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto backdrop-blur-xs">
      <div className="bg-fresh-surface text-fresh-text rounded-card shadow-soft-lg border border-fresh-border w-full max-w-lg my-auto overflow-hidden flex flex-col transition-colors duration-200 animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="px-6 py-4 border-b border-fresh-border flex items-center justify-between bg-fresh-surface-alt">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-fresh-primary/10 text-fresh-primary flex items-center justify-center">
              {mode === 'login' ? <LogIn className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
            </div>
            <div>
              <h2 className="font-display font-medium text-lg text-fresh-text">
                {mode === 'login' ? 'Sign In to NutriLens' : 'Create Personal Account'}
              </h2>
              <p className="text-xs text-fresh-muted">
                {mode === 'login'
                  ? 'Access your saved meals, history, and calorie targets'
                  : 'Track your personalized daily calories and nutrition over time'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-fresh-muted hover:text-fresh-text hover:bg-fresh-surface rounded-btn border border-fresh-border transition"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Guest notice banner */}
        <div className="bg-fresh-surface-alt/70 px-6 py-2 border-b border-fresh-border flex items-center gap-2 text-xs text-fresh-muted">
          <Shield className="w-3.5 h-3.5 text-fresh-primary shrink-0" />
          <span>
            {mode === 'login'
              ? 'No account needed to test food recognition — accounts unlock personal history & goals.'
              : 'All your body metrics are saved securely to auto-calculate your Mifflin-St Jeor targets.'}
          </span>
        </div>

        {/* Tab switch */}
        <div className="grid grid-cols-2 p-1.5 mx-6 mt-4 bg-fresh-surface-alt rounded-lg border border-fresh-border">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setErrorMsg(null);
            }}
            className={`py-1.5 text-xs font-medium rounded-md transition ${
              mode === 'login'
                ? 'bg-fresh-surface text-fresh-text shadow-xs font-semibold'
                : 'text-fresh-muted hover:text-fresh-text'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('register');
              setErrorMsg(null);
            }}
            className={`py-1.5 text-xs font-medium rounded-md transition ${
              mode === 'register'
                ? 'bg-fresh-surface text-fresh-text shadow-xs font-semibold'
                : 'text-fresh-muted hover:text-fresh-text'
            }`}
          >
            Create Account & Profile
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          {errorMsg && (
            <div className="p-3 rounded-lg bg-fresh-warning/10 border border-fresh-warning/20 text-fresh-warning text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {mode === 'register' && (
            <div>
              <label className="block text-xs font-medium text-fresh-text mb-1">Full Name</label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="e.g. Alex Sharma"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-btn bg-fresh-surface-alt border border-fresh-border text-fresh-text focus:outline-none focus:ring-1 focus:ring-fresh-primary"
                />
                <User className="w-4 h-4 text-fresh-muted absolute left-3 top-2.5" />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-fresh-text mb-1">Email Address</label>
            <div className="relative">
              <input
                type="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm rounded-btn bg-fresh-surface-alt border border-fresh-border text-fresh-text focus:outline-none focus:ring-1 focus:ring-fresh-primary"
              />
              <Mail className="w-4 h-4 text-fresh-muted absolute left-3 top-2.5" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-fresh-text mb-1">Password</label>
            <div className="relative">
              <input
                type="password"
                required
                placeholder={mode === 'register' ? 'At least 6 characters' : 'Enter password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm rounded-btn bg-fresh-surface-alt border border-fresh-border text-fresh-text focus:outline-none focus:ring-1 focus:ring-fresh-primary"
              />
              <Lock className="w-4 h-4 text-fresh-muted absolute left-3 top-2.5" />
            </div>
          </div>

          {/* Additional details for Registration mode */}
          {mode === 'register' && (
            <div className="space-y-3 pt-2 border-t border-fresh-border">
              <div className="flex items-center gap-1.5 text-xs font-medium text-fresh-primary">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Personal Body Metrics (for accurate calorie targets)</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-fresh-muted mb-1">Age</label>
                  <input
                    type="number"
                    min="12"
                    max="100"
                    value={age}
                    onChange={(e) => setAge(Number(e.target.value))}
                    className="w-full px-3 py-1.5 text-sm rounded-btn bg-fresh-surface-alt border border-fresh-border text-fresh-text"
                  />
                </div>
                <div>
                  <label className="block text-xs text-fresh-muted mb-1">Biological Sex</label>
                  <select
                    value={sex}
                    onChange={(e) => setSex(e.target.value as 'male' | 'female')}
                    className="w-full px-3 py-1.5 text-sm rounded-btn bg-fresh-surface-alt border border-fresh-border text-fresh-text"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-fresh-muted mb-1">Height (cm)</label>
                  <input
                    type="number"
                    min="100"
                    max="240"
                    value={heightCm}
                    onChange={(e) => setHeightCm(Number(e.target.value))}
                    className="w-full px-3 py-1.5 text-sm rounded-btn bg-fresh-surface-alt border border-fresh-border text-fresh-text"
                  />
                </div>
                <div>
                  <label className="block text-xs text-fresh-muted mb-1">Weight (kg)</label>
                  <input
                    type="number"
                    min="30"
                    max="250"
                    value={weightKg}
                    onChange={(e) => setWeightKg(Number(e.target.value))}
                    className="w-full px-3 py-1.5 text-sm rounded-btn bg-fresh-surface-alt border border-fresh-border text-fresh-text"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-fresh-muted mb-1">Activity Level</label>
                  <select
                    value={activityLevel}
                    onChange={(e) => setActivityLevel(e.target.value)}
                    className="w-full px-3 py-1.5 text-sm rounded-btn bg-fresh-surface-alt border border-fresh-border text-fresh-text"
                  >
                    <option value="sedentary">Sedentary (desk job)</option>
                    <option value="light">Lightly Active (1-3 days)</option>
                    <option value="moderate">Moderately Active (3-5 days)</option>
                    <option value="active">Very Active (6-7 days)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-fresh-muted mb-1">Primary Goal</label>
                  <select
                    value={goal}
                    onChange={(e) => setGoal(e.target.value)}
                    className="w-full px-3 py-1.5 text-sm rounded-btn bg-fresh-surface-alt border border-fresh-border text-fresh-text"
                  >
                    <option value="lose">Weight Loss (-500 kcal)</option>
                    <option value="maintain">Maintain Weight</option>
                    <option value="gain">Muscle Gain (+300 kcal)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Submit button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-btn bg-fresh-primary hover:opacity-90 active:scale-98 text-fresh-on-primary font-medium text-sm transition shadow-soft flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-fresh-on-primary border-t-transparent rounded-full animate-spin" />
              ) : mode === 'login' ? (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>Sign In</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Register & Auto-Calculate Targets</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-3 bg-fresh-surface-alt border-t border-fresh-border text-center text-xs text-fresh-muted">
          {mode === 'login' ? (
            <p>
              Don't have an account yet?{' '}
              <button
                type="button"
                onClick={() => {
                  setMode('register');
                  setErrorMsg(null);
                }}
                className="text-fresh-primary font-medium hover:underline"
              >
                Create one now
              </button>
            </p>
          ) : (
            <p>
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setErrorMsg(null);
                }}
                className="text-fresh-primary font-medium hover:underline"
              >
                Sign in here
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
