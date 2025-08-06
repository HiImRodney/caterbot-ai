import React, { createContext, useContext, useReducer, useEffect } from 'react';
import type { InteractiveStep } from '../../types/chat-types'; // FIXED: Import from shared types
import { ProgressStep } from './ProgressIndicator';

// Types for conversation flow management
export interface ConversationFlowState {
  currentStepId: string | null;
  currentStepIndex: number;
  steps: ProgressStep[];
  interactiveSteps: Map<string, InteractiveStep>;
  userResponses: ConversationResponse[];
  flowType: 'equipment_troubleshooting' | 'safety_check' | 'diagnostic' | 'maintenance';
  equipmentContext?: {
    equipmentId: string;
    category: string;
    model: string;
    issueType?: string;
  };
  isFlowActive: boolean;
  flowStartTime?: Date;
  estimatedDuration?: number; // minutes
}

export interface ConversationResponse {
  stepId: string;
  response: string;
  timestamp: Date;
  confidence?: number;
  triggeredNextStep?: string;
}

// Action types for the reducer
type ConversationFlowAction =
  | { type: 'INITIALIZE_FLOW'; payload: { flowType: string; equipmentContext: any; steps: ProgressStep[] } }
  | { type: 'ADD_INTERACTIVE_STEP'; payload: InteractiveStep }
  | { type: 'ADVANCE_TO_STEP'; payload: { stepId: string; response?: ConversationResponse } }
  | { type: 'COMPLETE_STEP'; payload: { stepId: string; response: ConversationResponse } }
  | { type: 'SKIP_STEP'; payload: { stepId: string; reason: string } }
  | { type: 'RESTART_FLOW' }
  | { type: 'END_FLOW'; payload: { outcome: 'completed' | 'escalated' | 'cancelled' } };

// Initial state
const initialState: ConversationFlowState = {
  currentStepId: null,
  currentStepIndex: 0,
  steps: [],
  interactiveSteps: new Map(),
  userResponses: [],
  flowType: 'equipment_troubleshooting',
  isFlowActive: false
};

