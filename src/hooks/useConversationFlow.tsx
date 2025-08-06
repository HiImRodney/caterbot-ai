// ============================================================================
// CONVERSATION FLOW HOOK IMPLEMENTATION - EXPORT SYNTAX FIXED
// ============================================================================

import React, { useReducer, useCallback, useContext, createContext, ReactNode } from 'react';

// ============================================================================
// LOCAL TYPE DEFINITIONS (to avoid circular imports)
// ============================================================================

interface ProgressStep {
  id: string;
  title: string;
  status: 'pending' | 'current' | 'completed' | 'skipped';
  type: 'diagnostic' | 'safety_check' | 'visual_inspection' | 'resolution' | 'operational_test';
  order?: number;
  timeEstimate?: string;
  safetyLevel?: 'safe' | 'caution' | 'danger';
  completedAt?: Date;
  userResponse?: string;
  notes?: string;
}

interface InteractiveStep {
  id: string;
  stepNumber: number;
  title: string;
  description: string;
  type: 'diagnostic' | 'safety_check' | 'visual_inspection' | 'resolution' | 'operational_test';
  content: {
    instruction: string;
    details?: string[];
    warnings?: string[];
    safetyNote?: string; // FIXED: Added safetyNote property that ChatInterface expects
  } | string;
  responseOptions?: Array<{
    id: string;
    label: string;
    value: string;
    nextStepId?: string;
    action?: 'continue' | 'escalate' | 'complete'; // FIXED: Added action property 
    style?: 'primary' | 'secondary' | 'danger'; // FIXED: Added style property
    type?: 'primary' | 'secondary' | 'danger'; // Kept existing type for compatibility
  }>;
  progressPercentage: number;
  estimatedTime?: string;
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
  responseType?: 'buttons' | 'text' | 'selection';
  safetyLevel?: 'safe' | 'caution' | 'danger';
}

interface EquipmentContext {
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
  performance_rating: number;
  is_critical_equipment: boolean;
  equipment_type_id: string;
  site_id: string;
  installation_date?: Date;
  last_service_date?: Date;
  warranty_expires?: Date;
  estimated_value?: number;
}

interface IssueContext {
  id: string;
  title: string;
  description: string;
  category: 'cooling' | 'heating' | 'mechanical' | 'electrical' | 'safety' | 'maintenance';
  severity: 'low' | 'medium' | 'high' | 'critical';
  icon: string;
  estimatedResolutionTime: number;
  commonSolutions: string[];
  requiresProfessionalService: boolean;
  safetyRisk: boolean;
  equipmentTypes: string[];
}

// ============================================================================
// STATE AND CONTEXT INTERFACES
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
    responseTime: number;
  }>;
  completedSteps: string[];
  steps: ProgressStep[];
  interactiveSteps: InteractiveStep[];
  progressPercentage: number;
  estimatedTimeRemaining: number;
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
// INITIAL STATE
// ============================================================================

const initialState: ConversationFlowState = {
  currentStep: '',
  currentStepIndex: 0,
  totalSteps: 0,
  isFlowActive: false,
  equipmentContext: null,
  issueContext: null,
  userResponses: [],
  completedSteps: [],
  steps: [],
  interactiveSteps: [],
  progressPercentage: 0,
  estimatedTimeRemaining: 0,
  safetyFlags: [],
  escalationHistory: []
};

// ============================================================================
// REDUCER FUNCTION - FULL FUNCTIONALITY RESTORED
// ============================================================================

