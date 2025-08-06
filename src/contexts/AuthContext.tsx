import React, { createContext, useContext, ReactNode } from 'react';
import { useSecureAuth } from '../hooks/useSecureAuth';

interface UserData {
  id: string;
  role: 'staff' | 'manager' | 'operative' | 'super_admin';
  site_id?: string;
  site_name?: string;
  username?: string;
  email?: string;
}

interface AuthContextType {
  user: UserData | null;
  isLoading: boolean;
  error: string | null;
  createSession: (userData: UserData, tokens?: { access_token: string; refresh_token: string }) => Promise<boolean>;
  validateSession: () => Promise<boolean>;
  refreshSession: () => Promise<boolean>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const auth = useSecureAuth();

  return (
    <AuthContext.Provider value={auth}>
      {children}
    </AuthContext.Provider>
  );
};