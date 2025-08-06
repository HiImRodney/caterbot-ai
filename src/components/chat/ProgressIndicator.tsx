import React from 'react';
import { CheckCircle, Clock, AlertTriangle, Shield, Wrench, Target } from 'lucide-react';
import type { ProgressStep } from '../../types/chat';

// Re-export the type for backwards compatibility
export type { ProgressStep } from '../../types/chat';

export interface ProgressIndicatorProps {
  steps: ProgressStep[];
  currentStepIndex: number;
  totalTimeEstimate?: string;
  showStepDetails?: boolean;
  variant?: 'compact' | 'detailed' | 'minimal';
  className?: string;
}

const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
  steps,
  currentStepIndex,
  totalTimeEstimate,
  showStepDetails = true,
  variant = 'detailed',
  className = ''
}) => {
  const getStepIcon = (type: string, status: string) => {
    const iconProps = { className: "h-4 w-4" };
    
    if (status === 'completed') {
      return <CheckCircle {...iconProps} className="h-4 w-4 text-green-400" />;
    }
    
    switch (type) {
      case 'safety_check':
        return <Shield {...iconProps} className="h-4 w-4 text-red-400" />;
      case 'visual_inspection':
        return <CheckCircle {...iconProps} className="h-4 w-4 text-blue-400" />;
      case 'operational_test':
        return <Wrench {...iconProps} className="h-4 w-4 text-yellow-400" />;
      case 'diagnostic':
        return <Clock {...iconProps} className="h-4 w-4 text-purple-400" />;
      case 'resolution':
        return <Target {...iconProps} className="h-4 w-4 text-green-400" />;
      default:
        return <Clock {...iconProps} className="h-4 w-4 text-slate-400" />;
    }
  };

  const getStepStatusColor = (status: string, safetyLevel?: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-400 border-green-400 bg-green-400/10';
      case 'current':
        if (safetyLevel === 'danger') return 'text-red-400 border-red-400 bg-red-400/10';
        if (safetyLevel === 'caution') return 'text-yellow-400 border-yellow-400 bg-yellow-400/10';
        return 'text-blue-400 border-blue-400 bg-blue-400/10';
      case 'skipped':
        return 'text-slate-500 border-slate-600 bg-slate-700/30';
      default:
        return 'text-slate-400 border-slate-600 bg-slate-800/30';
    }
  };

  const getProgressPercentage = () => {
    const completedSteps = steps.filter(step => step.status === 'completed').length;
    return Math.round((completedSteps / steps.length) * 100);
  };

  const getEstimatedTimeRemaining = () => {
    const remainingSteps = steps.slice(currentStepIndex);
    const totalMinutes = remainingSteps.reduce((total, step) => {
      if (step.timeEstimate) {
        const match = step.timeEstimate.match(/(\d+)/);
        return total + (match ? parseInt(match[1]) : 2);
      }
      return total + 2; // Default 2 minutes per step
    }, 0);
    
    if (totalMinutes < 1) return 'Almost done';
    if (totalMinutes === 1) return '~1 minute remaining';
    return `~${totalMinutes} minutes remaining`;
  };

  // Minimal variant - just progress bar
  if (variant === 'minimal') {
    return (
      <div className={`${className}`}>
        <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
          <span>Step {currentStepIndex + 1} of {steps.length}</span>
          <span>{getProgressPercentage()}% Complete</span>
        </div>
        <div className="w-full bg-slate-800 rounded-full h-2">
          <div 
            className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all duration-500"
            style={{ width: `${getProgressPercentage()}%` }}
          />
        </div>
      </div>
    );
  }

  // Compact variant - progress bar with current step
  if (variant === 'compact') {
    const currentStep = steps[currentStepIndex];
    return (
      <div className={`bg-slate-800/30 rounded-lg p-3 ${className}`}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            {currentStep && getStepIcon(currentStep.type, currentStep.status)}
            <span className="text-sm font-medium text-white">
              {currentStep?.title || 'Troubleshooting...'}
            </span>
          </div>
          <div className="text-xs text-slate-400">
            {currentStepIndex + 1}/{steps.length}
          </div>
        </div>
        
        <div className="w-full bg-slate-700 rounded-full h-2">
          <div 
            className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all duration-500"
            style={{ width: `${getProgressPercentage()}%` }}
          />
        </div>
        
        {totalTimeEstimate && (
          <div className="text-xs text-slate-500 mt-2 text-center">
            {getEstimatedTimeRemaining()}
          </div>
        )}
      </div>
    );
  }

  // Detailed variant - full step breakdown
  return (
    <div className={`bg-slate-800/30 rounded-lg p-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-white font-medium text-sm">Troubleshooting Progress</h3>
          <p className="text-slate-400 text-xs">Step {currentStepIndex + 1} of {steps.length}</p>
        </div>
        <div className="text-right">
          <div className="text-white font-medium text-sm">{getProgressPercentage()}%</div>
          <div className="text-slate-400 text-xs">Complete</div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-700 rounded-full h-3 mb-4">
        <div 
          className="bg-gradient-to-r from-blue-500 to-green-500 h-3 rounded-full transition-all duration-500 relative"
          style={{ width: `${getProgressPercentage()}%` }}
        >
          {/* Pulse effect for current progress */}
          <div className="absolute right-0 top-0 h-full w-2 bg-white/30 rounded-full animate-pulse" />
        </div>
      </div>

      {/* Step Details */}
      {showStepDetails && (
        <div className="space-y-2">
          {steps.map((step, index) => (
            <div 
              key={step.id}
              className={`flex items-center gap-3 p-2 rounded-lg border transition-all duration-200 ${getStepStatusColor(step.status, step.safetyLevel)}`}
            >
              <div className="flex-shrink-0">
                {getStepIcon(step.type, step.status)}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium truncate">
                    {step.title}
                  </span>
                  {step.timeEstimate && step.status !== 'completed' && (
                    <span className="text-xs opacity-75 flex-shrink-0 ml-2">
                      {step.timeEstimate}
                    </span>
                  )}
                </div>
                
                {step.status === 'current' && (
                  <div className="text-xs opacity-75 mt-1">
                    Currently in progress...
                  </div>
                )}
                
                {step.status === 'completed' && (
                  <div className="text-xs text-green-300 mt-1">
                    ✓ Completed
                  </div>
                )}
                
                {step.status === 'skipped' && (
                  <div className="text-xs text-slate-500 mt-1">
                    Skipped
                  </div>
                )}
              </div>
              
              {/* Safety indicator */}
              {step.safetyLevel === 'danger' && (
                <AlertTriangle className="h-4 w-4 text-red-400 flex-shrink-0" />
              )}
              {step.safetyLevel === 'caution' && (
                <AlertTriangle className="h-4 w-4 text-yellow-400 flex-shrink-0" />
              )}
            </div>
          ))}
        </div>
      )}

      {/* Time Estimate */}
      {totalTimeEstimate && (
        <div className="mt-4 p-3 bg-slate-700/30 rounded-lg">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-300">Time Remaining:</span>
            <span className="text-white font-medium">{getEstimatedTimeRemaining()}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProgressIndicator;