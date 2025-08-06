import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';

interface MaintenanceRecord {
  equipment_id: string;
  equipment_name: string;
  maintenance_type: 'routine' | 'repair' | 'inspection' | 'cleaning' | 'part_replacement';
  description: string;
  completed_by: string;
  completed_at: string;
  estimated_time_minutes: number;
  parts_used?: string[];
  parts_cost_gbp?: number;
  photo_attachments?: string[];
  voice_notes?: string[];
  notes?: string;
  requires_followup?: boolean;
  followup_date?: string;
  site_id: string;
  created_at: string;
  // New fields for admin analytics
  chat_session_id?: string;
  chat_analytics?: {
    anonymized_conversation: any[];
    issue_resolution_success: boolean;
    ai_cost_gbp: number;
    response_count: number;
    resolution_time_minutes: number;
    safety_escalations: number;
    confidence_scores: number[];
  };
}

interface Database {
  public: {
    Tables: {
      maintenance_completions: {
        Row: {
          id: string;
          equipment_id: string;
          equipment_name: string;
          maintenance_type: string;
          description: string;
          completed_by: string;
          completed_at: string;
          estimated_time_minutes: number;
          parts_used: string[];
          parts_cost_gbp: number;
          photo_attachments: string[];
          voice_notes: string[];
          notes: string;
          requires_followup: boolean;
          followup_date: string;
          site_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          equipment_id: string;
          equipment_name: string;
          maintenance_type: string;
          description: string;
          completed_by: string;
          completed_at: string;
          estimated_time_minutes: number;
          parts_used?: string[];
          parts_cost_gbp?: number;
          photo_attachments?: string[];
          voice_notes?: string[];
          notes?: string;
          requires_followup?: boolean;
          followup_date?: string;
          site_id: string;
        };
      };
      equipment_costs: {
        Row: {
          id: string;
          equipment_id: string;
          cost_type: string;
          amount_gbp: number;
          description: string;
          incurred_date: string;
          site_id: string;
          created_at: string;
        };
        Insert: {
          equipment_id: string;
          cost_type: string;
          amount_gbp: number;
          description: string;
          incurred_date: string;
          site_id: string;
        };
      };
      chat_analytics: {
        Row: {
          id: string;
          equipment_type: string;
          issue_category: string;
          anonymized_conversation: any;
          resolution_outcome: string;
          ai_cost_gbp: number;
          response_count: number;
          resolution_time_minutes: number;
          safety_escalations: number;
          confidence_scores: number[];
          equipment_age_months: number;
          maintenance_frequency: string;
          created_at: string;
          site_region: string; // Anonymized - just region not specific site
        };
        Insert: {
          equipment_type: string;
          issue_category: string;
          anonymized_conversation: any;
          resolution_outcome: string;
          ai_cost_gbp: number;
          response_count: number;
          resolution_time_minutes: number;
          safety_escalations: number;
          confidence_scores: number[];
          equipment_age_months?: number;
          maintenance_frequency?: string;
          site_region?: string;
        };
      };
    };
  };
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Parse request body
    const maintenanceData: MaintenanceRecord = await req.json();

    // Validate required fields
    if (!maintenanceData.equipment_id || !maintenanceData.description || !maintenanceData.completed_by) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Missing required fields: equipment_id, description, completed_by'
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // 1. Insert maintenance completion record (MANAGER-VISIBLE - NO CHAT CONTENT)
    const { data: maintenanceRecord, error: maintenanceError } = await supabase
      .from('maintenance_completions')
      .insert({
        equipment_id: maintenanceData.equipment_id,
        equipment_name: maintenanceData.equipment_name,
        maintenance_type: maintenanceData.maintenance_type,
        description: maintenanceData.description,
        completed_by: maintenanceData.completed_by,
        completed_at: maintenanceData.completed_at,
        estimated_time_minutes: maintenanceData.estimated_time_minutes || 15,
        parts_used: maintenanceData.parts_used || [],
        parts_cost_gbp: maintenanceData.parts_cost_gbp || 0,
        photo_attachments: maintenanceData.photo_attachments || [],
        voice_notes: maintenanceData.voice_notes || [],
        notes: maintenanceData.notes || '',
        requires_followup: maintenanceData.requires_followup || false,
        followup_date: maintenanceData.followup_date || null,
        site_id: maintenanceData.site_id
      })
      .select()
      .single();

