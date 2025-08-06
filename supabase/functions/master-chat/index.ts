import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

interface ChatRequest {
  qr_code?: string;
  equipment_id?: string;
  user_message: string;
  user_id?: string;
  site_id?: string;
}

interface EquipmentContext {
  id: string;
  equipment_type_id: string;
  internal_name: string;
  location_name: string;
  manufacturer: string;
  display_name: string;
  category: string;
  current_status: string;
  has_decision_tree: boolean;
}

Deno.serve(async (req: Request) => {
  // CORS handling
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const chatRequest: ChatRequest = await req.json();
    
    // Get equipment context if QR code or equipment_id provided
    let equipmentContext: EquipmentContext | null = null;
    
    if (chatRequest.qr_code) {
      const { data: equipment } = await supabase
        .from('site_equipment')
        .select(`
          id,
          equipment_type_id,
          internal_name,
          current_status,
          equipment_locations(location_name),
          equipment_catalog(
            manufacturer,
            display_name,
            category,
            has_decision_tree
          )
        `)
        .eq('qr_code', chatRequest.qr_code)
        .single();

      if (equipment) {
        equipmentContext = {
          id: equipment.id,
          equipment_type_id: equipment.equipment_type_id,
          internal_name: equipment.internal_name,
          location_name: equipment.equipment_locations?.location_name || 'Unknown',
          manufacturer: equipment.equipment_catalog?.manufacturer || 'Unknown',
          display_name: equipment.equipment_catalog?.display_name || 'Unknown Equipment',
          category: equipment.equipment_catalog?.category || 'unknown',
          current_status: equipment.current_status,
          has_decision_tree: equipment.equipment_catalog?.has_decision_tree || false
        };
      }
    }

    // Step 1: Try pattern matching first (75% of responses for cost optimization)
    const patternResponse = await tryPatternMatching(
      supabase,
      chatRequest.user_message,
      equipmentContext
    );

    if (patternResponse.success && patternResponse.confidence > 0.8) {
      // Log successful pattern match (free response)
      await logChatInteraction(supabase, {
        equipment_id: equipmentContext?.id,
        user_message: chatRequest.user_message,
        ai_response: patternResponse.response,
        response_type: 'pattern',
        confidence_score: patternResponse.confidence,
        tokens_used: 0,
        cost_gbp: 0,
        site_id: chatRequest.site_id
      });

      return new Response(JSON.stringify({
        success: true,
        response: patternResponse.response,
        equipment_context: equipmentContext,
        response_type: 'pattern_match',
        cost_gbp: 0
      }), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    // Step 2: Check for safety escalation (gas/electrical)
    const safetyCheck = checkSafetyEscalation(chatRequest.user_message);
    if (safetyCheck.requires_escalation) {
      const safetyResponse = generateSafetyResponse(safetyCheck.issue_type);
      
      await logChatInteraction(supabase, {
        equipment_id: equipmentContext?.id,
        user_message: chatRequest.user_message,
        ai_response: safetyResponse,
        response_type: 'escalation',
        confidence_score: 1.0,
        tokens_used: 0,
        cost_gbp: 0,
        escalated_to_human: true,
        site_id: chatRequest.site_id
      });

      return new Response(JSON.stringify({
        success: true,
        response: safetyResponse,
        equipment_context: equipmentContext,
        response_type: 'safety_escalation',
        escalation_required: true,
        cost_gbp: 0
      }), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    // Step 3: AI escalation (25% of responses - costs money)
    const aiResponse = await callAIEscalation(
      chatRequest.user_message,
      equipmentContext
    );

    // Log AI interaction (paid response)
    await logChatInteraction(supabase, {
      equipment_id: equipmentContext?.id,
      user_message: chatRequest.user_message,
      ai_response: aiResponse.response,
      response_type: 'ai',
      confidence_score: aiResponse.confidence,
      tokens_used: aiResponse.tokens_used,
      cost_gbp: aiResponse.cost_gbp,
      site_id: chatRequest.site_id
    });

    return new Response(JSON.stringify({
      success: true,
      response: aiResponse.response,
      equipment_context: equipmentContext,
      response_type: 'ai_escalation',
      cost_gbp: aiResponse.cost_gbp,
      tokens_used: aiResponse.tokens_used
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });

  } catch (error) {
    console.error('Master chat error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to process chat request',
      details: error.message
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
});

// Pattern matching function (75% of responses)
async function tryPatternMatching(
  supabase: any,
  userMessage: string,
  equipment: EquipmentContext | null
): Promise<{ success: boolean; response: string; confidence: number }> {
  
  const message = userMessage.toLowerCase();
  
  // High-confidence refrigeration patterns
  if (equipment?.category === 'refrigeration') {
    if (message.includes('not cold') || message.includes('not cooling') || message.includes('warm')) {
      return {
        success: true,
        confidence: 0.9,
        response: `I can help with cooling issues on your ${equipment.display_name}.\n\n**Quick checks:**\n1. Is the door sealing properly?\n2. Are the air vents clear of obstructions?\n3. What temperature is showing on the display?\n\nPlease check these and let me know what you find. If it's still not cooling properly, I'll escalate to a professional service call.`
      };
    }
    
    if (message.includes('door') && (message.includes('stuck') || message.includes('won\'t close') || message.includes('loose'))) {
      return {
        success: true,
        confidence: 0.85,
        response: `Door issues on refrigeration equipment need immediate attention.\n\n**Safety first:** Don't force a stuck door.\n\n**Quick check:** Look for ice buildup around the door seal or any visible damage to the hinges.\n\nFor your ${equipment.display_name}, this usually requires a service call. Would you like me to log this as a maintenance request?`
      };
    }
  }
  
  // High-confidence cooking equipment patterns
  if (equipment?.category === 'cooking') {
    if (message.includes('gas') && (message.includes('smell') || message.includes('leak'))) {
      return {
        success: true,
        confidence: 1.0,
        response: `🚨 **GAS SAFETY ALERT** 🚨\n\n**IMMEDIATE ACTION REQUIRED:**\n1. Turn off the gas supply immediately\n2. Open windows for ventilation\n3. Do not use electrical switches\n4. Call Gas Safe registered engineer: 0800 111 999\n\n**This is a safety emergency and must be handled by qualified professionals only.**`
      };
    }
    
    if (message.includes('not heating') || message.includes('won\'t turn on') || message.includes('no power')) {
      return {
        success: true,
        confidence: 0.8,
        response: `Let's troubleshoot the ${equipment.display_name} not heating issue.\n\n**Check these in order:**\n1. Is the power switch ON?\n2. Is the main isolation switch ON?\n3. Check if any circuit breakers have tripped\n4. Look for any error codes on the display\n\nWhat do you see when you check these items?`
      };
    }
  }
  
  // Medium-confidence general patterns
  if (message.includes('making noise') || message.includes('loud') || message.includes('banging')) {
    return {
      success: true,
      confidence: 0.7,
      response: `Unusual noises from equipment often indicate a developing issue.\n\n**Please describe:**\n- Is it a grinding, clicking, humming, or banging sound?\n- Is it constant or intermittent?\n- When did it start?\n\nBased on your answers, I can provide specific guidance for your ${equipment?.display_name || 'equipment'}.`
    };
  }
  
  // General equipment questions
  if (message.includes('how') && (message.includes('clean') || message.includes('maintenance'))) {
    return {
      success: true,
      confidence: 0.6,
      response: `I can guide you through proper cleaning and maintenance procedures.\n\n**For ${equipment?.display_name || 'your equipment'}:**\n\nWhat specific cleaning task do you need help with? I can provide step-by-step instructions for safe cleaning procedures.`
    };
  }
  
  return { success: false, response: '', confidence: 0 };
}

// Safety escalation checker
function checkSafetyEscalation(message: string): { requires_escalation: boolean; issue_type: string } {
  const lowerMessage = message.toLowerCase();
  
  // Gas safety issues
  if (lowerMessage.includes('gas') && (lowerMessage.includes('smell') || lowerMessage.includes('leak') || lowerMessage.includes('odor'))) {
    return { requires_escalation: true, issue_type: 'gas_leak' };
  }
  
  // Electrical safety issues
  if (lowerMessage.includes('electric') && (lowerMessage.includes('shock') || lowerMessage.includes('sparking') || lowerMessage.includes('burning smell'))) {
    return { requires_escalation: true, issue_type: 'electrical' };
  }
  
  // Fire/burning issues
  if (lowerMessage.includes('fire') || lowerMessage.includes('smoke') || lowerMessage.includes('burning')) {
    return { requires_escalation: true, issue_type: 'fire_safety' };
  }
  
  return { requires_escalation: false, issue_type: '' };
}

// Generate safety response
function generateSafetyResponse(issueType: string): string {
  switch (issueType) {
    case 'gas_leak':
      return `🚨 **GAS SAFETY EMERGENCY** 🚨\n\n**IMMEDIATE ACTIONS:**\n1. Turn off gas supply immediately\n2. Open windows and doors\n3. Do not use electrical switches\n4. Evacuate the area\n5. Call Gas Safe Register: 0800 111 999\n\n**This requires immediate professional attention. Do not attempt repairs.**`;
    
    case 'electrical':
      return `⚡ **ELECTRICAL SAFETY ALERT** ⚡\n\n**IMMEDIATE ACTIONS:**\n1. Turn off power at the main switch\n2. Do not touch the equipment\n3. Keep area clear\n4. Call qualified electrician immediately\n\n**Only qualified electricians should handle electrical repairs.**`;
    
    case 'fire_safety':
      return `🔥 **FIRE SAFETY EMERGENCY** 🔥\n\n**IMMEDIATE ACTIONS:**\n1. Call 999 immediately\n2. Evacuate the building\n3. Do not use water on electrical fires\n4. Use fire extinguisher only if safe to do so\n\n**Safety is the priority - evacuate and call emergency services.**`;
    
    default:
      return `🚨 **SAFETY ALERT** 🚨\n\nThis issue requires immediate professional attention. Please contact a qualified technician and do not attempt repairs yourself.`;
  }
}

// AI escalation (costs money - 25% of responses)
async function callAIEscalation(
  userMessage: string,
  equipment: EquipmentContext | null
): Promise<{ response: string; confidence: number; tokens_used: number; cost_gbp: number }> {
  
  // For now, return a structured response until we integrate Claude API
  const response = `I understand you need help with: "${userMessage}"\n\n${equipment ? `**Equipment:** ${equipment.display_name} (${equipment.internal_name})\n**Location:** ${equipment.location_name}\n**Status:** ${equipment.current_status}\n\n` : ''}I'm analyzing this issue and will provide detailed troubleshooting steps. This is where I would normally use AI to provide a comprehensive response based on the equipment manuals and technical specifications.\n\nFor now, I recommend checking the basic operational status and contacting your maintenance team if the issue persists.`;
  
  return {
    response,
    confidence: 0.7,
    tokens_used: 150, // Estimated
    cost_gbp: 0.0015 // Estimated Claude API cost
  };
}

// Log chat interaction
async function logChatInteraction(supabase: any, logData: any) {
  try {
    const { error } = await supabase
      .from('chat_logs')
      .insert({
        equipment_id: logData.equipment_id,
        user_message: logData.user_message,
        ai_response: logData.ai_response,
        response_type: logData.response_type,
        confidence_score: logData.confidence_score,
        tokens_used: logData.tokens_used,
        cost_gbp: logData.cost_gbp,
        escalated_to_human: logData.escalated_to_human || false,
        site_id: logData.site_id
      });
    
    if (error) {
      console.error('Failed to log chat interaction:', error);
    }
  } catch (error) {
    console.error('Error logging chat interaction:', error);
  }
}