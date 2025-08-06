// ============================================================================
// CHAT COMPONENT TYPES & INTERFACES - ENHANCED VERSION
// ============================================================================

import { ReactNode } from 'react';

// ============================================================================
// CORE CONVERSATION FLOW TYPES
// ============================================================================

export interface InteractiveStep {
  id: string;
  stepNumber: number;
  title: string;
  description: string;
  type: 'diagnostic' | 'safety_check' | 'visual_inspection' | 'resolution' | 'operational_test';
  content: {
    instruction: string;
    details?: string[];
    warnings?: string[];
    safetyNote?: string; // FIXED: Added safetyNote to content interface
  } | string; // Support both formats for compatibility
  responseOptions?: Array<{
    id: string;
    label: string;
    value: string;
    nextStepId?: string;
    action?: 'continue' | 'escalate' | 'complete'; // FIXED: Added action property
    style?: 'primary' | 'secondary' | 'danger'; // FIXED: Added style property  
    type?: 'primary' | 'secondary' | 'danger'; // FIXED: Added type property for compatibility
  }>;
  progressPercentage: number;
  estimatedTime?: string; // FIXED: Use timeEstimate format ("2-3 minutes")
  equipment?: {
    id: string;
    name: string;
    category: string;
  };
  issue?: {
    id: string;
    title: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
  };
  // Added missing properties from error analysis
  responseType?: 'buttons' | 'text' | 'selection';
  safetyLevel?: SafetyLevel;
}

export interface ProgressStep {
  id: string;
  title: string;
  status: 'pending' | 'current' | 'completed' | 'skipped';
  type: 'diagnostic' | 'safety_check' | 'visual_inspection' | 'resolution' | 'operational_test';
  order?: number;
  timeEstimate?: string; // FIXED: Use timeEstimate instead of estimatedDuration
  safetyLevel?: 'safe' | 'caution' | 'danger';
  completedAt?: Date;
  userResponse?: string;
  notes?: string;
}

export interface ConversationResponse {
  response: string; // FIXED: Primary response property
  confidence: number;
  suggestedActions?: string[];
  requiresEscalation?: boolean;
  safetyLevel?: SafetyLevel;
  // Legacy compatibility properties
  id?: string;
  type?: 'pattern_match' | 'ai_response' | 'safety_escalation' | 'manager_approval';
  content?: string;
  classification?: {
    safety: 'safe' | 'caution' | 'danger';
    confidence: number;
    responseTime: number; // milliseconds
    cost: {
      tokens?: number;
      estimatedCost: number; // GBP
      model?: string;
    };
  };
  equipment?: {
    id: string;
    name: string;
    category: string;
    status: 'operational' | 'attention' | 'critical' | 'offline';
  };
  nextActions?: Array<{
    id: string;
    label: string;
    type: 'continue' | 'escalate' | 'log_maintenance' | 'schedule_service';
  }>;
  timestamp?: Date;
  metadata?: {
    patternMatchId?: string;
    aiModelUsed?: string;
    safetyTriggered?: boolean;
    escalationReason?: string;
  };
  stepId?: string;
  triggeredNextStep?: string;
}

// ============================================================================
// CONVERSATION FLOW STATE MANAGEMENT
// ============================================================================

export interface ConversationFlowState {
  currentStep: string;
  currentStepIndex: number;
  totalSteps: number;
  isFlowActive: boolean;
  equipmentContext: EquipmentContext | null;
  issueContext: IssueContext | null;
  userResponses: Array<{
    stepId: string;
    response: string;
    timestamp: Date;
    responseTime: number; // seconds
  }>;
  completedSteps: string[];
  steps: ProgressStep[];
  interactiveSteps: InteractiveStep[];
  progressPercentage: number;
  estimatedTimeRemaining: number; // minutes
  safetyFlags: Array<{
    type: 'gas' | 'electrical' | 'fire' | 'mechanical';
    severity: 'warning' | 'danger' | 'critical';
    message: string;
    triggered: Date;
  }>;
  escalationHistory: Array<{
    stepId: string;
    reason: string;
    timestamp: Date;
    approvalRequired: boolean;
  }>;
}