    if (maintenanceError) {
      console.error('Error inserting maintenance record:', maintenanceError);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Failed to log maintenance record',
          details: maintenanceError.message
        }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // 2. Log anonymized chat analytics for CaterBot admin (AI IMPROVEMENT DATA)
    if (maintenanceData.chat_analytics && maintenanceData.chat_session_id) {
      try {
        // Anonymize conversation - remove all personal identifiers
        const anonymizedConversation = anonymizeConversation(maintenanceData.chat_analytics.anonymized_conversation);
        
        const { error: analyticsError } = await supabase
          .from('chat_analytics')
          .insert({
            equipment_type: getEquipmentCategory(maintenanceData.equipment_name),
            issue_category: categorizeIssue(maintenanceData.description),
            anonymized_conversation: anonymizedConversation,
            resolution_outcome: maintenanceData.chat_analytics.issue_resolution_success ? 'resolved' : 'escalated',
            ai_cost_gbp: maintenanceData.chat_analytics.ai_cost_gbp || 0,
            response_count: maintenanceData.chat_analytics.response_count || 0,
            resolution_time_minutes: maintenanceData.chat_analytics.resolution_time_minutes || 0,
            safety_escalations: maintenanceData.chat_analytics.safety_escalations || 0,
            confidence_scores: maintenanceData.chat_analytics.confidence_scores || [],
            equipment_age_months: estimateEquipmentAge(maintenanceData.equipment_name),
            maintenance_frequency: 'regular', // Could be calculated from maintenance history
            site_region: 'UK-South' // Anonymized region instead of specific site
          });

        if (analyticsError) {
          console.warn('Failed to log chat analytics (non-critical):', analyticsError);
          // Don't fail the main request for analytics issues
        }
      } catch (analyticsError) {
        console.warn('Error processing chat analytics:', analyticsError);
        // Non-critical - continue with maintenance logging
      }
    }

    // 3. If parts cost was incurred, log it as equipment cost
    if (maintenanceData.parts_cost_gbp && maintenanceData.parts_cost_gbp > 0) {
      const { error: costError } = await supabase
        .from('equipment_costs')
        .insert({
          equipment_id: maintenanceData.equipment_id,
          cost_type: 'parts',
          amount_gbp: maintenanceData.parts_cost_gbp,
          description: `Parts used in ${maintenanceData.maintenance_type}: ${maintenanceData.parts_used?.join(', ') || 'Various parts'}`,
          incurred_date: maintenanceData.completed_at,
          site_id: maintenanceData.site_id
        });

      if (costError) {
        console.warn('Failed to log parts cost:', costError);
        // Don't fail the whole request for cost logging issues
      }
    }

    // 4. Update equipment status if this was a repair
    if (maintenanceData.maintenance_type === 'repair') {
      const { error: equipmentError } = await supabase
        .from('equipment')
        .update({ 
          current_status: 'operational',
          last_maintenance: maintenanceData.completed_at
        })
        .eq('id', maintenanceData.equipment_id);

      if (equipmentError) {
        console.warn('Failed to update equipment status:', equipmentError);
        // Don't fail the whole request for status update issues
      }
    }

    // 5. Calculate time savings (estimated engineer callout cost avoided)
    const estimatedSavings = calculateMaintenanceSavings(
      maintenanceData.maintenance_type,
      maintenanceData.estimated_time_minutes
    );

    // 6. Log time savings as negative cost (cost avoided)
    if (estimatedSavings > 0) {
      const { error: savingsError } = await supabase
        .from('equipment_costs')
        .insert({
          equipment_id: maintenanceData.equipment_id,
          cost_type: 'savings',
          amount_gbp: -estimatedSavings, // Negative = cost avoided
          description: `Staff maintenance avoided engineer callout - ${maintenanceData.description}`,
          incurred_date: maintenanceData.completed_at,
          site_id: maintenanceData.site_id
        });

      if (savingsError) {
        console.warn('Failed to log cost savings:', savingsError);
      }
    }

    // Prepare response with maintenance record and calculated savings
    const response = {
      success: true,
      maintenance_record: maintenanceRecord,
      estimated_savings_gbp: estimatedSavings,
      analytics_logged: !!maintenanceData.chat_analytics,
      message: `Maintenance logged successfully. Estimated savings: £${estimatedSavings.toFixed(2)}`
    };