// Reducer for conversation flow state management
const conversationFlowReducer = (
  state: ConversationFlowState,
  action: ConversationFlowAction
): ConversationFlowState => {
  switch (action.type) {
    case 'INITIALIZE_FLOW':
      return {
        ...state,
        flowType: action.payload.flowType as any,
        equipmentContext: action.payload.equipmentContext,
        steps: action.payload.steps.map((step, index) => ({
          ...step,
          status: index === 0 ? 'current' : 'upcoming'
        })),
        currentStepId: action.payload.steps[0]?.id || null,
        currentStepIndex: 0,
        userResponses: [],
        isFlowActive: true,
        flowStartTime: new Date(),
        estimatedDuration: action.payload.steps.length * 3 // 3 minutes per step estimate
      };

    case 'ADD_INTERACTIVE_STEP':
      const newInteractiveSteps = new Map(state.interactiveSteps);
      newInteractiveSteps.set(action.payload.id, action.payload);
      return {
        ...state,
        interactiveSteps: newInteractiveSteps
      };

    case 'ADVANCE_TO_STEP':
      const targetStepIndex = state.steps.findIndex(step => step.id === action.payload.stepId);
      if (targetStepIndex === -1) return state;

      const updatedSteps = state.steps.map((step, index) => {
        if (index < targetStepIndex) {
          return { ...step, status: 'completed' as const };
        } else if (index === targetStepIndex) {
          return { ...step, status: 'current' as const };
        } else {
          return { ...step, status: 'upcoming' as const };
        }
      });

      return {
        ...state,
        currentStepId: action.payload.stepId,
        currentStepIndex: targetStepIndex,
        steps: updatedSteps,
        userResponses: action.payload.response ? 
          [...state.userResponses, action.payload.response] : 
          state.userResponses
      };

    case 'COMPLETE_STEP':
      const completedStepIndex = state.steps.findIndex(step => step.id === action.payload.stepId);
      if (completedStepIndex === -1) return state;

      const stepsAfterCompletion = state.steps.map((step, index) => {
        if (index === completedStepIndex) {
          return { ...step, status: 'completed' as const };
        }
        return step;
      });

      // Find next uncompleted step
      const nextStepIndex = stepsAfterCompletion.findIndex(step => step.status === 'upcoming');
      const nextStepId = nextStepIndex !== -1 ? stepsAfterCompletion[nextStepIndex].id : null;

      // Update next step to current if found
      const finalSteps = nextStepId ? stepsAfterCompletion.map((step, index) => {
        if (index === nextStepIndex) {
          return { ...step, status: 'current' as const };
        }
        return step;
      }) : stepsAfterCompletion;

      return {
        ...state,
        currentStepId: nextStepId,
        currentStepIndex: nextStepIndex !== -1 ? nextStepIndex : state.currentStepIndex,
        steps: finalSteps,
        userResponses: [...state.userResponses, action.payload.response],
        isFlowActive: nextStepId !== null // End flow if no more steps
      };

    case 'SKIP_STEP':
      const skippedStepIndex = state.steps.findIndex(step => step.id === action.payload.stepId);
      if (skippedStepIndex === -1) return state;

      const stepsAfterSkip = state.steps.map((step, index) => {
        if (index === skippedStepIndex) {
          return { ...step, status: 'skipped' as const };
        }
        return step;
      });

      // Find next step after skipped one
      const nextAfterSkipIndex = stepsAfterSkip.findIndex((step, index) => 
        index > skippedStepIndex && step.status === 'upcoming'
      );
      const nextAfterSkipId = nextAfterSkipIndex !== -1 ? stepsAfterSkip[nextAfterSkipIndex].id : null;

      const finalAfterSkip = nextAfterSkipId ? stepsAfterSkip.map((step, index) => {
        if (index === nextAfterSkipIndex) {
          return { ...step, status: 'current' as const };
        }
        return step;
      }) : stepsAfterSkip;

      return {
        ...state,
        currentStepId: nextAfterSkipId,
        currentStepIndex: nextAfterSkipIndex !== -1 ? nextAfterSkipIndex : state.currentStepIndex,
        steps: finalAfterSkip,
        isFlowActive: nextAfterSkipId !== null
      };

    case 'RESTART_FLOW':
      return {
        ...state,
        currentStepId: state.steps[0]?.id || null,
        currentStepIndex: 0,
        steps: state.steps.map((step, index) => ({
          ...step,
          status: index === 0 ? 'current' : 'upcoming'
        })),
        userResponses: [],
        isFlowActive: true,
        flowStartTime: new Date()
      };

    case 'END_FLOW':
      return {
        ...state,
        isFlowActive: false,
        steps: state.steps.map(step => ({
          ...step,
          status: step.status === 'current' ? 'completed' : step.status
        }))
      };

    default:
      return state;
  }
};

// Context for conversation flow
const ConversationFlowContext = createContext<{
  state: ConversationFlowState;
  dispatch: React.Dispatch<ConversationFlowAction>;
  // Helper functions
  getCurrentStep: () => ProgressStep | null;
  getCurrentInteractiveStep: () => InteractiveStep | null;
  getProgress: () => { completed: number; total: number; percentage: number };
  canAdvanceToStep: (stepId: string) => boolean;
  getEstimatedTimeRemaining: () => number; // minutes
} | null>(null);

