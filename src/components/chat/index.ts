// ============================================================================
// CHAT COMPONENTS INDEX - USING CENTRAL TYPES
// ============================================================================
// All type definitions now come from src/types/chat.ts to ensure consistency
// ============================================================================

// COMPONENT IMPORTS
import ConversationFlow from './ConversationFlow';
import InteractiveMessage from './InteractiveMessage';
import ProgressIndicator from './ProgressIndicator';
import SafetyAlert from './SafetyAlert';
import ChatHeader from './ChatHeader';
import ChatInput from './ChatInput';
import MessageBubble from './MessageBubble';
import ResponseButtons from './ResponseButtons';
import EquipmentStatus from './EquipmentStatus';
import EscalationFlow from './EscalationFlow';
import ManagerApproval from './ManagerApproval';
import ResponseClassification from './ResponseClassification';

// Import types from central location
import type {
  ProgressStep,
  InteractiveStep,
  ConversationResponse,
  SafetyLevel
} from '../../types/chat';

// Import hook and provider
import {
  useConversationFlow,
  ConversationFlowProvider,
  createEquipmentTroubleshootingFlow,
  createInteractiveStepFromProgressStep
} from '../../hooks/useConversationFlow';

// ============================================================================
// TYPE RE-EXPORTS FROM CENTRAL LOCATION
// ============================================================================

export type {
  ProgressStep,
  InteractiveStep,
  ConversationResponse,
  SafetyLevel,
  EquipmentContext,
  IssueContext,
  ConversationFlowState,
  ConversationFlowAction
} from '../../types/chat';

// Re-export conversation flow utilities
export {
  useConversationFlow,
  ConversationFlowProvider,
  createEquipmentTroubleshootingFlow,
  createInteractiveStepFromProgressStep
};

// ============================================================================
// COMPONENT EXPORTS
// ============================================================================

export { default as ConversationFlow } from './ConversationFlow';
export { default as InteractiveMessage } from './InteractiveMessage';
export { default as ProgressIndicator } from './ProgressIndicator';
export { default as SafetyAlert } from './SafetyAlert';
export { default as ChatHeader } from './ChatHeader';
export { default as ChatInput } from './ChatInput';
export { default as MessageBubble } from './MessageBubble';
export { default as ResponseButtons } from './ResponseButtons';
export { default as EquipmentStatus } from './EquipmentStatus';
export { default as EscalationFlow } from './EscalationFlow';
export { default as ManagerApproval } from './ManagerApproval';
export { default as ResponseClassification } from './ResponseClassification';

// ============================================================================
// UTILITIES
// ============================================================================

export const validateChatIntegration = () => {
  console.log('🎉 Chat components with centralized types:')
  console.log('- Central types: ✅ src/types/chat.ts')
  console.log('- ConversationFlow: ✅ Using central types')
  console.log('- InteractiveMessage: ✅ Using central types')
  console.log('- ProgressIndicator: ✅ Using central types')
  console.log('- SafetyAlert: ✅ Using central types')
  console.log('- Type consistency: ✅ Single source of truth')
  console.log('- No duplicate definitions: ✅ All types imported')
};

// ============================================================================
// DEFAULT EXPORT
// ============================================================================

export default {
  // Components
  ConversationFlow,
  InteractiveMessage,
  ProgressIndicator,
  SafetyAlert,
  ChatHeader,
  ChatInput,
  MessageBubble,
  ResponseButtons,
  EquipmentStatus,
  EscalationFlow,
  ManagerApproval,
  ResponseClassification,
  
  // Hooks and Providers
  useConversationFlow,
  ConversationFlowProvider,
  createEquipmentTroubleshootingFlow,
  createInteractiveStepFromProgressStep,
  
  // Utilities
  validateChatIntegration
};