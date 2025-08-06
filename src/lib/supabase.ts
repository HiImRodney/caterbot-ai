import { createClient, SupabaseClient } from '@supabase/supabase-js';

// ============================================================================
// ENVIRONMENT VARIABLES
// ============================================================================

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  throw new Error('Missing REACT_APP_SUPABASE_URL environment variable');
}

if (!supabaseAnonKey) {
  throw new Error('Missing REACT_APP_SUPABASE_ANON_KEY environment variable');
}

// ============================================================================
// SUPABASE CLIENT CONFIGURATION
// ============================================================================

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
  // FIXED: Removed invalid realtime configuration
  // Realtime is enabled by default in Supabase v2
  // No additional configuration needed for basic realtime functionality
});

// ============================================================================
// CHAT API INTEGRATION
// ============================================================================

export interface ChatApiResponse {
  success: boolean;
  message: string;
  equipment_detection?: any;
  issue_detection?: any;
  pattern_match?: any;
  ai_response?: any;
  error?: string;
  debug?: any;
}

// Helper to get user context from localStorage
const getUserContext = () => {
  try {
    const storedUser = localStorage.getItem('caterbot_user');
    if (storedUser) {
      return JSON.parse(storedUser);
    }
  } catch (error) {
    console.error('Error getting user context:', error);
  }
  return null;
};

export const sendChatMessage = async (
  message: string, 
  equipmentContext?: any,
  userId?: string,
  siteId?: string
): Promise<ChatApiResponse> => {
  try {
    // Get user context if not provided
    const userContext = getUserContext();
    const finalUserId = userId || userContext?.id || 'anonymous';
    const finalSiteId = siteId || userContext?.site_id;
    
    if (!finalSiteId) {
      throw new Error('Site ID is required for chat messages');
    }

    const { data, error } = await supabase.functions.invoke('master-chat', {
      body: {
        message,
        equipment_context: equipmentContext,
        user_id: finalUserId,
        site_id: finalSiteId
      }
    });

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Chat API error:', error);
    throw error;
  }
};

// Helper functions for common operations
export const supabaseHelpers = {
  // Test connection
  async testConnection() {
    try {
      const { data, error } = await supabase.from('sites').select('id').limit(1);
      if (error) throw error;
      return { success: true, message: 'Connected to Supabase successfully' };
    } catch (error) {
      return { success: false, message: `Connection failed: ${error}` };
    }
  },

  // Get equipment for a site with proper join handling
  async getEquipmentBySite(siteId: string) {
    const { data, error } = await supabase
      .from('site_equipment')
      .select(`
        id,
        qr_code,
        internal_name,
        current_status,
        performance_rating,
        is_critical_equipment,
        equipment_type_id,
        equipment_locations!inner(
          location_name
        ),
        equipment_catalog!inner(
          display_name,
          manufacturer,
          model,
          category
        )
      `)
      .eq('site_id', siteId)
      .order('internal_name');

    // Transform the data to handle joins properly
    const transformedData = data?.map(item => ({
      ...item,
      location_name: Array.isArray(item.equipment_locations) 
        ? item.equipment_locations[0]?.location_name 
        : (item.equipment_locations as any)?.location_name,
      display_name: Array.isArray(item.equipment_catalog)
        ? item.equipment_catalog[0]?.display_name
        : (item.equipment_catalog as any)?.display_name,
      manufacturer: Array.isArray(item.equipment_catalog)
        ? item.equipment_catalog[0]?.manufacturer
        : (item.equipment_catalog as any)?.manufacturer,
      model: Array.isArray(item.equipment_catalog)
        ? item.equipment_catalog[0]?.model
        : (item.equipment_catalog as any)?.model,
      category: Array.isArray(item.equipment_catalog)
        ? item.equipment_catalog[0]?.category
        : (item.equipment_catalog as any)?.category,
    }));

    return { data: transformedData, error };
  },

  // Scan QR code
  async scanQRCode(qrCode: string, siteId?: string) {
    // Get site ID from user context if not provided
    const userContext = getUserContext();
    const finalSiteId = siteId || userContext?.site_id;
    
    const { data, error } = await supabase.functions.invoke('qr-scanner', {
      body: { 
        qr_code: qrCode,
        site_id: finalSiteId
      }
    });

    return { data, error };
  },

  // Start chat session
  async startChatSession(userMessage: string, qrCode?: string, equipmentId?: string, siteId?: string) {
    // Get site ID from user context if not provided
    const userContext = getUserContext();
    const finalSiteId = siteId || userContext?.site_id;
    
    if (!finalSiteId) {
      throw new Error('Site ID is required for chat sessions');
    }

    const { data, error } = await supabase.functions.invoke('master-chat', {
      body: {
        user_message: userMessage,
        qr_code: qrCode,
        equipment_id: equipmentId,
        site_id: finalSiteId
      }
    });

    return { data, error };
  }
};

// ============================================================================
// REAL-TIME SUBSCRIPTIONS
// ============================================================================

export const subscribeToEquipmentChanges = (
  siteId: string,
  callback: (payload: any) => void
) => {
  return supabase
    .channel('equipment_changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'site_equipment',
        filter: `site_id=eq.${siteId}`
      },
      callback
    )
    .subscribe();
};

export const subscribeToChatMessages = (
  sessionId: string,
  callback: (payload: any) => void
) => {
  return supabase
    .channel('chat_messages')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages',
        filter: `session_id=eq.${sessionId}`
      },
      callback
    )
    .subscribe();
};

// ============================================================================
// AUTHENTICATION HELPERS
// ============================================================================

export const signInWithEmailPassword = async (email: string, password: string) => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Authentication error:', error);
    throw error;
  }
};

export const signInWithUsernameCode = async (username: string, joinCode: string, siteId?: string) => {
  try {
    // Custom authentication for staff using username + join code
    const { data, error } = await supabase.functions.invoke('user-authentication', {
      body: {
        username,
        join_code: joinCode,
        auth_type: 'staff',
        site_id: siteId // Optional, the Edge Function should handle finding the site from join code
      }
    });

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Staff authentication error:', error);
    throw error;
  }
};

export const getCurrentUser = async () => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error) {
      throw error;
    }

    return user;
  } catch (error) {
    console.error('Get user error:', error);
    throw error;
  }
};

export const signOut = async () => {
  try {
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      throw error;
    }
  } catch (error) {
    console.error('Sign out error:', error);
    throw error;
  }
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

export const isSupabaseConfigured = (): boolean => {
  return !!(supabaseUrl && supabaseAnonKey);
};

export const getSupabaseUrl = (): string => {
  return supabaseUrl;
};

export const testConnection = async (): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('sites')
      .select('id')
      .limit(1);

    return !error;
  } catch (error) {
    console.error('Supabase connection test failed:', error);
    return false;
  }
};

// Export types for better TypeScript support
export type { Database } from './database.types';

// Log initialization
console.log('✅ Supabase client initialized:', {
  url: supabaseUrl,
  hasAnonKey: !!supabaseAnonKey,
  realtime: 'enabled by default'
});

export default supabase;