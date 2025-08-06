// ============================================================================
// CENTRAL TYPE DEFINITIONS - SINGLE SOURCE OF TRUTH
// ============================================================================
// This file contains all shared types for the chat system to prevent
// duplicate definitions and ensure consistency across components
// ============================================================================

// Safety levels used throughout the application
export type SafetyLevel = 'safe' | 'caution' | 'danger';

// Progress step types
export type StepType = 'safety_check' | 'visual_inspection' | 'operational_test' | 'diagnostic' | 'resolution';
export type StepStatus = 'completed' | 'current' | 'upcoming' | 'skipped';

// Base interfaces for conversation flow
export interface ProgressStep {
  id: string;
  title: string;
  type: StepType;
  status: StepStatus;
  safetyLevel?: SafetyLevel;
  timeEstimate?: string; // e.g., "2-3 minutes"
  completed?: boolean; // For backwards compatibility
}

export interface InteractiveStep {
  id: string;
  stepNumber: number;
  title: string;
  description: string;
  type: StepType;
  content: {
    instruction: string;
    details?: string[];
    warnings?: string[];
    safetyNote?: string;
  } | string; // Allow both object and string formats
  responseOptions?: Array<{
    id: string;
    label: string;
    value: string;
    action: 'continue' | 'escalate' | 'complete';
    style: 'primary' | 'secondary' | 'danger';
    nextStepId?: string;
    type?: 'primary' | 'secondary' | 'danger'; // Deprecated, use style
  }>;
  progressPercentage: number;
  estimatedTime?: string;
  safetyLevel?: SafetyLevel;
}

export interface ConversationResponse {
  response: string;
  confidence: number;
  suggestedActions?: string[];
  requiresEscalation?: boolean;
  safetyLevel?: SafetyLevel;
}

export interface EquipmentContext {
  id: string;
  category: string;
  display_name: string;
  manufacturer: string;
  model: string;
  serial_number: string;
  current_status: 'operational' | 'maintenance_required' | 'out_of_service';
  location_name: string;
  performance_rating: number;
  is_critical_equipment: boolean;
  equipment_type_id: string;
  site_id: string;
  qr_code: string;
  internal_name: string;
}

export interface IssueContext {
  id: string;
  title: string;
  description: string;
  category: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  icon: string;
  estimatedResolutionTime: number;
  commonSolutions: string[];
  requiresProfessionalService: boolean;
  safetyRisk: boolean;
  equipmentTypes: string[];
}

// Conversation flow state management
export interface ConversationFlowState {
  isFlowActive: boolean;
  currentStepIndex: number;
  steps: ProgressStep[];
  interactiveSteps: InteractiveStep[];
  userResponses: Array<{ stepId: string; response: string }>;
  equipmentContext: EquipmentContext | null;
  issueContext: IssueContext | null;
  flowOutcome: 'in_progress' | 'completed' | 'escalated' | 'abandoned' | null;
}

export type ConversationFlowAction =
  | { type: 'INITIALIZE_FLOW'; payload: { equipment: EquipmentContext; issue: IssueContext; steps: ProgressStep[] } }
  | { type: 'ADD_INTERACTIVE_STEP'; payload: InteractiveStep }
  | { type: 'NEXT_STEP'; payload: { stepId: string; response: ConversationResponse } }
  | { type: 'PREVIOUS_STEP' }
  | { type: 'COMPLETE_FLOW'; payload: { outcome: 'completed' | 'escalated' | 'abandoned' } }
  | { type: 'RESET_FLOW' };

// Helper function to ensure required properties have defaults
export function createProgressStep(partial: Partial<ProgressStep> & { id: string; title: string; type: StepType }): ProgressStep {
  return {
    status: 'upcoming' as StepStatus,
    ...partial
  };
}

export function createInteractiveStep(partial: Partial<InteractiveStep> & { id: string; stepNumber: number; title: string; description: string; type: StepType }): InteractiveStep {
  return {
    content: { instruction: '' },
    responseOptions: [],
    progressPercentage: 0,
    safetyLevel: 'safe',
    ...partial
  };
}

export function createConversationResponse(partial: Partial<ConversationResponse> & { response: string; confidence: number }): ConversationResponse {
  return {
    suggestedActions: [],
    requiresEscalation: false,
    safetyLevel: 'safe',
    ...partial
  };
}