import React from 'react';
import { CheckCircle, AlertTriangle, XCircle, Clock, Wrench, Shield } from 'lucide-react';
import { ChatMessage } from '../../pages/ChatInterface';
import ResponseButtons from './ResponseButtons';

// Define local InteractiveStep interface to match what we're actually using
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
    safetyNote?: string; // FIXED: Now properly defined
  } | string;
  responseOptions?: Array<{
    id: string;
    label: string;
    value: string;
    nextStepId?: string;
    action?: 'continue' | 'escalate' | 'complete';
    style?: 'primary' | 'secondary' | 'danger';
    type?: 'primary' | 'secondary' | 'danger';
  }>;
  progressPercentage: number;
  estimatedTime?: string;
  safetyLevel?: 'safe' | 'caution' | 'danger';
}

export interface InteractiveMessageProps {
  message: ChatMessage;
  interactiveStep?: InteractiveStep;
  onResponse?: (stepId: string, response: string, nextStepId?: string) => void;
  showProgressIndicator?: boolean;
  currentStep?: number;
  totalSteps?: number;
}

const InteractiveMessage: React.FC<InteractiveMessageProps> = ({
  message,
  interactiveStep,
  onResponse,
  showProgressIndicator,
  currentStep,
  totalSteps
}) => {
  const getSafetyIcon = (safetyLevel: string) => {
    switch (safetyLevel) {
      case 'safe':
        return <CheckCircle className="h-4 w-4 text-green-400" />;
      case 'caution':
        return <AlertTriangle className="h-4 w-4 text-yellow-400" />;
      case 'danger':
        return <XCircle className="h-4 w-4 text-red-400" />;
      default:
        return <Shield className="h-4 w-4 text-blue-400" />;
    }
  };

  const getStepIcon = (type: string) => {
    switch (type) {
      case 'safety_check':
        return <Shield className="h-5 w-5 text-red-400" />;
      case 'visual_inspection':
        return <CheckCircle className="h-5 w-5 text-blue-400" />;
      case 'operational_test':
        return <Wrench className="h-5 w-5 text-yellow-400" />;
      case 'diagnostic':
        return <Clock className="h-5 w-5 text-purple-400" />;
      case 'resolution':
        return <CheckCircle className="h-5 w-5 text-green-400" />;
      default:
        return <Wrench className="h-5 w-5 text-blue-400" />;
    }
  };

  const getSafetyBadgeClass = (safetyLevel: string) => {
    switch (safetyLevel) {
      case 'safe':
        return 'bg-green-500/20 text-green-300 border-green-500/30';
      case 'caution':
        return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
      case 'danger':
        return 'bg-red-500/20 text-red-300 border-red-500/30';
      default:
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
    }
  };

  const handleButtonResponse = (response: string) => {
    if (!interactiveStep || !onResponse) return;
    
    const selectedOption = interactiveStep.responseOptions?.find(option => option.value === response);
    const nextStepId = selectedOption?.nextStepId;
    
    onResponse(interactiveStep.id, response, nextStepId);
  };

  // If no interactive step, render as regular message
  if (!interactiveStep) {
    return (
      <div className="flex justify-start">
        <div className="max-w-3xl">
          <div className="bg-slate-700/50 backdrop-blur-sm border border-slate-600/50 rounded-2xl p-4 shadow-lg">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-1">
                {message.classification?.safety && getSafetyIcon(message.classification.safety)}
              </div>
              <div className="flex-1">
                <div className="text-slate-200 text-sm leading-relaxed whitespace-pre-wrap">
                  {message.content}
                </div>
                
                {/* Response Classification */}
                {message.responseType && (
                  <div className="mt-3 flex items-center gap-2 text-xs">
                    <span className="text-slate-400">
                      {message.responseType === 'pattern' && '⚡ Instant Solution'}
                      {message.responseType === 'ai' && '🤖 Expert Analysis'}
                      {message.responseType === 'safety' && '🛡️ Safety Alert'}
                      {message.responseType === 'cache' && '📋 Cached Response'}
                    </span>
                    {message.classification?.costGBP !== undefined && (
                      <span className="text-slate-500">
                        {message.classification.costGBP === 0 ? 'Free' : `£${message.classification.costGBP.toFixed(4)}`}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-start">
      <div className="max-w-4xl w-full">
        <div className="bg-slate-700/50 backdrop-blur-sm border border-slate-600/50 rounded-2xl shadow-lg overflow-hidden">
          
          {/* Step Header */}
          <div className="bg-slate-800/50 border-b border-slate-600/30 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {getStepIcon(interactiveStep.type)}
                <div>
                  <h3 className="text-white font-medium text-lg">{interactiveStep.title}</h3>
                  <p className="text-slate-400 text-sm capitalize">{interactiveStep.type.replace('_', ' ')}</p>
                </div>
              </div>
              
              {/* Safety Badge */}
              {interactiveStep.safetyLevel && (
                <div className={`flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-medium ${getSafetyBadgeClass(interactiveStep.safetyLevel)}`}>
                  {getSafetyIcon(interactiveStep.safetyLevel)}
                  <span className="capitalize">{interactiveStep.safetyLevel}</span>
                </div>
              )}
            </div>
            
            {/* Progress Indicator */}
            {showProgressIndicator && currentStep && totalSteps && (
              <div className="mt-3">
                <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                  <span>Step {currentStep} of {totalSteps}</span>
                  <span>{Math.round((currentStep / totalSteps) * 100)}% Complete</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${(currentStep / totalSteps) * 100}%` }}
                  />
                </div>
              </div>
            )}
          </div>
          
          {/* Step Content */}
          <div className="p-4">
            {/* Main instruction */}
            <div className="text-slate-200 text-sm leading-relaxed mb-4">
              {typeof interactiveStep.content === 'string' 
                ? interactiveStep.content 
                : interactiveStep.content.instruction
              }
            </div>
            
            {/* Instructions/Details */}
            {interactiveStep.content && typeof interactiveStep.content === 'object' && interactiveStep.content.details && interactiveStep.content.details.length > 0 && (
              <div className="mb-4">
                <h4 className="text-white font-medium text-sm mb-2 flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-400" />
                  Instructions
                </h4>
                <ol className="list-decimal list-inside space-y-1 text-slate-300 text-sm ml-6">
                  {interactiveStep.content.details.map((detail: string, index: number) => (
                    <li key={index}>{detail}</li>
                  ))}
                </ol>
              </div>
            )}
            
            {/* Warnings */}
            {interactiveStep.content && typeof interactiveStep.content === 'object' && interactiveStep.content.warnings && interactiveStep.content.warnings.length > 0 && (
              <div className="mb-4">
                <h4 className="text-yellow-300 font-medium text-sm mb-2 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-400" />
                  Important Warnings
                </h4>
                <ul className="list-disc list-inside space-y-1 text-yellow-200 text-sm ml-6">
                  {interactiveStep.content.warnings.map((warning: string, index: number) => (
                    <li key={index}>{warning}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {/* Safety Note - FIXED: Now properly typed */}
            {interactiveStep.content && typeof interactiveStep.content === 'object' && interactiveStep.content.safetyNote && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                <h4 className="text-red-300 font-medium text-sm mb-1 flex items-center gap-2">
                  <Shield className="h-4 w-4 text-red-400" />
                  Safety Note
                </h4>
                <p className="text-red-200 text-sm">{interactiveStep.content.safetyNote}</p>
              </div>
            )}
            
            {/* Response Buttons */}
            {interactiveStep.responseOptions && interactiveStep.responseOptions.length > 0 && (
              <div className="mt-6 space-y-2">
                {interactiveStep.responseOptions.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => handleButtonResponse(option.value)}
                    className={`
                      w-full text-left px-4 py-3 rounded-lg border transition-all duration-200 text-sm font-medium
                      ${(option.style === 'primary' || option.type === 'primary')
                        ? 'bg-blue-600/20 border-blue-500/50 text-blue-200 hover:bg-blue-600/30 hover:border-blue-400' 
                        : (option.style === 'danger' || option.type === 'danger')
                        ? 'bg-red-600/20 border-red-500/50 text-red-200 hover:bg-red-600/30 hover:border-red-400'
                        : 'bg-slate-600/20 border-slate-500/50 text-slate-200 hover:bg-slate-600/30 hover:border-slate-400'
                      }
                    `}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
            
            {/* Equipment Specific Badge */}
            {message.equipmentContext && (
              <div className="mt-4 flex items-center gap-2 text-xs text-slate-400">
                <Wrench className="h-4 w-4" />
                <span>Equipment-specific guidance for {message.equipmentContext.model}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InteractiveMessage;