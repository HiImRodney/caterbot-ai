import React, { useState } from 'react';
import { Check, X, HelpCircle, AlertTriangle, Shield, Clock } from 'lucide-react';

export interface ButtonOption {
  primary: string;
  secondary: string;
  tertiary?: string;
}

export interface ResponseButtonsProps {
  options: ButtonOption;
  onResponse: (response: string) => void;
  safetyLevel?: 'safe' | 'caution' | 'danger';
  disabled?: boolean;
  variant?: 'default' | 'safety' | 'diagnostic';
}

const ResponseButtons: React.FC<ResponseButtonsProps> = ({
  options,
  onResponse,
  safetyLevel = 'safe',
  disabled = false,
  variant = 'default'
}) => {
  const [selectedResponse, setSelectedResponse] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleButtonClick = async (response: string) => {
    if (disabled || isSubmitting) return;
    
    setSelectedResponse(response);
    setIsSubmitting(true);
    
    try {
      // Add small delay for visual feedback
      await new Promise(resolve => setTimeout(resolve, 150));
      onResponse(response);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getButtonIcon = (buttonType: 'primary' | 'secondary' | 'tertiary', text: string) => {
    // Default Yes/No/Not Sure pattern
    if (text.toLowerCase().includes('yes') || text.toLowerCase().includes('working') || text.toLowerCase().includes('complete')) {
      return <Check className="h-4 w-4" />;
    }
    if (text.toLowerCase().includes('no') || text.toLowerCase().includes('not working') || text.toLowerCase().includes('failed')) {
      return <X className="h-4 w-4" />;
    }
    if (text.toLowerCase().includes('not sure') || text.toLowerCase().includes('unsure') || text.toLowerCase().includes('help')) {
      return <HelpCircle className="h-4 w-4" />;
    }
    
    // Safety-specific icons
    if (variant === 'safety') {
      if (buttonType === 'primary') return <Shield className="h-4 w-4" />;
      if (buttonType === 'secondary') return <AlertTriangle className="h-4 w-4" />;
    }
    
    // Diagnostic-specific icons
    if (variant === 'diagnostic') {
      if (buttonType === 'primary') return <Check className="h-4 w-4" />;
      if (buttonType === 'secondary') return <Clock className="h-4 w-4" />;
    }
    
    return null;
  };

  const getButtonStyle = (buttonType: 'primary' | 'secondary' | 'tertiary', text: string) => {
    // If this button was selected, show active state
    const isSelected = selectedResponse === text;
    
    if (isSelected) {
      return 'bg-blue-500 text-white border-blue-400 shadow-lg shadow-blue-500/25 transform scale-105';
    }
    
    if (disabled || isSubmitting) {
      return 'bg-slate-800/50 text-slate-500 border-slate-700/50 cursor-not-allowed';
    }
    
    // Base styles for different button types and safety levels
    let baseStyle = '';
    
    if (text.toLowerCase().includes('yes') || text.toLowerCase().includes('working') || text.toLowerCase().includes('complete')) {
      // Positive responses - green theme
      baseStyle = 'bg-green-500/10 text-green-300 border-green-500/30 hover:bg-green-500/20 hover:border-green-400/50 hover:text-green-200';
    } else if (text.toLowerCase().includes('no') || text.toLowerCase().includes('not working') || text.toLowerCase().includes('failed')) {
      // Negative responses - red theme (but not dangerous, just informational)
      baseStyle = 'bg-red-500/10 text-red-300 border-red-500/30 hover:bg-red-500/20 hover:border-red-400/50 hover:text-red-200';
    } else if (text.toLowerCase().includes('not sure') || text.toLowerCase().includes('unsure') || text.toLowerCase().includes('help')) {
      // Uncertain responses - blue theme
      baseStyle = 'bg-blue-500/10 text-blue-300 border-blue-500/30 hover:bg-blue-500/20 hover:border-blue-400/50 hover:text-blue-200';
    } else {
      // Default styling based on safety level
      switch (safetyLevel) {
        case 'danger':
          baseStyle = 'bg-red-500/10 text-red-300 border-red-500/30 hover:bg-red-500/20 hover:border-red-400/50 hover:text-red-200';
          break;
        case 'caution':
          baseStyle = 'bg-yellow-500/10 text-yellow-300 border-yellow-500/30 hover:bg-yellow-500/20 hover:border-yellow-400/50 hover:text-yellow-200';
          break;
        default:
          baseStyle = 'bg-slate-700/50 text-slate-300 border-slate-600/50 hover:bg-slate-600/50 hover:border-slate-500/50 hover:text-white';
      }
    }
    
    return `${baseStyle} transition-all duration-200 hover:transform hover:scale-105 hover:shadow-lg`;
  };

  const getSafetyWarning = () => {
    if (safetyLevel === 'danger') {
      return (
        <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
          <div className="flex items-center gap-2 text-red-300 text-sm">
            <AlertTriangle className="h-4 w-4" />
            <span className="font-medium">Safety Critical: Choose carefully</span>
          </div>
        </div>
      );
    }
    if (safetyLevel === 'caution') {
      return (
        <div className="mb-4 p-3 bg-yellow-500/20 border border-yellow-500/30 rounded-lg">
          <div className="flex items-center gap-2 text-yellow-300 text-sm">
            <AlertTriangle className="h-4 w-4" />
            <span className="font-medium">Caution: Follow instructions carefully</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-3">
      {getSafetyWarning()}
      
      <div className="text-sm text-slate-400 mb-3">
        Choose your response:
      </div>
      
      <div className="grid grid-cols-1 gap-3">
        {/* Primary Button */}
        <button
          onClick={() => handleButtonClick(options.primary)}
          disabled={disabled || isSubmitting}
          className={`flex items-center justify-center gap-3 px-4 py-3 rounded-xl border font-medium text-sm transition-all duration-200 ${getButtonStyle('primary', options.primary)}`}
        >
          {getButtonIcon('primary', options.primary)}
          <span>{options.primary}</span>
          {isSubmitting && selectedResponse === options.primary && (
            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin ml-2" />
          )}
        </button>
        
        {/* Secondary Button */}
        <button
          onClick={() => handleButtonClick(options.secondary)}
          disabled={disabled || isSubmitting}
          className={`flex items-center justify-center gap-3 px-4 py-3 rounded-xl border font-medium text-sm transition-all duration-200 ${getButtonStyle('secondary', options.secondary)}`}
        >
          {getButtonIcon('secondary', options.secondary)}
          <span>{options.secondary}</span>
          {isSubmitting && selectedResponse === options.secondary && (
            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin ml-2" />
          )}
        </button>
        
        {/* Tertiary Button (Optional) */}
        {options.tertiary && (
          <button
            onClick={() => handleButtonClick(options.tertiary!)}
            disabled={disabled || isSubmitting}
            className={`flex items-center justify-center gap-3 px-4 py-3 rounded-xl border font-medium text-sm transition-all duration-200 ${getButtonStyle('tertiary', options.tertiary)}`}
          >
            {getButtonIcon('tertiary', options.tertiary)}
            <span>{options.tertiary}</span>
            {isSubmitting && selectedResponse === options.tertiary && (
              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin ml-2" />
            )}
          </button>
        )}
      </div>
      
      {/* Help Text */}
      <div className="text-xs text-slate-500 mt-3 text-center">
        Your response helps guide the next troubleshooting step
      </div>
    </div>
  );
};

export default ResponseButtons;