    return new Response(
      JSON.stringify(response),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Maintenance logging error:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

/**
 * Anonymize conversation data for admin analytics
 * Removes all personal identifiers while preserving AI training value
 */
function anonymizeConversation(conversation: any[]): any[] {
  if (!Array.isArray(conversation)) return [];
  
  return conversation.map((message, index) => ({
    sequence: index,
    role: message.role, // 'user' or 'assistant'
    content_type: message.type || 'text',
    message_length: message.content?.length || 0,
    response_time_ms: message.response_time_ms || null,
    confidence_score: message.confidence_score || null,
    cost_gbp: message.cost_gbp || 0,
    classification: message.classification || null,
    contains_safety_warning: message.content?.toLowerCase().includes('safety') || false,
    contains_escalation: message.content?.toLowerCase().includes('engineer') || message.content?.toLowerCase().includes('manager') || false,
    // Remove actual content but keep metadata for AI improvement
    anonymized_content_hash: message.content ? hashString(message.content) : null
  }));
}

/**
 * Simple hash function for content anonymization
 */
function hashString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(16);
}

/**
 * Categorize equipment for analytics
 */
function getEquipmentCategory(equipmentName: string): string {
  const name = equipmentName.toLowerCase();
  
  if (name.includes('oven') || name.includes('bakery')) return 'oven';
  if (name.includes('fridge') || name.includes('freezer') || name.includes('chiller')) return 'refrigeration';
  if (name.includes('dishwasher') || name.includes('wash')) return 'dishwashing';
  if (name.includes('grill') || name.includes('griddle')) return 'grilling';
  if (name.includes('fryer')) return 'fryer';
  if (name.includes('prep') || name.includes('food processor')) return 'prep_equipment';
  if (name.includes('coffee') || name.includes('espresso')) return 'beverage';
  
  return 'general';
}

/**
 * Categorize issue type for analytics
 */
function categorizeIssue(description: string): string {
  const desc = description.toLowerCase();
  
  if (desc.includes('not heating') || desc.includes('temperature') || desc.includes('hot') || desc.includes('cold')) return 'temperature';
  if (desc.includes('not starting') || desc.includes('won\'t turn on') || desc.includes('power')) return 'power';
  if (desc.includes('noise') || desc.includes('loud') || desc.includes('grinding')) return 'mechanical';
  if (desc.includes('leak') || desc.includes('water') || desc.includes('dripping')) return 'water_leak';
  if (desc.includes('door') || desc.includes('seal') || desc.includes('handle')) return 'door_seal';
  if (desc.includes('error') || desc.includes('code') || desc.includes('display')) return 'error_code';
  if (desc.includes('cleaning') || desc.includes('maintenance') || desc.includes('routine')) return 'maintenance';
  
  return 'general';
}

/**
 * Estimate equipment age for analytics (placeholder - could be enhanced with actual data)
 */
function estimateEquipmentAge(equipmentName: string): number {
  // This would typically come from equipment registration data
  // For now, return a reasonable estimate
  return 24; // 2 years average
}

/**
 * Calculate estimated cost savings from staff maintenance vs engineer callout
 */
function calculateMaintenanceSavings(
  maintenanceType: string,
  timeSpentMinutes: number
): number {
  // Base engineer callout costs (typical UK commercial kitchen rates)
  const engineerRates = {
    'routine': 150,      // £150 for routine maintenance callout
    'repair': 250,       // £250 for repair callout + diagnostics
    'inspection': 120,   // £120 for inspection service
    'cleaning': 80,      // £80 for professional deep clean
    'part_replacement': 200 // £200 for parts replacement service
  };

  // Get base cost for this maintenance type
  const baseEngineerCost = engineerRates[maintenanceType as keyof typeof engineerRates] || 150;
  
  // Add time-based costs (£80/hour for engineer time)
  const hourlyRate = 80;
  const timeCost = (timeSpentMinutes / 60) * hourlyRate;
  
  // Total estimated engineer cost that was avoided
  const totalSavings = baseEngineerCost + timeCost;
  
  // Cap maximum savings at £500 (reasonable upper limit)
  return Math.min(totalSavings, 500);
}