function conversationFlowReducer(
  state: ConversationFlowState, 
  action: ConversationFlowActions
): ConversationFlowState {
  switch (action.type) {
    case 'INITIALIZE_FLOW':
      return {
        ...initialState,
        equipmentContext: action.payload.equipment,
        issueContext: action.payload.issue,
        steps: action.payload.steps || [],
        totalSteps: action.payload.steps?.length || 0,
        isFlowActive: true,
        currentStep: action.payload.steps?.[0]?.id || '',
        currentStepIndex: 0
      };

    case 'ADD_INTERACTIVE_STEP':
      return {
        ...state,
        interactiveSteps: [...state.interactiveSteps, action.payload],
        totalSteps: state.totalSteps + 1
      };

    case 'NEXT_STEP':
      const nextIndex = Math.min(state.currentStepIndex + 1, state.totalSteps - 1);
      const nextStep = state.steps[nextIndex];
      
      return {
        ...state,
        currentStepIndex: nextIndex,
        currentStep: nextStep?.id || '',
        progressPercentage: Math.round((nextIndex / Math.max(state.totalSteps - 1, 1)) * 100),
        estimatedTimeRemaining: calculateTimeRemaining(state.steps, nextIndex)
      };

    case 'PREVIOUS_STEP':
      const prevIndex = Math.max(state.currentStepIndex - 1, 0);
      const prevStep = state.steps[prevIndex];
      
      return {
        ...state,
        currentStepIndex: prevIndex,
        currentStep: prevStep?.id || '',
        progressPercentage: Math.round((prevIndex / Math.max(state.totalSteps - 1, 1)) * 100)
      };

    case 'ADD_USER_RESPONSE':
      const newResponse = {
        stepId: action.payload.stepId,
        response: action.payload.response,
        timestamp: new Date(),
        responseTime: action.payload.responseTime || 0
      };

      const updatedCompletedSteps = state.completedSteps.includes(action.payload.stepId)
        ? state.completedSteps
        : [...state.completedSteps, action.payload.stepId];

      const updatedSteps = state.steps.map(step => 
        step.id === action.payload.stepId 
          ? { ...step, status: 'completed' as const, completedAt: new Date(), userResponse: action.payload.response }
          : step
      );

      return {
        ...state,
        userResponses: [...state.userResponses, newResponse],
        completedSteps: updatedCompletedSteps,
        steps: updatedSteps
      };

    case 'TRIGGER_SAFETY_ESCALATION':
      const safetyFlag = {
        type: action.payload.type || 'mechanical',
        severity: action.payload.severity || 'warning',
        message: action.payload.message || 'Safety escalation triggered',
        triggered: new Date()
      };

      return {
        ...state,
        safetyFlags: [...state.safetyFlags, safetyFlag],
        isFlowActive: action.payload.severity === 'critical' ? false : state.isFlowActive
      };

    case 'REQUEST_MANAGER_APPROVAL':
      const escalation = {
        stepId: state.currentStep,
        reason: action.payload.reason,
        timestamp: new Date(),
        approvalRequired: true
      };

      return {
        ...state,
        escalationHistory: [...state.escalationHistory, escalation],
        isFlowActive: false
      };

    case 'UPDATE_PROGRESS':
      return {
        ...state,
        progressPercentage: action.payload.percentage,
        estimatedTimeRemaining: action.payload.estimatedTime || state.estimatedTimeRemaining
      };

    case 'COMPLETE_FLOW':
      return {
        ...state,
        isFlowActive: false,
        currentStep: '',
        progressPercentage: 100,
        estimatedTimeRemaining: 0
      };

    case 'RESET_FLOW':
      return {
        ...initialState
      };

    default:
      return state;
  }
}

// ============================================================================
// UTILITY FUNCTIONS - FULL FUNCTIONALITY RESTORED
// ============================================================================

function calculateTimeRemaining(steps: ProgressStep[], currentIndex: number): number {
  return steps
    .slice(currentIndex)
    .reduce((total, step) => {
      if (!step.timeEstimate) return total;
      const match = step.timeEstimate.match(/(\d+)/);
      return total + (match ? parseInt(match[1]) : 2);
    }, 0);
}

// ============================================================================
// CONTEXT CREATION
// ============================================================================

const ConversationFlowContextProvider = createContext<ConversationFlowContext | undefined>(undefined);

// ============================================================================
// HOOK IMPLEMENTATION
// ============================================================================

export function useConversationFlow(): ConversationFlowContext {
  const context = useContext(ConversationFlowContextProvider);
  
  if (!context) {
    throw new Error('useConversationFlow must be used within a ConversationFlowProvider');
  }
  
  return context;
}

// ============================================================================
// PROVIDER COMPONENT
// ============================================================================

interface ConversationFlowProviderProps {
  children: ReactNode;
}