// Provider component
export const ConversationFlowProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(conversationFlowReducer, initialState);

  const getCurrentStep = (): ProgressStep | null => {
    return state.steps.find(step => step.id === state.currentStepId) || null;
  };

  const getCurrentInteractiveStep = (): InteractiveStep | null => {
    if (!state.currentStepId) return null;
    return state.interactiveSteps.get(state.currentStepId) || null;
  };

  const getProgress = () => {
    const completed = state.steps.filter(step => step.status === 'completed').length;
    const total = state.steps.length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { completed, total, percentage };
  };

  const canAdvanceToStep = (stepId: string): boolean => {
    const targetStepIndex = state.steps.findIndex(step => step.id === stepId);
    if (targetStepIndex === -1) return false;
    
    // Can advance if target step is next in sequence or if all previous steps are completed
    const allPreviousCompleted = state.steps
      .slice(0, targetStepIndex)
      .every(step => step.status === 'completed' || step.status === 'skipped');
    
    return allPreviousCompleted;
  };

  const getEstimatedTimeRemaining = (): number => {
    const remainingSteps = state.steps.filter(step => 
      step.status === 'current' || step.status === 'upcoming'
    );
    
    // Estimate 2-4 minutes per step based on type
    return remainingSteps.reduce((total, step) => {
      switch (step.type) {
        case 'safety_check':
          return total + 1; // Safety checks are quick
        case 'visual_inspection':
          return total + 2;
        case 'operational_test':
          return total + 4; // Tests take longer
        case 'diagnostic':
          return total + 3;
        case 'resolution':
          return total + 2;
        default:
          return total + 3;
      }
    }, 0);
  };

  const contextValue = {
    state,
    dispatch,
    getCurrentStep,
    getCurrentInteractiveStep,
    getProgress,
    canAdvanceToStep,
    getEstimatedTimeRemaining
  };

  return (
    <ConversationFlowContext.Provider value={contextValue}>
      {children}
    </ConversationFlowContext.Provider>
  );
};

// Hook to use conversation flow context
export const useConversationFlow = () => {
  const context = useContext(ConversationFlowContext);
  if (!context) {
    throw new Error('useConversationFlow must be used within a ConversationFlowProvider');
  }
  return context;
};

// Helper functions for creating flows

export const createEquipmentTroubleshootingFlow = (
  equipmentCategory: string,
  issueType: string,
  equipmentModel: string
): ProgressStep[] => {
  const baseSteps: ProgressStep[] = [
    {
      id: 'safety-check',
      title: 'Safety Check',
      type: 'safety_check',
      status: 'upcoming',
      safetyLevel: 'danger',
      timeEstimate: '1 minute'
    },
    {
      id: 'external-inspection',
      title: 'External Inspection',
      type: 'visual_inspection',
      status: 'upcoming',
      safetyLevel: 'safe',
      timeEstimate: '2-3 minutes'
    },
    {
      id: 'basic-operation',
      title: 'Basic Operation Check',
      type: 'operational_test',
      status: 'upcoming',
      safetyLevel: 'caution',
      timeEstimate: '3-5 minutes'
    }
  ];

  // Add equipment-specific steps based on category
  switch (equipmentCategory.toLowerCase()) {
    case 'refrigeration':
      baseSteps.push({
        id: 'temperature-check',
        title: 'Temperature Verification',
        type: 'diagnostic',
        status: 'upcoming',
        safetyLevel: 'caution',
        timeEstimate: '2-3 minutes'
      });
      break;
    
    case 'cooking':
      baseSteps.push({
        id: 'heating-test',
        title: 'Heating System Test',
        type: 'diagnostic',
        status: 'upcoming',
        safetyLevel: 'caution',
        timeEstimate: '3-4 minutes'
      });
      break;
    
    case 'warewashing':
      baseSteps.push({
        id: 'water-system-check',
        title: 'Water System Check',
        type: 'diagnostic',
        status: 'upcoming',
        safetyLevel: 'safe',
        timeEstimate: '2-3 minutes'
      });
      break;
  }

  // Always end with resolution step
  baseSteps.push({
    id: 'resolution',
    title: 'Resolution & Next Steps',
    type: 'resolution',
    status: 'upcoming',
    safetyLevel: 'safe',
    timeEstimate: '1-2 minutes'
  });

  return baseSteps;
};

export const createSafetyCheckFlow = (): ProgressStep[] => [
  {
    id: 'immediate-hazards',
    title: 'Immediate Hazard Check',
    type: 'safety_check',
    status: 'upcoming',
    safetyLevel: 'danger',
    timeEstimate: '30 seconds'
  },
  {
    id: 'power-isolation',
    title: 'Power & Isolation',
    type: 'safety_check',
    status: 'upcoming',
    safetyLevel: 'danger',
    timeEstimate: '1 minute'
  },
  {
    id: 'environmental-check',
    title: 'Environmental Safety',
    type: 'safety_check',
    status: 'upcoming',
    safetyLevel: 'caution',
    timeEstimate: '1 minute'
  }
];

export default ConversationFlowProvider;
