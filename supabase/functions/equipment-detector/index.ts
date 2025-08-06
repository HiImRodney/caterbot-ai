import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

// Equipment type detection function
function detectEquipmentType(message: string): { 
  equipment_type: string | null; 
  confidence: number; 
  keywords_found: string[] 
} {
  
  const equipmentKeywords = {
    'commercial_fridge': ['fridge', 'refrigerator', 'cooler', 'chiller', 'cold'],
    'commercial_freezer': ['freezer', 'frozen', 'freeze'],
    'walk_in_cooler': ['walk in', 'walk-in', 'cold room', 'walk in cooler'],
    'commercial_oven': ['oven', 'bake', 'baking', 'roast', 'roasting'],
    'pizza_oven': ['pizza oven', 'pizza', 'stone oven'],
    'combi_oven': ['combi oven', 'combi', 'combination oven'],
    'commercial_fryer': ['fryer', 'frying', 'deep fat', 'chips', 'oil'],
    'commercial_grill': ['grill', 'griddle', 'grilling', 'char grill'],
    'salamander': ['salamander', 'overhead grill', 'browning'],
    'dishwasher': ['dishwasher', 'dishes', 'washing up', 'dish machine'],
    'glass_washer': ['glass washer', 'glass machine', 'glasses'],
    'coffee_machine': ['coffee', 'espresso', 'cappuccino', 'coffee machine'],
    'ice_machine': ['ice machine', 'ice maker', 'ice', 'cubes'],
    'blast_chiller': ['blast chiller', 'blast', 'rapid cooling'],
    'commercial_mixer': ['mixer', 'mixing', 'dough hook', 'planetary'],
    'meat_slicer': ['slicer', 'slicing', 'deli slicer'],
    'food_processor': ['food processor', 'chopping', 'processor'],
    'microwave': ['microwave', 'micro'],
    'toaster': ['toaster', 'toast', 'bread']
  };
  
  // Convert message to lowercase for matching
  const lowerMessage = message.toLowerCase();
  
  let bestMatch = null;
  let bestConfidence = 0;
  let foundKeywords = [];
  
  // Check each equipment type
  for (const [equipmentType, keywords] of Object.entries(equipmentKeywords)) {
    let matches = 0;
    let matchedKeywords = [];
    
    // Count keyword matches
    for (const keyword of keywords) {
      if (lowerMessage.includes(keyword)) {
        matches++;
        matchedKeywords.push(keyword);
      }
    }
    
    // Calculate confidence (matches / total keywords for this equipment)
    const confidence = matches / keywords.length;
    
    // Update best match if this is better
    if (confidence > bestConfidence) {
      bestMatch = equipmentType;
      bestConfidence = confidence;
      foundKeywords = matchedKeywords;
    }
  }
  
  // Require minimum confidence threshold
  const minConfidence = 0.2; // At least 20% keyword match
  if (bestConfidence < minConfidence) {
    return {
      equipment_type: null,
      confidence: 0,
      keywords_found: []
    };
  }
  
  return {
    equipment_type: bestMatch,
    confidence: Math.round(bestConfidence * 100) / 100, // Round to 2 decimal places
    keywords_found: foundKeywords
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
    
    // Detect equipment type
    const detection = detectEquipmentType(message);
    
    return new Response(
      JSON.stringify({
        success: true,
        message: message,
        equipment_detection: detection,
        confidence_level: detection.confidence >= 0.6 ? 'high' : 
                         detection.confidence >= 0.3 ? 'medium' : 'low'
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
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
});