export interface ConversationFlowActions {
  type: 'INITIALIZE_FLOW' | 'NEXT_STEP' | 'PREVIOUS_STEP' | 'ADD_USER_RESPONSE' | 
        'TRIGGER_SAFETY_ESCALATION' | 'REQUEST_MANAGER_APPROVAL' | 'COMPLETE_FLOW' |
        'ADD_INTERACTIVE_STEP' | 'UPDATE_PROGRESS' | 'RESET_FLOW' |
        // Added missing action types from error analysis
        'ADVANCE_TO_STEP' | 'END_FLOW';
  payload?: any;
}

export interface ConversationFlowContext {
  state: ConversationFlowState;
  dispatch: (action: ConversationFlowActions) => void;
  getCurrentStep: () => ProgressStep | null;
  getCurrentInteractiveStep: () => InteractiveStep | null;
  getProgress: () => {
    completed: number;
    total: number;
    percentage: number;
    estimatedTimeRemaining: number;
  };
  isStepCompleted: (stepId: string) => boolean;
  addUserResponse: (stepId: string, response: string) => void;
  triggerSafetyEscalation: (reason: string, severity: 'warning' | 'danger' | 'critical') => void;
  requestManagerApproval: (reason: string, estimatedCost?: number) => void;
}

// ============================================================================
// EQUIPMENT AND ISSUE CONTEXT TYPES
// ============================================================================

export interface EquipmentContext {
  id: string;
  qr_code: string;
  internal_name: string;
  display_name: string;
  manufacturer: string;
  model: string;
  serial_number?: string;
  category: 'refrigeration' | 'cooking' | 'warewashing' | 'ice_production' | 'food_prep';
  current_status: 'operational' | 'attention' | 'critical' | 'offline';
  location_name: string;
  performance_rating: number; // 0-100
  is_critical_equipment: boolean;
  equipment_type_id: string;
  site_id: string;
  installation_date?: Date;
  last_service_date?: Date;
  warranty_expires?: Date;
  estimated_value?: number; // GBP
  // Fixed property access issues from error analysis
  equipment_catalog?: {
    display_name: string;
    manufacturer: string;
    category: string;
  };
  equipment_locations?: {
    location_name: string;
  };
}

export interface IssueContext {
  id: string;
  title: string;
  description: string;
  category: 'cooling' | 'heating' | 'mechanical' | 'electrical' | 'safety' | 'maintenance';
  severity: 'low' | 'medium' | 'high' | 'critical';
  icon: string;
  estimatedResolutionTime: number; // minutes
  commonSolutions: string[];
  requiresProfessionalService: boolean;
  safetyRisk: boolean;
  equipmentTypes: string[];
}

// ============================================================================
// CHAT MESSAGE TYPES
// ============================================================================

export interface ChatMessage {
  id: string;
  type: 'user' | 'assistant' | 'system' | 'interactive';
  content: string;
  timestamp: Date;
  sender?: {
    id: string;
    name: string;
    role: 'staff' | 'manager' | 'system' | 'ai';
  };
  responseClassification?: {
    type: 'pattern_match' | 'ai_response' | 'safety_alert' | 'cached_response';
    confidence: number;
    cost?: {
      tokens: number;
      estimatedCost: number; // GBP
      model: string;
    };
    safety: 'safe' | 'caution' | 'danger';
  };
  interactiveStep?: InteractiveStep;
  attachments?: Array<{
    type: 'image' | 'audio' | 'document';
    url: string;
    name: string;
    size: number;
  }>;
  equipment?: EquipmentContext;
  issue?: IssueContext;
  metadata?: {
    sessionId: string;
    conversationId: string;
    parentMessageId?: string;
    edited?: boolean;
    editedAt?: Date;
  };
  // Added missing properties from error analysis
  isInteractive?: boolean;
  responseType?: 'pattern' | 'ai' | 'safety';
  classification?: {
    safety: SafetyLevel;
    confidence: number;
    costGBP: number;
  };
  equipmentContext?: {
    equipmentId: string;
    model: string;
    issueType?: string;
  };
}

