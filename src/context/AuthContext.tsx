'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, AuthRegisterDto, AuthLoginDto } from '@/types';
import { authApi } from '@/lib/api/auth';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isAuthModalOpen: boolean;
  openAuthModal: (pendingAction?: () => void) => void;
  closeAuthModal: () => void;
  register: (data: AuthRegisterDto) => Promise<void>;
  login: (data: AuthLoginDto) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: import('@/types').UpdateProfileDto) => Promise<void>;
  pendingAction: (() => void) | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

  // Initialize auth state
  useEffect(() => {
    const initAuth = async () => {
      try {
        const currentUser = await authApi.getMe();
        if (currentUser) {
          setUser(currentUser);
        }
      } catch (err) {
        console.warn('Auth initialization check failed:', err);
      } finally {
        setIsLoading(false);
      }
    };
    initAuth();
  }, []);

  const openAuthModal = useCallback((onSuccessAction?: () => void) => {
    if (onSuccessAction) {
      setPendingAction(() => onSuccessAction);
    }
    setIsAuthModalOpen(true);
  }, []);

  const closeAuthModal = useCallback(() => {
    setIsAuthModalOpen(false);
    setPendingAction(null);
  }, []);

  const register = async (data: AuthRegisterDto) => {
    const response = await authApi.register(data);
    setUser(response.user);
    setIsAuthModalOpen(false);

    // If there was an action waiting (e.g. liking the video), execute it now!
    if (pendingAction) {
      try {
        pendingAction();
      } catch (e) {
        console.error('Pending action execution error:', e);
      }
      setPendingAction(null);
    }
  };

  const login = async (data: AuthLoginDto) => {
    const response = await authApi.login(data);
    setUser(response.user);
    setIsAuthModalOpen(false);

    if (pendingAction) {
      try {
        pendingAction();
      } catch (e) {
        console.error('Pending action execution error:', e);
      }
      setPendingAction(null);
    }
  };

  const logout = async () => {
    await authApi.logout();
    setUser(null);
  };

  const updateProfile = async (data: import('@/types').UpdateProfileDto) => {
    const updatedUser = await authApi.updateProfile(data);
    setUser(updatedUser);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        isAuthModalOpen,
        openAuthModal,
        closeAuthModal,
        register,
        login,
        logout,
        updateProfile,
        pendingAction,
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
