import { useContext } from 'react';
import { ConversationFlowContext } from '../contexts/ConversationFlowContext';
import type {
  ProgressStep,
  InteractiveStep,
  ConversationResponse,
  createProgressStep,
  createInteractiveStep
} from '../types/chat';

// Re-export types from central location
export type {
  ProgressStep,
  InteractiveStep,
  ConversationResponse,
  EquipmentContext,
  IssueContext,
  ConversationFlowState,
  ConversationFlowAction
} from '../types/chat';

// Re-export the provider from context
export { ConversationFlowProvider } from '../contexts/ConversationFlowContext';

// The actual hook
export function useConversationFlow() {
  const context = useContext(ConversationFlowContext);
  if (!context) {
    throw new Error('useConversationFlow must be used within ConversationFlowProvider');
  }

  const { state, dispatch } = context;

  const getCurrentStep = () => {
    return state.steps[state.currentStepIndex] || null;
  };

  const getCurrentInteractiveStep = () => {
    const currentStep = getCurrentStep();
    if (!currentStep) return null;
    return state.interactiveSteps.find(step => step.id === currentStep.id) || null;
  };

  const getProgress = () => {
    const completedSteps = state.steps.filter(step => step.status === 'completed').length;
    const totalSteps = state.steps.length;
    const percentage = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0;
    
    return {
      completedSteps,
      totalSteps,
      percentage,
      currentStep: state.currentStepIndex + 1,
    };
  };

  return {
    state,
    dispatch,
    getCurrentStep,
    getCurrentInteractiveStep,
    getProgress,
  };
}

// Helper function to create equipment troubleshooting flow
export function createEquipmentTroubleshootingFlow(
  equipmentCategory: string,
  issueType: string,
  equipmentName: string
): { steps: ProgressStep[] } {
  const baseSteps: ProgressStep[] = [
    {
      id: 'safety-check',
      type: 'safety_check',
      title: 'Safety Check',
      timeEstimate: '2 minutes',
      status: 'upcoming',
      completed: false,
    },
    {
      id: 'visual-inspection',
      type: 'visual_inspection',
      title: 'Visual Inspection',
      timeEstimate: '3 minutes',
      status: 'upcoming',
      completed: false,
    },
    {
      id: 'operational-test',
      type: 'operational_test',
      title: 'Operational Test',
      timeEstimate: '5 minutes',
      status: 'upcoming',
      completed: false,
    },
    {
      id: 'resolution',
      type: 'resolution',
      title: 'Resolution',
      timeEstimate: '2 minutes',
      status: 'upcoming',
      completed: false,
    },
  ];

  // Customize based on equipment category and issue type
  if (equipmentCategory === 'refrigeration' && issueType.includes('temperature')) {
    return {
      steps: [
        baseSteps[0], // Safety check
        {
          id: 'temp-check',
          type: 'diagnostic',
          title: 'Temperature Check',
          timeEstimate: '3 minutes',
          status: 'upcoming',
          completed: false,
        },
        baseSteps[1], // Visual inspection
        {
          id: 'seal-check',
          type: 'diagnostic',
          title: 'Door Seal Check',
          timeEstimate: '2 minutes',
          status: 'upcoming',
          completed: false,
        },
        baseSteps[3], // Resolution
      ],
    };
  }

  return { steps: baseSteps };
}

// Helper function to create interactive step from progress step
export function createInteractiveStepFromProgressStep(
  step: ProgressStep,
  index: number,
  totalSteps: number
): InteractiveStep {
  const progressPercentage = Math.round((index / Math.max(totalSteps - 1, 1)) * 100);
  
  const baseInteractiveStep: InteractiveStep = {
    id: step.id,
    stepNumber: index + 1,
    title: step.title,
    description: `Step ${index + 1} of ${totalSteps}: ${step.title}`,
    type: step.type,
    content: {
      instruction: `Please complete the ${step.title} step.`,
    },
    responseOptions: [
      {
        id: 'continue',
        label: 'Continue',
        value: 'continue',
        action: 'continue',
        style: 'primary',
      },
      {
        id: 'need-help',
        label: 'Need Help',
        value: 'need-help',
        action: 'escalate',
        style: 'secondary',
      },
    ],
    progressPercentage,
    estimatedTime: step.timeEstimate,
    safetyLevel: 'safe',
  };

  // Customize based on step type
  switch (step.type) {
    case 'safety_check':
      return {
        ...baseInteractiveStep,
        title: '🛡️ Safety Check',
        content: {
          instruction: 'Before we begin, let\'s ensure it\'s safe to proceed.',
          details: [
            'Ensure the area is clear and safe',
            'Check for any obvious hazards',
            'Have necessary safety equipment ready',
          ],
          warnings: [
            'Do not proceed if you smell gas or see electrical damage',
            'Stop immediately if you feel unsafe',
          ],
        },
        responseOptions: [
          {
            id: 'safe',
            label: '✅ Safe to Proceed',
            value: 'safe',
            action: 'continue',
            style: 'primary',
          },
          {
            id: 'unsafe',
            label: '🚨 Safety Concern',
            value: 'unsafe',
            action: 'escalate',
            style: 'danger',
          },
        ],
        safetyLevel: 'caution',
      };

    case 'visual_inspection':
      return {
        ...baseInteractiveStep,
        title: '🔍 Visual Inspection',
        content: {
          instruction: 'Let\'s examine the equipment for visible issues.',
          details: [
            'Look for any visible damage',
            'Check for loose connections',
            'Inspect for unusual wear or buildup',
          ],
        },
        responseOptions: [
          {
            id: 'no-issues',
            label: '✅ No Issues Found',
            value: 'no-issues',
            action: 'continue',
            style: 'primary',
          },
          {
            id: 'issues-found',
            label: '⚠️ Issues Found',
            value: 'issues-found',
            action: 'escalate',
            style: 'secondary',
          },
        ],
      };

    case 'resolution':
      return {
        ...baseInteractiveStep,
        title: '✅ Resolution',
        content: {
          instruction: 'Let\'s verify the issue has been resolved.',
          details: [
            'Test the equipment operation',
            'Confirm the issue is fixed',
            'Document the resolution',
          ],
        },
        responseOptions: [
          {
            id: 'resolved',
            label: '✅ Issue Resolved',
            value: 'resolved',
            action: 'complete',
            style: 'primary',
          },
          {
            id: 'not-resolved',
            label: '❌ Still Not Working',
            value: 'not-resolved',
            action: 'escalate',
            style: 'secondary',
          },
        ],
      };

    default:
      return baseInteractiveStep;
  }
}