import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

// Comprehensive issue pattern detection function
function detectIssuePattern(message: string): {
  issue_type: string | null;
  confidence: number;
  keywords_found: string[];
  severity: string;
} {
  
  const issuePatterns = {
    'gas_issue': {
      keywords: ['gas smell', 'smell gas', 'gas odor', 'odor of gas', 'gas leak', 'leaking gas', 'gas escape', 'pilot light', 'pilot out', 'no gas', 'gas pressure', 'gas', 'smell of gas', 'gas fumes', 'propane smell', 'natural gas'],
      severity: 'critical'
    },
    'electrical_issue': {
      keywords: ['not working', 'wont turn on', 'won\'t turn on', 'no power', 'dead', 'not starting', 'sparks', 'sparking', 'electrical', 'electric shock', 'shocked', 'tripping breaker', 'blown fuse', 'power cut', 'short circuit'],
      severity: 'critical'
    },
    'fire_safety_issue': {
      keywords: ['fire', 'flames', 'burning smell', 'smoke', 'smoking', 'overheating badly', 'too hot to touch', 'melting', 'charred', 'burnt smell'],
      severity: 'critical'
    },
    'water_emergency': {
      keywords: ['flooding', 'water everywhere', 'major leak', 'gushing water', 'burst pipe', 'water damage', 'ceiling leak'],
      severity: 'critical'
    },
    'temperature_issue': {
      keywords: ['warm', 'hot', 'cold', 'not cold', 'not cool', 'overheating', 'too warm', 'not cooling', 'temperature', 'temp', 'not chilled', 'lukewarm', 'room temperature', 'defrosting', 'thawing'],
      severity: 'high'
    },
    'heating_issue': {
      keywords: ['not heating', 'no heat', 'cold oven', 'not hot', 'not warming up', 'temperature low', 'not reaching temperature', 'taking ages to heat', 'slow to heat', 'won\'t get hot'],
      severity: 'high'
    },
    'mechanical_issue': {
      keywords: ['noise', 'noises', 'sounds', 'banging', 'clicking', 'grinding', 'vibrating', 'rattling', 'squeaking', 'scraping', 'clunking', 'strange sound', 'loud', 'unusual noise'],
      severity: 'high'
    },
    'water_issue': {
      keywords: ['leak', 'leaking', 'water', 'dripping', 'not draining', 'blocked drain', 'overflow', 'overflowing', 'puddle', 'wet floor', 'water on floor'],
      severity: 'high'
    },
    'cleaning_issue': {
      keywords: ['spots', 'dirty', 'not clean', 'residue', 'buildup', 'build up', 'stains', 'grease', 'food debris', 'cloudy', 'film', 'streaks', 'marks', 'grime', 'soap scum'],
      severity: 'medium'
    },
    'performance_issue': {
      keywords: ['slow', 'taking long', 'not working properly', 'poor performance', 'inefficient', 'sluggish', 'struggling', 'laboring', 'working hard', 'cycle taking forever'],
      severity: 'medium'
    },
    'door_issue': {
      keywords: ['door', 'seal', 'seals', 'not closing', 'won\'t close', 'wont open', 'won\'t open', 'stuck', 'handle broken', 'handle loose', 'door hanging off', 'hinge broken'],
      severity: 'medium'
    },
    'ice_issue': {
      keywords: ['no ice', 'ice buildup', 'ice build up', 'frost', 'frosting up', 'defrost', 'ice machine', 'ice quality', 'cloudy ice', 'dirty ice', 'ice tastes bad', 'ice smells'],
      severity: 'medium'
    },
    'filter_issue': {
      keywords: ['filter', 'filters', 'blocked filter', 'dirty filter', 'clogged', 'needs cleaning', 'air flow', 'ventilation', 'extraction'],
      severity: 'medium'
    },
    'oil_issue': {
      keywords: ['oil', 'fat', 'cooking oil', 'dirty oil', 'old oil', 'oil temperature', 'oil smoking', 'oil bubbling', 'oil foaming', 'oil smells'],
      severity: 'medium'
    },
    'timer_issue': {
      keywords: ['timer', 'clock', 'time', 'countdown', 'alarm', 'beeping', 'won\'t stop beeping', 'stuck on', 'display flashing'],
      severity: 'low'
    },
    'calibration_issue': {
      keywords: ['wrong temperature', 'inaccurate', 'calibration', 'thermometer', 'probe', 'sensor', 'reading wrong', 'temperature off'],
      severity: 'medium'
    },
    'blockage_issue': {
      keywords: ['blocked', 'clogged', 'obstruction', 'stuck', 'jammed', 'won\'t move', 'can\'t turn', 'seized', 'frozen up'],
      severity: 'medium'
    },
    'noise_issue': {
      keywords: ['too loud', 'very noisy', 'disturbing', 'annoying sound', 'constant noise', 'never stops', 'getting louder'],
      severity: 'low'
    },
    'efficiency_issue': {
      keywords: ['using too much', 'expensive to run', 'high bills', 'energy consumption', 'power hungry', 'costs too much'],
      severity: 'low'
    }
  };
  
  // Convert message to lowercase for matching
  const lowerMessage = message.toLowerCase();
  
  let bestMatch = null;
  let bestConfidence = 0;
  let foundKeywords = [];
  let severity = 'low';
  
  // Check each issue pattern
  for (const [issueType, pattern] of Object.entries(issuePatterns)) {
    let matches = 0;
    let matchedKeywords = [];
    
    // Count keyword matches
    for (const keyword of pattern.keywords) {
      if (lowerMessage.includes(keyword)) {
        matches++;
        matchedKeywords.push(keyword);
      }
    }
    
    // Calculate confidence (matches / total keywords for this issue)
    const confidence = matches / pattern.keywords.length;
    
    // Update best match if this is better
    if (confidence > bestConfidence) {
      bestMatch = issueType;
      bestConfidence = confidence;
      foundKeywords = matchedKeywords;
      severity = pattern.severity;
    }
  }
  
  // Special handling for critical safety issues - lower threshold
  const isSafetyCritical = ['gas_issue', 'electrical_issue', 'fire_safety_issue', 'water_emergency'].includes(bestMatch);
  const minConfidence = isSafetyCritical ? 0.05 : 0.1; // 5% threshold for safety, 10% for others
  
  if (bestConfidence < minConfidence) {
    return {
      issue_type: null,
      confidence: 0,
      keywords_found: [],
      severity: 'unknown'
    };
  }
  
  return {
    issue_type: bestMatch,
    confidence: Math.round(bestConfidence * 100) / 100,
    keywords_found: foundKeywords,
    severity: severity
  };
}

serve(async (req) => {
  try {
    const { message } = await req.json();
    
    if (!message || typeof message !== 'string') {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Message is required and must be text'
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    // Detect issue pattern
    const detection = detectIssuePattern(message);
    
    return new Response(
      JSON.stringify({
        success: true,
        message: message,
        issue_detection: detection,
        confidence_level: detection.confidence >= 0.5 ? 'high' : 
                         detection.confidence >= 0.2 ? 'medium' : 'low',
        urgency: detection.severity === 'critical' ? 'immediate' :
                detection.severity === 'high' ? 'urgent' :
                detection.severity === 'medium' ? 'normal' : 'low',
        safety_critical: ['gas_issue', 'electrical_issue', 'fire_safety_issue', 'water_emergency'].includes(detection.issue_type)
      }),
      {
        headers: { 'Content-Type': 'application/json' }
      }
    );
    
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Invalid request format',
        debug: error.message
      }),
      {
        status: 400,
      }
    );
  }
});