import React, { useState, useRef } from 'react';
import { Send, Mic, Camera, AlertTriangle } from 'lucide-react';
import { Equipment } from '../../contexts/EquipmentContext';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  disabled?: boolean;
  equipment: Equipment;
}

const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, disabled = false, equipment }) => {
  const [input, setInput] = useState('');
  const [safetyWarning, setSafetyWarning] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // Safety keywords that trigger immediate warnings
  const safetyKeywords = {
    gas: ['gas', 'smell', 'pilot', 'burner', 'flame', 'leak'],
    electrical: ['spark', 'shock', 'electrical', 'power', 'trip', 'breaker', 'wire'],
    emergency: ['fire', 'smoke', 'burning', 'hot', 'emergency', 'help']
  };
  
  const checkSafetyKeywords = (message: string) => {
    const lowerMessage = message.toLowerCase();
    
    // Check for gas safety issues
    if (safetyKeywords.gas.some(keyword => lowerMessage.includes(keyword))) {
      return {
        type: 'gas',
        message: '🚨 Gas Safety Alert: If you smell gas or suspect a gas leak, immediately turn off the equipment, evacuate the area, and contact a Gas Safe registered engineer. Do not attempt any repairs.'
      };
    }
    
    // Check for electrical safety issues
    if (safetyKeywords.electrical.some(keyword => lowerMessage.includes(keyword))) {
      return {
        type: 'electrical',
        message: '⚡ Electrical Safety Alert: If you see sparks or suspect electrical issues, immediately turn off the equipment at the breaker and contact a qualified electrician. Do not touch any electrical components.'
      };
    }
    
    // Check for emergency situations
    if (safetyKeywords.emergency.some(keyword => lowerMessage.includes(keyword))) {
      return {
        type: 'emergency',
        message: '🔥 Emergency Alert: If there is fire, smoke, or immediate danger, evacuate immediately and call emergency services (999). Safety is the top priority.'
      };
    }
    
    return null;
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setInput(value);
    
    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
    
    // Check for safety keywords
    const safetyAlert = checkSafetyKeywords(value);
    setSafetyWarning(safetyAlert ? safetyAlert.message : null);
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!input.trim() || disabled) return;
    
    // If there's a safety warning, require confirmation
    if (safetyWarning) {
      const confirmed = window.confirm(
        'Safety Warning Detected!\n\n' +
        safetyWarning +
        '\n\nAre you sure you want to continue with troubleshooting? For safety issues, we recommend contacting a professional immediately.'
      );
      
      if (!confirmed) {
        return;
      }
    }
    
    onSendMessage(input.trim());
    setInput('');
    setSafetyWarning(null);
    
    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };
  
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };
  
  return (
    <div className="border-t border-slate-700 bg-slate-800/50 backdrop-blur-sm">
      {/* Safety Warning Banner */}
      {safetyWarning && (
        <div className="bg-red-500/20 border-t border-red-500/30 px-4 py-3">
          <div className="flex items-start space-x-2">
            <AlertTriangle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-red-200 text-sm font-medium">
              {safetyWarning}
            </p>
          </div>
        </div>
      )}
      
      {/* Input Area */}
      <div className="p-4">
        <form onSubmit={handleSubmit} className="flex items-end space-x-3">
          {/* Text Input */}
          <div className="flex-1">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              placeholder={`Ask about your ${equipment.display_name}...`}
              disabled={disabled}
              rows={1}
              className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-4 py-3 text-white placeholder-slate-400 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ minHeight: '48px', maxHeight: '120px' }}
            />
          </div>
          
          {/* Action Buttons */}
          <div className="flex items-center space-x-2">
            {/* Voice Input (Future Feature) */}
            <button
              type="button"
              disabled
              className="p-3 rounded-xl bg-slate-700/50 border border-slate-600 text-slate-400 hover:text-slate-300 hover:bg-slate-700 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              title="Voice input (coming soon)"
            >
              <Mic className="h-5 w-5" />
            </button>
            
            {/* Photo Upload (Future Feature) */}
            <button
              type="button"
              disabled
              className="p-3 rounded-xl bg-slate-700/50 border border-slate-600 text-slate-400 hover:text-slate-300 hover:bg-slate-700 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              title="Photo upload (coming soon)"
            >
              <Camera className="h-5 w-5" />
            </button>
            
            {/* Send Button */}
            <button
              type="submit"
              disabled={disabled || !input.trim()}
              className={`p-3 rounded-xl transition-colors ${
                disabled || !input.trim()
                  ? 'bg-slate-700/50 border border-slate-600 text-slate-500 cursor-not-allowed'
                  : safetyWarning
                  ? 'bg-red-600 hover:bg-red-700 border border-red-500 text-white'
                  : 'bg-blue-600 hover:bg-blue-700 border border-blue-500 text-white'
              }`}
              title={safetyWarning ? 'Send with safety warning' : 'Send message'}
            >
              <Send className="h-5 w-5" />
            </button>
          </div>
        </form>
        
        {/* Quick Actions */}
        <div className="flex flex-wrap gap-2 mt-3">
          <button
            onClick={() => setInput('What should I check first?')}
            disabled={disabled}
            className="px-3 py-1.5 text-xs bg-slate-700/30 border border-slate-600/50 rounded-lg text-slate-300 hover:bg-slate-700/50 transition-colors disabled:opacity-50"
          >
            🔍 Where to start
          </button>
          
          <button
            onClick={() => setInput('Is this a safety issue?')}
            disabled={disabled}
            className="px-3 py-1.5 text-xs bg-slate-700/30 border border-slate-600/50 rounded-lg text-slate-300 hover:bg-slate-700/50 transition-colors disabled:opacity-50"
          >
            🛡️ Safety check
          </button>
          
          <button
            onClick={() => setInput('What tools do I need?')}
            disabled={disabled}
            className="px-3 py-1.5 text-xs bg-slate-700/30 border border-slate-600/50 rounded-lg text-slate-300 hover:bg-slate-700/50 transition-colors disabled:opacity-50"
          >
            🔧 Tools needed
          </button>
          
          <button
            onClick={() => setInput('I need help from a manager')}
            disabled={disabled}
            className="px-3 py-1.5 text-xs bg-slate-700/30 border border-slate-600/50 rounded-lg text-slate-300 hover:bg-slate-700/50 transition-colors disabled:opacity-50"
          >
            🆘 Get help
          </button>
        </div>
        
        {/* Footer */}
        <div className="text-center mt-3">
          <p className="text-xs text-slate-500">
            🛡️ Safety First • 💰 Cost Optimized • ⚡ AI-Powered by Kitchen Wizard
          </p>
        </div>
      </div>
    </div>
  );
};

export default ChatInput;