export function ConversationFlowProvider({ children }: ConversationFlowProviderProps): JSX.Element {
  const [state, dispatch] = useReducer(conversationFlowReducer, initialState);

  const getCurrentStep = useCallback((): ProgressStep | null => {
    return state.steps[state.currentStepIndex] || null;
  }, [state.steps, state.currentStepIndex]);

  const getCurrentInteractiveStep = useCallback((): InteractiveStep | null => {
    return state.interactiveSteps.find(step => step.id === state.currentStep) || null;
  }, [state.interactiveSteps, state.currentStep]);

  const getProgress = useCallback(() => {
    return {
      completed: state.completedSteps.length,
      total: state.totalSteps,
      percentage: state.progressPercentage,
      estimatedTimeRemaining: state.estimatedTimeRemaining
    };
  }, [state.completedSteps.length, state.totalSteps, state.progressPercentage, state.estimatedTimeRemaining]);

  const isStepCompleted = useCallback((stepId: string): boolean => {
    return state.completedSteps.includes(stepId);
  }, [state.completedSteps]);

  const addUserResponse = useCallback((stepId: string, response: string) => {
    dispatch({
      type: 'ADD_USER_RESPONSE',
      payload: { stepId, response, responseTime: 0 }
    });
  }, []);

  const triggerSafetyEscalation = useCallback((
    reason: string, 
    severity: 'warning' | 'danger' | 'critical' = 'warning'
  ) => {
    dispatch({
      type: 'TRIGGER_SAFETY_ESCALATION',
      payload: { message: reason, severity }
    });
  }, []);

  const requestManagerApproval = useCallback((reason: string, estimatedCost?: number) => {
    dispatch({
      type: 'REQUEST_MANAGER_APPROVAL',
      payload: { reason, estimatedCost }
    });
  }, []);

  const contextValue: ConversationFlowContext = {
    state,
    dispatch,
    getCurrentStep,
    getCurrentInteractiveStep,
    getProgress,
    isStepCompleted,
    addUserResponse,
    triggerSafetyEscalation,
    requestManagerApproval
  };

  return (
    <ConversationFlowContextProvider.Provider value={contextValue}>
      {children}
    </ConversationFlowContextProvider.Provider>
  );
}

// ============================================================================
// TROUBLESHOOTING FLOW CREATION - FULL FUNCTIONALITY RESTORED
// ============================================================================

export function createEquipmentTroubleshootingFlow(
  equipmentCategory: string,
  issueTitle: string,
  equipmentName: string
): { id: string; steps: ProgressStep[] } {
  const flowId = `troubleshooting_${equipmentCategory}_${Date.now()}`;
  
  const baseSteps: ProgressStep[] = [
    {
      id: 'safety_check',
      title: 'Safety Verification',
      status: 'pending',
      type: 'safety_check',
      order: 1,
      timeEstimate: '2 minutes'
    },
    {
      id: 'visual_inspection',
      title: 'Visual Inspection',
      status: 'pending',
      type: 'visual_inspection',
      order: 2,
      timeEstimate: '3 minutes'
    },
    {
      id: 'basic_checks',
      title: 'Basic System Checks',
      status: 'pending',
      type: 'diagnostic',
      order: 3,
      timeEstimate: '5 minutes'
    },
    {
      id: 'troubleshooting_actions',
      title: 'Troubleshooting Actions',
      status: 'pending',
      type: 'operational_test',
      order: 4,
      timeEstimate: '10 minutes'
    },
    {
      id: 'verification',
      title: 'Solution Verification',
      status: 'pending',
      type: 'resolution',
      order: 5,
      timeEstimate: '3 minutes'
    }
  ];

  const customizedSteps = customizeStepsForEquipment(baseSteps, equipmentCategory, issueTitle);

  return {
    id: flowId,
    steps: customizedSteps
  };
}

function customizeStepsForEquipment(
  baseSteps: ProgressStep[], 
  category: string, 
  issueTitle: string
): ProgressStep[] {
  switch (category.toLowerCase()) {
    case 'refrigeration':
      return baseSteps.map(step => {
        if (step.id === 'basic_checks') {
          return { ...step, timeEstimate: '7 minutes' };
        }
        return step;
      });

    case 'cooking':
      return baseSteps.map(step => {
        if (step.id === 'safety_check') {
          return { ...step, timeEstimate: '3 minutes' };
        }
        return step;
      });

    case 'warewashing':
      return baseSteps.map(step => {
        if (step.id === 'basic_checks') {
          return { ...step, timeEstimate: '6 minutes' };
        }
        return step;
      });

    default:
      return baseSteps;
  }
}

