import React, { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useEquipment } from "@/contexts/EquipmentContext";
import { supabase } from "@/lib/supabase";
import ChatHeader from "@/components/chat/ChatHeader";
import MessageBubble from "@/components/chat/MessageBubble";
import ChatInput from "@/components/chat/ChatInput";
import {
  InteractiveMessage,
  ProgressIndicator,
  ConversationFlowProvider,
  useConversationFlow,
  createEquipmentTroubleshootingFlow,
  createInteractiveStepFromProgressStep,
} from "@/components/chat";
import type {
  InteractiveStep,
  ProgressStep,
  ConversationResponse,
  SafetyLevel,
} from "@/components/chat";
import { ArrowLeft, Loader2 } from "lucide-react";

export interface ChatMessage {
  id: string;
  type: "user" | "assistant" | "system" | "interactive";
  content: string;
  timestamp: Date;
  responseType?: "pattern" | "ai" | "safety" | "cache";
  classification?: {
    safety: SafetyLevel;
    confidence: number;
    costGBP?: number;
    tokens?: number;
    model?: string;
  };
  equipmentContext?: {
    equipmentId: string;
    model: string;
    issueType?: string;
  };
  interactiveStep?: InteractiveStep;
  isInteractive?: boolean;
}

export interface IssueType {
  id: string;
  title: string;
  description: string;
  category: string;
  severity: "low" | "medium" | "high" | "critical";
}