// ============================================================================
// COMPONENT PROP TYPES - ENHANCED
// ============================================================================

export interface ChatInputProps {
  onSendMessage: (content: string, isSystemMessage?: boolean) => Promise<void>;
  disabled?: boolean;
  equipment?: EquipmentContext;
  placeholder?: string; // Added missing property from error analysis
  showQuickActions?: boolean;
  isTyping?: boolean;
}

export interface MessageBubbleProps {
  message: ChatMessage;
  isLastMessage?: boolean;
  showAvatar?: boolean;
  onResend?: (messageId: string) => void;
  onEdit?: (messageId: string, newContent: string) => void;
}

export interface InteractiveMessageProps {
  message: ChatMessage;
  interactiveStep?: InteractiveStep; // Made optional to match usage
  onResponse?: (stepId: string, response: string, nextStepId?: string) => void;
  showProgressIndicator?: boolean;
  currentStep?: number;
  totalSteps?: number;
}

export interface ProgressIndicatorProps {
  steps: ProgressStep[];
  currentStepIndex: number;
  variant?: 'detailed' | 'compact' | 'minimal';
  showStepDetails?: boolean;
  totalTimeEstimate?: string;
  className?: string;
}

export interface ResponseClassificationProps {
  classification: {
    type: 'pattern_match' | 'ai_response' | 'safety_alert';
    confidence: number;
    safety: 'safe' | 'caution' | 'danger';
    responseTime: number;
    cost?: {
      tokens: number;
      estimatedCost: number;
      model: string;
    };
  };
  showCostDetails?: boolean; // Only for internal/manager views
}

export interface SafetyAlertProps {
  type: 'gas' | 'electrical' | 'fire' | 'mechanical';
  severity: 'warning' | 'danger' | 'critical';
  message: string;
  equipment: EquipmentContext;
  onEscalate: () => void;
  onDismiss?: () => void;
  autoEscalate?: boolean;
}

// ============================================================================
// UTILITY TYPES - ENHANCED
// ============================================================================

export type SafetyLevel = 'safe' | 'caution' | 'danger';
export type ResponseType = 'pattern_match' | 'ai_response' | 'safety_escalation' | 'cached_response';
export type ConversationStage = 'initial' | 'diagnostic' | 'troubleshooting' | 'resolution' | 'escalation' | 'completed';
export type UserRole = 'staff' | 'manager' | 'operative' | 'admin';

// Added utility function type for createResponseClassification
export type CreateResponseClassificationFunction = (
  type: ResponseType,
  confidence: number,
  safety: SafetyLevel,
  responseTime: number,
  cost?: { tokens: number; estimatedCost: number; model: string }
) => any;

// ============================================================================
// ERROR TYPES
// ============================================================================

export interface ChatError {
  type: 'network' | 'authentication' | 'permission' | 'safety' | 'system';
  message: string;
  code?: string;
  timestamp: Date;
  context?: {
    equipmentId?: string;
    messageId?: string;
    stepId?: string;
  };
}

// ============================================================================
// DASHBOARD TYPES (from error analysis)
// ============================================================================

export interface DashboardData {
  maintenance: {
    upcomingTasks: Array<{
      equipment: string;
      type: string;
      dueDate: string;
      priority: 'low' | 'medium' | 'high';
    }>;
  };
  alerts: {
    recentAlerts: Array<{
      type: 'urgent' | 'warning' | 'info';
      message: string;
      timestamp: Date;
    }>;
  };
}