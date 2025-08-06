import React, { createContext, useReducer, ReactNode } from 'react';
import type {
  ProgressStep,
  InteractiveStep,
  ConversationResponse,
  EquipmentContext,
  IssueContext,
  ConversationFlowState,
  ConversationFlowAction
} from '../types/chat';

// Re-export types for convenience
export type {
  ProgressStep,
  InteractiveStep,
  ConversationResponse,
  EquipmentContext,
  IssueContext,
  ConversationFlowState,
  ConversationFlowAction
} from '../types/chat';

const initialState: ConversationFlowState = {
  isFlowActive: false,
  currentStepIndex: 0,
  steps: [],
  interactiveSteps: [],
  userResponses: [],
  equipmentContext: null,
  issueContext: null,
  flowOutcome: null,
};

function conversationFlowReducer(
  state: ConversationFlowState,
  action: ConversationFlowAction
): ConversationFlowState {
  switch (action.type) {
    case 'INITIALIZE_FLOW':
      return {
        ...state,
        isFlowActive: true,
        currentStepIndex: 0,
        equipmentContext: action.payload.equipment,
        issueContext: action.payload.issue,
        steps: action.payload.steps,
        flowOutcome: 'in_progress',
      };

    case 'ADD_INTERACTIVE_STEP':
      return {
        ...state,
        interactiveSteps: [...state.interactiveSteps, action.payload],
      };

    case 'NEXT_STEP':
      const nextIndex = state.currentStepIndex + 1;
      return {
        ...state,
        currentStepIndex: nextIndex,
        userResponses: [
          ...state.userResponses,
          { stepId: action.payload.stepId, response: action.payload.response.response },
        ],
        steps: state.steps.map((step, index) =>
          index === state.currentStepIndex ? { ...step, completed: true, status: 'completed' } : step
        ),
      };

    case 'PREVIOUS_STEP':
      return {
        ...state,
        currentStepIndex: Math.max(0, state.currentStepIndex - 1),
      };

    case 'COMPLETE_FLOW':
      return {
        ...state,
        isFlowActive: false,
        flowOutcome: action.payload.outcome,
      };

    case 'RESET_FLOW':
      return initialState;

    default:
      return state;
  }
}

export const ConversationFlowContext = createContext<{
  state: ConversationFlowState;
  dispatch: React.Dispatch<ConversationFlowAction>;
} | null>(null);

export function ConversationFlowProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(conversationFlowReducer, initialState);

  return (
    <ConversationFlowContext.Provider value={{ state, dispatch }}>
      {children}
    </ConversationFlowContext.Provider>
  );
}