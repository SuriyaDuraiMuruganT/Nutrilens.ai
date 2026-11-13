import React from 'react';
import { Utensils, Settings, Plus, Sun, Moon, Laptop, Info, User, LogIn, LogOut } from 'lucide-react';
import { useTheme } from '../../utils/theme';
import { useAuth } from '../../context/AuthContext';

interface NavbarProps {
  onOpenUpload: () => void;
  onOpenProfile: () => void;
  onOpenAuth: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenUpload,
  onOpenProfile,
  onOpenAuth,
}) => {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const { user, isAuthenticated, logout } = useAuth();

  const handleCycleTheme = () => {
    if (theme === 'light') setTheme('dark');
    else if (theme === 'dark') setTheme('system');
    else setTheme('light');
  };

  const getThemeIcon = () => {
    if (theme === 'system') return <Laptop className="w-4 h-4 text-fresh-muted" />;
    if (resolvedTheme === 'dark') return <Moon className="w-4 h-4 text-fresh-primary" />;
    return <Sun className="w-4 h-4 text-fresh-accent" />;
  };

  const getThemeTitle = () => {
    if (theme === 'system') return 'Theme: Auto System';
    if (theme === 'dark') return 'Theme: Evening Table (Dark)';
    return 'Theme: Fresh Table (Light)';
  };

  const getThemeLabel = () => {
    if (theme === 'system') return 'System';
    if (theme === 'dark') return 'Evening';
    return 'Fresh';
  };

  return (
    <header className="sticky top-0 z-30 bg-fresh-surface border-b border-fresh-border shadow-soft transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-fresh-primary text-fresh-on-primary flex items-center justify-center shadow-soft">
              <Utensils className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display font-medium text-xl tracking-tight text-fresh-text">
                  NutriLens
                </span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-fresh-primary-soft text-fresh-primary border border-fresh-border">
                  Fresh Table
                </span>
              </div>
              <p className="text-[11px] text-fresh-muted hidden sm:block">
                Universal visual nutrition and mindful portion tracking
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Theme Toggle Button */}
            <button
              onClick={handleCycleTheme}
              className="p-2 text-fresh-muted hover:text-fresh-text hover:bg-fresh-surface-alt rounded-btn border border-fresh-border transition flex items-center gap-1.5"
              title={getThemeTitle()}
              aria-label={getThemeTitle()}
            >
              {getThemeIcon()}
              <span className="text-xs font-medium hidden md:inline">
                {getThemeLabel()}
              </span>
            </button>

            {/* Profile & Goals Button */}
            <button
              onClick={onOpenProfile}
              className="p-2 text-fresh-muted hover:text-fresh-text hover:bg-fresh-surface-alt rounded-btn border border-fresh-border transition"
              title="Nutrition Goals & Profile"
              aria-label="Nutrition Goals and Profile"
            >
              <Settings className="w-5 h-5" />
            </button>

            {/* Account / Login Button */}
            {isAuthenticated && user ? (
              <div className="flex items-center gap-1 bg-fresh-surface-alt border border-fresh-border rounded-btn p-1 pl-2">
                <button
                  onClick={onOpenProfile}
                  className="flex items-center gap-1.5 text-xs font-medium text-fresh-text hover:text-fresh-primary transition"
                  title="View your account"
                >
                  <div className="w-6 h-6 rounded-full bg-fresh-primary text-fresh-on-primary flex items-center justify-center text-[11px] font-semibold">
                    {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <span className="max-w-[90px] truncate hidden sm:inline">{user.name}</span>
                </button>
                <button
                  onClick={logout}
                  className="p-1 text-fresh-muted hover:text-fresh-warning hover:bg-fresh-surface rounded transition"
                  title="Sign out of account"
                  aria-label="Sign out"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenAuth}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-btn bg-fresh-surface-alt hover:bg-fresh-border border border-fresh-border text-fresh-text text-xs font-medium transition shadow-xs"
                title="Sign in or create account to save your meals & targets"
              >
                <LogIn className="w-3.5 h-3.5 text-fresh-primary" />
                <span>Sign In</span>
              </button>
            )}

            {/* Upload Button */}
            <button
              onClick={onOpenUpload}
              className="inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-btn bg-fresh-primary hover:opacity-90 active:scale-95 text-fresh-on-primary font-medium text-sm transition shadow-soft"
            >
              <Plus className="w-4 h-4" />
              <span>Add Meal</span>
            </button>
          </div>
        </div>
      </div>

      {/* Gentle, non-judgmental guidance notice */}
      <div className="bg-fresh-surface-alt border-t border-fresh-border px-4 py-1.5 text-center text-xs text-fresh-muted flex items-center justify-center gap-1.5">
        <Info className="w-3.5 h-3.5 text-fresh-primary shrink-0" />
        <span>Photo estimates can be off by 10-20%. Tap any item to adjust.</span>
      </div>
    </header>
  );
};