// ============================================================================
// INTERACTIVE STEP CREATION - FULL FUNCTIONALITY RESTORED
// ============================================================================

export function createInteractiveStepFromProgressStep(
  progressStep: ProgressStep,
  stepIndex: number,
  totalSteps: number
): InteractiveStep {
  return {
    id: progressStep.id,
    stepNumber: stepIndex + 1,
    title: progressStep.title,
    description: `Troubleshooting step: ${progressStep.title}`,
    type: mapProgressTypeToInteractiveType(progressStep.type),
    content: {
      instruction: getInstructionForStep(progressStep),
      details: getDetailsForStep(progressStep),
      warnings: getWarningsForStep(progressStep),
      safetyNote: getSafetyNoteForStep(progressStep) // FIXED: Added safetyNote generation
    },
    responseOptions: getResponseOptionsForStep(progressStep),
    progressPercentage: Math.round((stepIndex / Math.max(totalSteps - 1, 1)) * 100),
    estimatedTime: progressStep.timeEstimate,
    safetyLevel: progressStep.safetyLevel || 'safe'
  };
}

function mapProgressTypeToInteractiveType(type: string): InteractiveStep['type'] {
  switch (type) {
    case 'safety': return 'safety_check';
    case 'safety_check': return 'safety_check';
    case 'diagnostic': return 'diagnostic';
    case 'visual_inspection': return 'visual_inspection';
    case 'operational_test': return 'operational_test';
    case 'resolution': return 'resolution';
    default: return 'diagnostic';
  }
}

function getInstructionForStep(step: ProgressStep): string {
  switch (step.id) {
    case 'safety_check':
      return 'Before we begin, let\'s ensure it\'s safe to proceed with troubleshooting.';
    case 'visual_inspection':
      return 'Take a close look at the equipment for any visible signs of damage or unusual conditions.';
    case 'basic_checks':
      return 'Let\'s verify the basic system functions are working properly.';
    case 'troubleshooting_actions':
      return 'Now we\'ll perform specific troubleshooting steps to identify and resolve the issue.';
    case 'verification':
      return 'Let\'s confirm that our troubleshooting steps have resolved the issue.';
    default:
      return `Troubleshooting step: ${step.title}`;
  }
}

function getDetailsForStep(step: ProgressStep): string[] {
  switch (step.id) {
    case 'safety_check':
      return [
        'Ensure the equipment is in a safe state',
        'Check for any immediate safety hazards',
        'Verify you have proper access and tools'
      ];
    case 'visual_inspection':
      return [
        'Look for obvious damage or wear',
        'Check for loose connections or components',
        'Note any unusual sounds, smells, or visible issues'
      ];
    default:
      return [];
  }
}

function getWarningsForStep(step: ProgressStep): string[] {
  if (step.type === 'safety_check') {
    return [
      'Do not proceed if you notice any safety hazards',
      'If you smell gas or see electrical sparks, stop immediately',
      'Contact a professional if you\'re unsure about safety'
    ];
  }
  return [];
}

function getSafetyNoteForStep(step: ProgressStep): string | undefined {
  if (step.type === 'safety_check') {
    return 'Safety first - if anything seems unsafe, stop and contact a professional.';
  }
  return undefined;
}

function getResponseOptionsForStep(step: ProgressStep): InteractiveStep['responseOptions'] {
  const baseOptions = [
    {
      id: 'continue',
      label: 'Continue',
      value: 'continue',
      type: 'primary' as const,
      action: 'continue' as const, // FIXED: Added action property
      style: 'primary' as const    // FIXED: Added style property
    },
    {
      id: 'need_help',
      label: 'I need help',
      value: 'need_help',
      type: 'secondary' as const,
      action: 'escalate' as const, // FIXED: Added action property
      style: 'secondary' as const  // FIXED: Added style property
    }
  ];

  if (step.type === 'safety_check') {
    return [
      {
        id: 'safe_to_proceed',
        label: 'Safe to proceed',
        value: 'safe',
        type: 'primary',
        action: 'continue', // FIXED: Added action property
        style: 'primary'    // FIXED: Added style property
      },
      {
        id: 'safety_concern',
        label: 'I have safety concerns',
        value: 'unsafe',
        type: 'danger',
        action: 'escalate', // FIXED: Added action property
        style: 'danger'     // FIXED: Added style property
      }
    ];
  }

  return baseOptions;
}
