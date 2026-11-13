import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, UserGoals } from '../types';
import { authApi } from '../api/authApi';

interface AuthContextType {
  user: UserProfile | null;
  goals: UserGoals | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginAsGuest: () => Promise<void>;
  register: (data: {
    name: string;
    email: string;
    password: string;
    age?: number;
    sex?: 'male' | 'female';
    height_cm?: number;
    weight_kg?: number;
    activity_level?: string;
    goal?: string;
  }) => Promise<void>;
  logout: () => void;
  updateUserContext: (user: UserProfile, goals?: UserGoals) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem('nutrilens_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return null;
      }
    }
    return null;
  });

  const [goals, setGoals] = useState<UserGoals | null>(() => {
    const saved = localStorage.getItem('nutrilens_goals');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return null;
      }
    }
    return null;
  });

  const isAuthenticated = !!user && !!localStorage.getItem('nutrilens_token');

  // Verify stored session on initial mount
  useEffect(() => {
    const token = localStorage.getItem('nutrilens_token');
    if (token) {
      authApi
        .getCurrentUser()
        .then((res) => {
          setUser(res.user);
          if (res.goals) setGoals(res.goals);
          localStorage.setItem('nutrilens_user', JSON.stringify(res.user));
          if (res.goals) localStorage.setItem('nutrilens_goals', JSON.stringify(res.goals));
        })
        .catch(() => {
          // Token invalid or expired, clear and revert to guest mode
          logout();
        });
    }
  }, []);

  const login = async (email: string, password: string) => {
    const res = await authApi.login({ email, password });
    localStorage.setItem('nutrilens_token', res.token);
    localStorage.setItem('nutrilens_user', JSON.stringify(res.user));
    if (res.goals) {
      localStorage.setItem('nutrilens_goals', JSON.stringify(res.goals));
    }
    setUser(res.user);
    if (res.goals) setGoals(res.goals);
  };

  const loginAsGuest = async () => {
    const res = await authApi.guestLogin();
    const guestUser = { name: 'Guest', email: null } as any;
    localStorage.setItem('nutrilens_token', res.access_token);
    localStorage.setItem('nutrilens_user', JSON.stringify(guestUser));
    setUser(guestUser);
    setGoals(null);
  };

  const register = async (data: {
    name: string;
    email: string;
    password: string;
    age?: number;
    sex?: 'male' | 'female';
    height_cm?: number;
    weight_kg?: number;
    activity_level?: string;
    goal?: string;
  }) => {
    const res = await authApi.register(data);
    localStorage.setItem('nutrilens_token', res.token);
    localStorage.setItem('nutrilens_user', JSON.stringify(res.user));
    if (res.goals) {
      localStorage.setItem('nutrilens_goals', JSON.stringify(res.goals));
    }
    setUser(res.user);
    if (res.goals) setGoals(res.goals);
  };

  const logout = () => {
    localStorage.removeItem('nutrilens_token');
    localStorage.removeItem('nutrilens_user');
    localStorage.removeItem('nutrilens_goals');
    setUser(null);
    setGoals(null);
    window.location.reload();
  };

  const updateUserContext = (updatedUser: UserProfile, updatedGoals?: UserGoals) => {
    setUser(updatedUser);
    localStorage.setItem('nutrilens_user', JSON.stringify(updatedUser));
    if (updatedGoals) {
      setGoals(updatedGoals);
      localStorage.setItem('nutrilens_goals', JSON.stringify(updatedGoals));
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        goals,
        isAuthenticated,
        login,
        loginAsGuest,
        register,
        logout,
        updateUserContext,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};