const ChatInterfaceInner: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const router = useRouter();
  const location = useLocation();
  const { selectedEquipment } = useEquipment();

  // Conversation flow context
  const {
    state: flowState,
    dispatch: flowDispatch,
    getCurrentStep,
    getCurrentInteractiveStep,
    getProgress,
  } = useConversationFlow();

  // Get equipment and issue from navigation state
  const equipment = location.state?.equipment || selectedEquipment;
  const selectedIssue = location.state?.selectedIssue as IssueType | undefined;

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showInteractiveFlow, setShowInteractiveFlow] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Redirect if no equipment context
  useEffect(() => {
    if (!equipment) {
      console.warn("No equipment context found, redirecting to equipment grid");
      router.push("/equipment");
      return;
    }
  }, [equipment, router]);

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initialize chat session and conversation flow
  useEffect(() => {
    if (equipment && selectedIssue && messages.length === 0) {
      initializeChatSession();
      initializeConversationFlow();
    }
  }, [equipment, selectedIssue]);

  // Setup real-time message subscription
  useEffect(() => {
    if (!sessionId) return;

    const channel = supabase
      .channel(`chat_messages_${sessionId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => {
          const newMessage = transformSupabaseMessage(payload.new);
          setMessages((prev) => {
            // Avoid duplicates
            if (prev.some((msg) => msg.id === newMessage.id)) {
              return prev;
            }
            return [...prev, newMessage];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId]);

  const initializeConversationFlow = () => {
    if (!equipment || !selectedIssue) return;

    // Create equipment-specific troubleshooting flow
    const flowData = createEquipmentTroubleshootingFlow(
      equipment.category || "general",
      selectedIssue.title,
      equipment.display_name
    );

    // Initialize the conversation flow
    flowDispatch({
      type: "INITIALIZE_FLOW",
      payload: {
        equipment: {
          id: equipment.id,
          category: equipment.category,
          display_name: equipment.display_name,
          manufacturer: equipment.manufacturer,
          model: equipment.display_name,
          serial_number: "",
          current_status: equipment.current_status as any,
          location_name: equipment.location_name,
          performance_rating: equipment.performance_rating,
          is_critical_equipment: equipment.is_critical_equipment,
          equipment_type_id: equipment.equipment_type_id,
          site_id: "dfca581b-5590-4845-9b05-8d90f59037c9",
          qr_code: equipment.qr_code,
          internal_name: equipment.internal_name,
        },
        issue: {
          id: selectedIssue.id,
          title: selectedIssue.title,
          description: selectedIssue.description,
          category: selectedIssue.category as any,
          severity: selectedIssue.severity,
          icon: "🔧",
          estimatedResolutionTime: 10,
          commonSolutions: [],
          requiresProfessionalService: false,
          safetyRisk: false,
          equipmentTypes: [equipment.category],
        },
        steps: flowData.steps,
      },
    });

    // Add interactive steps for each flow step
    flowData.steps.forEach((step: ProgressStep, index: number) => {
      const interactiveStep: InteractiveStep =
        createInteractiveStepFromProgressStep(
          step,
          index,
          flowData.steps.length
        );
      flowDispatch({
        type: "ADD_INTERACTIVE_STEP",
        payload: interactiveStep,
      });
    });

    // Enable interactive flow
    setShowInteractiveFlow(true);
  };

  // INTEGRATION FIX 1: Fixed step type mapping to match expected types
  const createCustomInteractiveStep = (
    step: ProgressStep,
    index: number,
    totalSteps: number
  ): InteractiveStep => {
    const equipmentName = equipment?.display_name || "equipment";
    const issueTitle = selectedIssue?.title || "the issue";

    // FIXED: Map old step types to new expected types
    switch (step.type) {
      case "safety_check":
        return {
          id: step.id,
          stepNumber: index + 1,
          title: "🛡️ Safety Check",
          description: `Before we begin troubleshooting your ${equipmentName}, let's ensure it's safe to proceed.`,
          type: "safety_check", // FIXED: Use correct type
          content: {
            instruction: `Before we begin troubleshooting your ${equipmentName}, let's ensure it's safe to proceed.`,
            details: [
              "Ensure the equipment is accessible and the area is clear",
              "Check that you have adequate lighting to see clearly",
              "Make sure no food is currently being processed",
              "Verify you have tools if needed (non-contact thermometer, flashlight)",
            ],
            warnings: [
              "Never attempt repairs on equipment that is still connected to power",
              "If you smell gas or see sparks, stop immediately and call for help",
              "Do not remove any panels or covers unless specifically instructed",
            ],
            safetyNote:
              "Safety first - if anything seems unsafe, stop and contact a professional.",
          },
          responseOptions: [
            {
              id: "safe_to_proceed",
              label: "✅ Area is safe to proceed",
              value: "safe",
              action: "continue",
              style: "primary",
            },
            {
              id: "safety_concern",
              label: "🚨 Safety concern detected",
              value: "unsafe",
              action: "escalate",
              style: "danger",
            },
          ],
          progressPercentage: Math.round(
            (index / Math.max(totalSteps - 1, 1)) * 100
          ),
          estimatedTime: step.timeEstimate, // FIXED: Use timeEstimate instead of estimatedDuration
          safetyLevel: "danger",
        };

      case "visual_inspection":
        return {
          id: step.id,
          stepNumber: index + 1,
          title: "🔍 Visual Inspection",
          description: `Let's examine the external condition of your ${equipmentName} for obvious issues.`,
          type: "visual_inspection", // FIXED: Use correct type
          content: {
            instruction: `Let's examine the external condition of your ${equipmentName} for obvious issues.`,
            details: [
              "Look for any visible damage to the exterior panels or casing",
              "Check all cables and connections for damage or looseness",
              "Inspect the power cord and plug for any damage",
              "Look for any unusual buildup of grease, ice, or debris",
            ],
            warnings: [
              "Do not touch any electrical connections while inspecting",
              "Be careful around sharp edges or hot surfaces",
            ],
          },
          responseOptions: [
            {
              id: "continue",
              label: "✅ Everything looks normal",
              value: "continue",
              action: "continue",
              style: "primary",
            },
            {
              id: "issues_found",
              label: "⚠️ Found some issues",
              value: "issues_found",
              action: "escalate",
              style: "secondary",
            },
          ],
          progressPercentage: Math.round(
            (index / Math.max(totalSteps - 1, 1)) * 100
          ),
          estimatedTime: step.timeEstimate, // FIXED: Use timeEstimate instead of estimatedDuration
          safetyLevel: "safe",
        };

      case "operational_test":
        return {
          id: step.id,
          stepNumber: index + 1,
          title: "🔧 Basic Operation Check",
          description: `Now let's test the basic operation of your ${equipmentName} related to ${issueTitle}.`,
          type: "operational_test", // FIXED: Use correct type
          content: {
            instruction: `Now let's test the basic operation of your ${equipmentName} related to ${issueTitle}.`,
            details: [
              "Turn the equipment on using normal operating procedures",
              "Listen for any unusual noises (grinding, clicking, buzzing)",
              "Observe the normal startup sequence",
              "Check that all indicators, lights, and displays are working",
            ],
          },
          responseOptions: [
            {
              id: "working",
              label: "✅ Operating normally",
              value: "working",
              action: "continue",
              style: "primary",
            },
            {
              id: "not_working",
              label: "❌ Still not working correctly",
              value: "not_working",
              action: "escalate",
              style: "secondary",
            },
          ],
          progressPercentage: Math.round(
            (index / Math.max(totalSteps - 1, 1)) * 100
          ),
          estimatedTime: step.timeEstimate, // FIXED: Use timeEstimate instead of estimatedDuration
          safetyLevel: "caution",
        };

      case "resolution":
        return {
          id: step.id,
          stepNumber: index + 1,
          title: "✅ Resolution & Next Steps",
          description: `Great! Let's complete the troubleshooting process for your ${equipmentName}.`,
          type: "resolution", // FIXED: Use correct type
          content: {
            instruction: `Great! Let's complete the troubleshooting process for your ${equipmentName}.`,
            details: [
              "Verify the issue has been resolved",
              "Test normal operation to confirm everything is working",
              "Clean up any tools or materials used",
            ],
          },
          responseOptions: [
            {
              id: "resolved",
              label: "✅ Issue resolved",
              value: "resolved",
              action: "complete",
              style: "primary",
            },
            {
              id: "persists",
              label: "🔄 Issue persists",
              value: "persists",
              action: "escalate",
              style: "secondary",
            },
          ],
          progressPercentage: Math.round(
            (index / Math.max(totalSteps - 1, 1)) * 100
          ),
          estimatedTime: step.timeEstimate, // FIXED: Use timeEstimate instead of estimatedDuration
          safetyLevel: "safe",
        };

      default:
        return {
          id: step.id,
          stepNumber: index + 1,
          title: step.title,
          description: `Troubleshooting step: ${step.title}`, // FIXED: Create description from title since ProgressStep has no description field
          type: "diagnostic", // FIXED: Use correct default type
          content: {
            instruction: `Troubleshooting step: ${step.title}`,
          },
          responseOptions: [
            {
              id: "continue",
              label: "✅ Continue",
              value: "continue",
              action: "continue",
              style: "primary",
            },
            {
              id: "need_help",
              label: "🤷 Need help",
              value: "need_help",
              action: "escalate",
              style: "secondary",
            },
          ],
          progressPercentage: Math.round(
            (index / Math.max(totalSteps - 1, 1)) * 100
          ),
          estimatedTime: step.timeEstimate, // FIXED: Use timeEstimate instead of estimatedDuration
          safetyLevel: "safe",
        };
    }
  };

  const initializeChatSession = async () => {
    if (!equipment || !selectedIssue) return;

    try {
      setIsLoading(true);
      setError(null);

      // Create initial system message
      const welcomeMessage: ChatMessage = {
        id: `system-${Date.now()}`,
        type: "system",
        content: `Starting step-by-step troubleshooting for ${equipment.display_name}: ${selectedIssue.title}`,
        timestamp: new Date(),
        equipmentContext: {
          equipmentId: equipment.id,
          model: equipment.display_name,
          issueType: selectedIssue.title,
        },
      };

      setMessages([welcomeMessage]);

      // Start with first interactive step
      const firstStep = getCurrentStep();
      const firstInteractiveStep = getCurrentInteractiveStep();

      if (firstStep && firstInteractiveStep) {
        // INTEGRATION FIX 2: Create properly formatted interactive message
        const interactiveMessage: ChatMessage = {
          id: `interactive-${Date.now()}`,
          type: "interactive",
          content:
            typeof firstInteractiveStep.content === "string"
              ? firstInteractiveStep.content
              : firstInteractiveStep.content.instruction, // FIXED: Handle both content formats
          timestamp: new Date(),
          interactiveStep: firstInteractiveStep,
          isInteractive: true,
          responseType: "pattern",
          classification: {
            safety: firstInteractiveStep.safetyLevel || "safe",
            confidence: 1.0,
            costGBP: 0, // Interactive steps are free
          },
          equipmentContext: {
            equipmentId: equipment.id,
            model: equipment.display_name,
            issueType: selectedIssue.title,
          },
        };

        setMessages((prev) => [...prev, interactiveMessage]);
      }
    } catch (error) {
      console.error("Failed to initialize chat:", error);
      setError("Failed to start troubleshooting session");
    } finally {
      setIsLoading(false);
    }
  };

  const handleInteractiveResponse = async (
    stepId: string,
    response: string,
    nextStepId?: string
  ) => {
    try {
      // Create user response message
      const userResponseMessage: ChatMessage = {
        id: `user-response-${Date.now()}`,
        type: "user",
        content: response,
        timestamp: new Date(),
        equipmentContext: {
          equipmentId: equipment!.id,
          model: equipment!.display_name,
          issueType: selectedIssue?.title,
        },
      };

      setMessages((prev) => [...prev, userResponseMessage]);

      // Create conversation response for flow tracking
      const conversationResponse: ConversationResponse = {
        response: response,
        confidence: 1.0,
        suggestedActions: [],
        requiresEscalation: false,
        safetyLevel: "safe",
      };

      // Handle special responses
      if (
        response.includes("🚨 Safety concern") ||
        response.includes("🔧 Need professional help")
      ) {
        await handleSafetyEscalation(response);
        return;
      }

      if (
        response.includes("Issue persists") ||
        response.includes("Still unclear")
      ) {
        await escalateToAI(conversationResponse);
        return;
      }

      // Handle maintenance logging navigation
      if (
        response.includes("📝 Log maintenance action") ||
        nextStepId === "maintenance-log"
      ) {
        const query = new URLSearchParams({
          sessionId: sessionId ?? "",
          issueTitle: selectedIssue?.title ?? "",
          resolutionType: "repair",
          resolutionNotes: "Issue resolved through troubleshooting chat",
        }).toString();

        router.push(`/maintenance/${equipment!.id}?${query}`);
        return;
      }

      // Advance to next step if we have one
      if (
        nextStepId &&
        nextStepId !== "complete" &&
        nextStepId !== "escalation" &&
        nextStepId !== "maintenance-log"
      ) {
        flowDispatch({
          type: "NEXT_STEP",
          payload: { stepId: nextStepId, response: conversationResponse },
        });

        // Add next interactive step message
        const nextInteractiveStep = flowState.interactiveSteps.find(
          (step: InteractiveStep) => step.id === nextStepId
        );
        if (nextInteractiveStep) {
          setTimeout(() => {
            const nextInteractiveMessage: ChatMessage = {
              id: `interactive-${Date.now()}`,
              type: "interactive",
              content:
                typeof nextInteractiveStep.content === "string"
                  ? nextInteractiveStep.content
                  : nextInteractiveStep.content.instruction, // FIXED: Handle both content formats
              timestamp: new Date(),
              interactiveStep: nextInteractiveStep,
              isInteractive: true,
              responseType: "pattern",
              classification: {
                safety: nextInteractiveStep.safetyLevel || "safe",
                confidence: 1.0,
                costGBP: 0,
              },
              equipmentContext: {
                equipmentId: equipment!.id,
                model: equipment!.display_name,
                issueType: selectedIssue?.title,
              },
            };

            setMessages((prev) => [...prev, nextInteractiveMessage]);
          }, 500);
        }
      } else if (nextStepId === "complete") {
        // Flow completed successfully
        flowDispatch({
          type: "COMPLETE_FLOW",
          payload: { outcome: "completed" },
        });

        const completionMessage: ChatMessage = {
          id: `completion-${Date.now()}`,
          type: "system",
          content:
            "✅ Troubleshooting completed successfully! The issue should now be resolved. If you need to log this maintenance action or have any other concerns, please let me know.",
          timestamp: new Date(),
          classification: {
            safety: "safe",
            confidence: 1.0,
            costGBP: 0,
          },
        };

        setMessages((prev) => [...prev, completionMessage]);
      }
    } catch (error) {
      console.error("Error handling interactive response:", error);
      setError("Failed to process your response");
    }
  };

  const handleSafetyEscalation = async (response: string) => {
    const safetyMessage: ChatMessage = {
      id: `safety-${Date.now()}`,
      type: "system",
      content:
        "🚨 Safety concern detected. Please stop all troubleshooting immediately and contact your manager or facilities team. Do not continue working on this equipment until it has been inspected by a qualified technician.",
      timestamp: new Date(),
      responseType: "safety",
      classification: {
        safety: "danger",
        confidence: 1.0,
        costGBP: 0,
      },
    };

    setMessages((prev) => [...prev, safetyMessage]);
    flowDispatch({ type: "COMPLETE_FLOW", payload: { outcome: "escalated" } });
  };

  const escalateToAI = async (conversationResponse: ConversationResponse) => {
    setIsTyping(true);

    try {
      const escalationPrompt = `The interactive troubleshooting for ${
        equipment!.display_name
      } needs expert assistance. Issue: ${
        selectedIssue?.title
      }. User responses so far: ${flowState.userResponses
        .map((r: any) => `${r.stepId}: ${r.response}`)
        .join(", ")}. Latest response: ${
        conversationResponse.response
      }. Please provide expert guidance.`;

      await sendMessage(escalationPrompt, true);
    } catch (error) {
      console.error("Failed to escalate to AI:", error);
      setError("Failed to get expert assistance");
    } finally {
      setIsTyping(false);
    }
  };

  const sendMessage = async (content: string, isSystemMessage = false) => {
    if (!content.trim() || !equipment) return;

    try {
      setIsTyping(true);
      setError(null);

      // Add user message if not system message
      if (!isSystemMessage) {
        const userMessage: ChatMessage = {
          id: `user-${Date.now()}`,
          type: "user",
          content: content.trim(),
          timestamp: new Date(),
          equipmentContext: {
            equipmentId: equipment.id,
            model: equipment.display_name,
            issueType: selectedIssue?.title,
          },
        };

        setMessages((prev) => [...prev, userMessage]);
      }

      // INTEGRATION FIX 3: Enhanced Supabase integration with proper error handling
      const { data, error: functionError } = await supabase.functions.invoke(
        "master-chat",
        {
          body: {
            message: content.trim(),
            equipment_context: {
              equipment_id: equipment.id,
              equipment_type_id: equipment.equipment_type_id,
              display_name: equipment.display_name,
              manufacturer: equipment.manufacturer,
              category: equipment.category,
              current_status: equipment.current_status,
              location: equipment.location_name,
              issue_type: selectedIssue?.title,
              issue_description: selectedIssue?.description,
            },
            user_context: {
              user_id: "kitchen-staff",
              site_id: "dfca581b-5590-4845-9b05-8d90f59037c9",
              session_id: sessionId,
            },
            conversation_history: messages
              .filter((m) => m.type !== "system" && m.type !== "interactive")
              .map((m) => ({
                role: m.type === "user" ? "user" : "assistant",
                content: m.content,
              })),
            interactive_flow_context: {
              current_step: getCurrentStep()?.title,
              completed_steps: flowState.userResponses.map(
                (r: any) => `${r.stepId}: ${r.response}`
              ),
              equipment_context: flowState.equipmentContext,
            },
          },
        }
      );

      if (functionError) {
        throw new Error(functionError.message || "Failed to get AI response");
      }

      if (data?.success && data?.response) {
        const aiMessage: ChatMessage = {
          id: `ai-${Date.now()}`,
          type: "assistant",
          content:
            data.response.message ||
            data.response.content ||
            "I apologize, but I was unable to generate a helpful response. Please try describing the issue differently or contact technical support.",
          timestamp: new Date(),
          responseType: data.response.classification?.type || "ai",
          classification: {
            safety: data.response.classification?.safety || "safe",
            confidence: data.response.classification?.confidence || 0.8,
            costGBP: data.response.classification?.cost_gbp || 0,
            tokens: data.response.classification?.tokens,
            model: data.response.classification?.model,
          },
          equipmentContext: {
            equipmentId: equipment.id,
            model: equipment.display_name,
            issueType: selectedIssue?.title,
          },
        };

        setMessages((prev) => [...prev, aiMessage]);

        // Handle safety alerts
        if (data.response.classification?.safety === "danger") {
          console.warn("🚨 Safety alert triggered:", data.response.message);
        }
      } else {
        throw new Error("Invalid response format from AI service");
      }
    } catch (error) {
      console.error("Error sending message:", error);
      setError(
        error instanceof Error ? error.message : "Failed to send message"
      );

      // Add error message
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        type: "system",
        content:
          "I'm having trouble connecting right now. Please check your internet connection and try again, or contact your manager for assistance.",
        timestamp: new Date(),
        classification: {
          safety: "caution",
          confidence: 1.0,
        },
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const transformSupabaseMessage = (dbMessage: any): ChatMessage => {
    return {
      id: dbMessage.id,
      type: dbMessage.message_type,
      content: dbMessage.content,
      timestamp: new Date(dbMessage.created_at),
      responseType: dbMessage.response_type,
      classification: dbMessage.classification
        ? {
            safety: dbMessage.classification.safety,
            confidence: dbMessage.classification.confidence,
            costGBP: dbMessage.classification.cost_gbp,
            tokens: dbMessage.classification.tokens,
            model: dbMessage.classification.model,
          }
        : undefined,
      equipmentContext: dbMessage.equipment_context,
    };
  };

  const handleBackNavigation = () => {
    if (equipment) {
      router.push(`/equipment/${equipment.id}`);
    } else {
      router.push("/equipment");
    }
  };

  if (!equipment) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-400 mx-auto mb-4" />
          <p className="text-white">Loading equipment context...</p>
        </div>
      </div>
    );
  }

  const progress = getProgress();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 flex flex-col">
      {/* Chat Header */}
      <ChatHeader
        equipment={equipment}
        selectedIssue={selectedIssue}
        onBack={handleBackNavigation}
      />

      {/* Progress Indicator (when interactive flow is active) */}
      {showInteractiveFlow && flowState.isFlowActive && (
        <div className="px-4 py-3 border-b border-slate-600/30">
          <ProgressIndicator
            steps={flowState.steps}
            currentStepIndex={flowState.currentStepIndex}
            variant="compact"
            showStepDetails={false}
          />
        </div>
      )}

      {/* Messages Area */}
      <div className="flex-1 overflow-hidden flex flex-col">
        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
          {messages.map((message) =>
            message.isInteractive ? (
              <InteractiveMessage
                key={message.id}
                message={message}
                interactiveStep={message.interactiveStep}
                onResponse={handleInteractiveResponse}
                showProgressIndicator={true}
                currentStep={flowState.currentStepIndex + 1}
                totalSteps={flowState.steps.length}
              />
            ) : (
              <MessageBubble key={message.id} message={message} />
            )
          )}

          {/* Typing Indicator */}
          {isTyping && (
            <div className="flex justify-start">
              <div className="max-w-xs lg:max-w-md px-4 py-2 rounded-2xl bg-slate-700/50 border border-slate-600">
                <div className="flex items-center space-x-2">
                  <div className="flex space-x-1">
                    <div
                      className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"
                      style={{ animationDelay: "0ms" }}
                    ></div>
                    <div
                      className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"
                      style={{ animationDelay: "150ms" }}
                    ></div>
                    <div
                      className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"
                      style={{ animationDelay: "300ms" }}
                    ></div>
                  </div>
                  <span className="text-sm text-slate-300">
                    Analyzing your issue...
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4 mx-4">
              <p className="text-red-200 text-sm">{error}</p>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Chat Input - only show when not in active interactive flow or when escalated to AI */}
        <ChatInput
          onSendMessage={sendMessage}
          disabled={
            isTyping || isLoading || (flowState.isFlowActive && !isTyping)
          }
          equipment={equipment}
        />
      </div>
    </div>
  );
};

// Main component wrapped with ConversationFlowProvider
const ChatInterface: React.FC = () => {
  return (
    <ConversationFlowProvider>
      <ChatInterfaceInner />
    </ConversationFlowProvider>
  );
};

export default ChatInterface;
