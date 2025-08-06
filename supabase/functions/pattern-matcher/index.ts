import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

// Pattern matching responses database
const patternResponses = {
  // SAFETY CRITICAL RESPONSES
  'gas_issue': {
    response: '🚨 SAFETY EMERGENCY: Turn off all gas equipment immediately. Evacuate the area. Do not use electrical switches. Ventilate if safe to do so. Call 999 if strong gas odor. Contact manager immediately.',
    priority: 'critical',
    escalate: true
  },
  'electrical_issue': {
    response: '🚨 ELECTRICAL SAFETY: Turn off equipment at breaker if safe to access. Do not touch equipment. Keep area clear. Contact electrician immediately.',
    priority: 'critical', 
    escalate: true
  },
  'fire_safety_issue': {
    response: '🚨 FIRE SAFETY: Turn off equipment immediately. If smoke persists, evacuate and call 999. Do not use water on electrical or grease fires.',
    priority: 'critical',
    escalate: true
  },
  'water_emergency': {
    response: '🚨 WATER EMERGENCY: Turn off water supply if accessible. Turn off electrical equipment in affected area. Contact emergency plumber immediately.',
    priority: 'critical',
    escalate: true
  },
  
  // EQUIPMENT + ISSUE COMBINATIONS
  'commercial_fridge_temperature_issue': {
    response: 'Check door seals are closing tightly. Clean condenser coils if accessible. Verify temperature setting (3-5°C). Check nothing is blocking air vents.',
    priority: 'high',
    escalate: false
  },
  'dishwasher_cleaning_issue': {
    response: 'Check rinse aid dispenser and refill if empty. Clean spray arms of any debris. Verify correct detergent amount. Check water temperature reaches 60°C.',
    priority: 'medium',
    escalate: false
  },
  'commercial_fryer_oil_issue': {
    response: 'Check oil quality - dark or foamy oil affects performance. Verify temperature setting. Allow adequate warm-up time. Consider oil change if degraded.',
    priority: 'medium',
    escalate: false
  },
  'commercial_oven_heating_issue': {
    response: 'Check power connection and settings. For gas ovens, verify pilot light (do not adjust gas yourself). Allow full preheating time. Contact maintenance if persists.',
    priority: 'high',
    escalate: false
  },
  'pizza_oven_heating_issue': {
    response: 'Allow full preheating time (30-45 mins for pizza ovens). Check temperature dial setting. For gas models, verify pilot light. Do not adjust gas controls yourself.',
    priority: 'high',
    escalate: false
  },
  'ice_machine_ice_issue': {
    response: 'Check water supply is connected. Look for error lights or codes. Check water filter replacement date. Professional service likely needed for ice quality issues.',
    priority: 'medium',
    escalate: true
  },
  
  // GENERIC ISSUE RESPONSES  
  'temperature_issue_generic': {
    response: 'Check equipment power and settings. Verify door seals and air circulation. Clean any filters if accessible. Log issue for maintenance review.',
    priority: 'medium',
    escalate: false
  },
  'mechanical_issue_generic': {
    response: 'Note the type of noise (clicking, grinding, etc). Check for loose parts or obstructions. Stop using if noise is severe. Schedule maintenance inspection.',
    priority: 'high',
    escalate: true
  },
  'cleaning_issue_generic': {
    response: 'Check cleaning products and procedures. Clean filters and accessible parts. Verify water temperature and pressure. Review maintenance schedule.',
    priority: 'medium',
    escalate: false
  },
  'heating_issue_generic': {
    response: 'Check power connection and temperature settings. Allow adequate preheating time. For gas equipment, verify pilot light but do not adjust yourself.',
    priority: 'high',
    escalate: false
  },
  'water_issue_generic': {
    response: 'Check for visible leaks and turn off water supply if needed. Clean drain filters if accessible. Contact maintenance for persistent drainage issues.',
    priority: 'high',
    escalate: true
  },
  'electrical_issue_generic': {
    response: 'Check power connections and breaker switches. Do not attempt electrical repairs yourself. Contact qualified electrician for safety.',
    priority: 'critical',
    escalate: true
  }
};

serve(async (req) => {
  try {
    const { message } = await req.json();
    
    if (!message || typeof message !== 'string') {
      return new Response(JSON.stringify({
        success: false,
        error: 'Message is required and must be text'
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }
    
    // Call equipment detector with error handling
    let equipmentData = { equipment_detection: null };
    try {
      const equipmentResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/equipment-detector`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': req.headers.get('Authorization') || ''
        },
        body: JSON.stringify({ message })
      });
      
      if (equipmentResponse.ok) {
        equipmentData = await equipmentResponse.json();
      } else {
        console.log('Equipment detector failed:', equipmentResponse.status);
      }
    } catch (error) {
      console.log('Equipment detector error:', error.message);
    }
    
    // Call issue detector with error handling
    let issueData = { issue_detection: null };
    try {
      const issueResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/issue-detector`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': req.headers.get('Authorization') || ''
        },
        body: JSON.stringify({ message })
      });
      
      if (issueResponse.ok) {
        issueData = await issueResponse.json();
      } else {
        console.log('Issue detector failed:', issueResponse.status);
      }
    } catch (error) {
      console.log('Issue detector error:', error.message);
    }
    
    // Determine response pattern
    let responseKey = null;
    let response = null;
    
    const equipment = equipmentData.equipment_detection?.equipment_type;
    const issue = issueData.issue_detection?.issue_type;
    const severity = issueData.issue_detection?.severity;
    
    // Safety issues always take priority
    if (severity === 'critical' && issue) {
      responseKey = issue;
      response = patternResponses[responseKey];
    }
    // Try specific equipment + issue combination
    else if (equipment && issue) {
      responseKey = `${equipment}_${issue}`;
      response = patternResponses[responseKey];
      
      // Fall back to generic issue response
      if (!response) {
        responseKey = `${issue}_generic`;
        response = patternResponses[responseKey];
      }
    }
    // Just issue, no equipment detected
    else if (issue) {
      responseKey = `${issue}_generic`;
      response = patternResponses[responseKey];
    }
    
    // Default response if no pattern matches
    if (!response) {
      response = {
        response: 'I can help troubleshoot this issue. Can you provide more details about what equipment is having problems and what exactly is happening?',
        priority: 'low',
        escalate: false
      };
      responseKey = 'default';
    }
    
    return new Response(JSON.stringify({
      success: true,
      message: message,
      equipment_detection: equipmentData.equipment_detection,
      issue_detection: issueData.issue_detection,
      pattern_match: {
        response_key: responseKey,
        response: response.response,
        priority: response.priority,
        escalate: response.escalate
      },
      debug: {
        equipment_detected: equipment,
        issue_detected: issue,
        severity: severity
      }
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: 'Pattern matching failed',
      debug: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});