import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

interface UserData {
  id: string;
  role: 'staff' | 'manager' | 'operative' | 'super_admin';
  site_id?: string;
  site_name?: string;
  username?: string;
  email?: string;
}

interface UseSecureAuthReturn {
  user: UserData | null;
  isLoading: boolean;
  error: string | null;
  createSession: (userData: UserData, tokens?: { access_token: string; refresh_token: string }) => Promise<boolean>;
  validateSession: () => Promise<boolean>;
  refreshSession: () => Promise<boolean>;
  logout: () => Promise<void>;
}

export const useSecureAuth = (): UseSecureAuthReturn => {
  const [user, setUser] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  // Session validation on mount and periodic checks
  useEffect(() => {
    validateSession();

    // Check session every 5 minutes
    const interval = setInterval(() => {
      validateSession();
    }, 5 * 60 * 1000);

    // Warn before session expiry (25 minutes)
    const warningTimeout = setTimeout(() => {
      if (user) {
        const shouldExtend = window.confirm(
          'Your session will expire soon. Would you like to continue working?'
        );
        if (shouldExtend) {
          refreshSession();
        }
      }
    }, 25 * 60 * 1000);

    return () => {
      clearInterval(interval);
      clearTimeout(warningTimeout);
    };
  }, []);

  const createSession = useCallback(async (
    userData: UserData,
    tokens?: { access_token: string; refresh_token: string }
  ): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);

      const { data, error: sessionError } = await supabase.functions.invoke('session-manager', {
        body: {
          action: 'create',
          userId: userData.id,
          role: userData.role,
          siteId: userData.site_id,
          siteName: userData.site_name,
          username: userData.username,
          email: userData.email,
          accessToken: tokens?.access_token,
          refreshToken: tokens?.refresh_token
        }
      });

      if (sessionError || !data.success) {
        throw new Error(sessionError?.message || data.error || 'Failed to create session');
      }

      setUser(data.user);
      
      // Remove localStorage usage
      // localStorage.setItem('caterbot_user', JSON.stringify(data.user));
      
      return true;
    } catch (err: any) {
      console.error('Session creation error:', err);
      setError(err.message);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const validateSession = useCallback(async (): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);

      const { data, error: sessionError } = await supabase.functions.invoke('session-manager', {
        body: { action: 'validate' }
      });

      if (sessionError || !data.success) {
        // Session invalid or expired
        setUser(null);
        
        // Clean up any legacy localStorage
        localStorage.removeItem('caterbot_user');
        
        if (window.location.pathname !== '/login' && window.location.pathname !== '/') {
          navigate('/login');
        }
        return false;
      }

      setUser(data.user);
      return true;
    } catch (err: any) {
      console.error('Session validation error:', err);
      setError(err.message);
      setUser(null);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [navigate]);

  const refreshSession = useCallback(async (): Promise<boolean> => {
    try {
      setError(null);

      const { data, error: sessionError } = await supabase.functions.invoke('session-manager', {
        body: { action: 'refresh' }
      });

      if (sessionError || !data.success) {
        throw new Error(sessionError?.message || data.error || 'Failed to refresh session');
      }

      // Session refreshed successfully
      return true;
    } catch (err: any) {
      console.error('Session refresh error:', err);
      setError(err.message);
      
      // If refresh fails, validate session (might need re-login)
      await validateSession();
      return false;
    }
  }, [validateSession]);

  const logout = useCallback(async (): Promise<void> => {
    try {
      setIsLoading(true);
      
      // Call session manager to delete session
      await supabase.functions.invoke('session-manager', {
        body: { action: 'delete' }
      });

      // Sign out from Supabase Auth if applicable
      if (user?.role !== 'staff') {
        await supabase.auth.signOut();
      }

      // Clear state
      setUser(null);
      
      // Clean up any legacy localStorage
      localStorage.removeItem('caterbot_user');
      
      // Navigate to home
      navigate('/');
    } catch (err: any) {
      console.error('Logout error:', err);
      // Navigate anyway
      navigate('/');
    } finally {
      setIsLoading(false);
    }
  }, [user, navigate]);

  return {
    user,
    isLoading,
    error,
    createSession,
    validateSession,
    refreshSession,
    logout
  };
};