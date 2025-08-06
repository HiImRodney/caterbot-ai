import React, { useState } from 'react';
import { Copy, Check, Shield, Zap, Bot, AlertTriangle, CheckCircle } from 'lucide-react';
import { ChatMessage } from '../../pages/ChatInterface';

interface MessageBubbleProps {
  message: ChatMessage;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const [copied, setCopied] = useState(false);
  
  const isUser = message.type === 'user';
  const isSystem = message.type === 'system';
  
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy message:', error);
    }
  };
  
  const getResponseTypeIcon = (responseType?: string) => {
    switch (responseType) {
      case 'pattern':
      case 'cache':
        return <Zap className="h-3 w-3 text-green-400" />;
      case 'ai':
        return <Bot className="h-3 w-3 text-blue-400" />;
      case 'safety':
        return <Shield className="h-3 w-3 text-red-400" />;
      default:
        return null;
    }
  };
  
  const getResponseTypeLabel = (responseType?: string) => {
    switch (responseType) {
      case 'pattern':
        return 'Instant Solution';
      case 'cache':
        return 'Quick Answer';
      case 'ai':
        return 'Expert Analysis';
      case 'safety':
        return 'Safety Alert';
      default:
        return null;
    }
  };
  
  const getSafetyIcon = (safety?: string) => {
    switch (safety) {
      case 'safe':
        return <CheckCircle className="h-3 w-3 text-green-400" />;
      case 'caution':
        return <AlertTriangle className="h-3 w-3 text-yellow-400" />;
      case 'danger':
        return <AlertTriangle className="h-3 w-3 text-red-400" />;
      default:
        return null;
    }
  };
  
  const formatTimestamp = (timestamp: Date) => {
    return timestamp.toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  if (isSystem) {
    return (
      <div className="flex justify-center mb-4">
        <div className="bg-slate-700/30 border border-slate-600/50 rounded-lg px-4 py-2 max-w-md">
          <p className="text-slate-300 text-sm text-center">
            {message.content}
          </p>
          <p className="text-slate-500 text-xs text-center mt-1">
            {formatTimestamp(message.timestamp)}
          </p>
        </div>
      </div>
    );
  }
  
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`max-w-xs lg:max-w-md ${isUser ? 'order-2' : 'order-1'}`}>
        {/* Message Bubble */}
        <div
          className={`px-4 py-3 rounded-2xl ${
            isUser
              ? 'bg-blue-600 text-white'
              : 'bg-slate-700/50 text-slate-100 border border-slate-600/50'
          }`}
        >
          {/* Response Classification (AI messages only) */}
          {!isUser && (message.responseType || message.classification?.safety) && (
            <div className="flex items-center space-x-2 mb-2 pb-2 border-b border-slate-600/30">
              {message.responseType && (
                <div className="flex items-center space-x-1">
                  {getResponseTypeIcon(message.responseType)}
                  <span className="text-xs font-medium text-slate-300">
                    {getResponseTypeLabel(message.responseType)}
                  </span>
                </div>
              )}
              
              {message.classification?.safety && (
                <div className="flex items-center space-x-1">
                  {getSafetyIcon(message.classification.safety)}
                  <span className="text-xs text-slate-400 capitalize">
                    {message.classification.safety}
                  </span>
                </div>
              )}
            </div>
          )}
          
          {/* Message Content */}
          <div className="prose prose-sm prose-invert max-w-none">
            <p className="text-sm leading-relaxed whitespace-pre-wrap">
              {message.content}
            </p>
          </div>
          
          {/* Message Actions */}
          {!isUser && (
            <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-600/30">
              <span className="text-xs text-slate-400">
                {formatTimestamp(message.timestamp)}
              </span>
              
              <button
                onClick={copyToClipboard}
                className="p-1 rounded hover:bg-slate-600/50 transition-colors"
                title="Copy message"
              >
                {copied ? (
                  <Check className="h-3 w-3 text-green-400" />
                ) : (
                  <Copy className="h-3 w-3 text-slate-400" />
                )}
              </button>
            </div>
          )}
        </div>
        
        {/* User Message Timestamp */}
        {isUser && (
          <p className="text-xs text-slate-400 text-right mt-1 mr-2">
            {formatTimestamp(message.timestamp)}
          </p>
        )}
        
        {/* Equipment Context (for debugging - hidden in production) */}
        {process.env.NODE_ENV === 'development' && message.equipmentContext && (
          <div className="text-xs text-slate-500 mt-1 px-2">
            🔧 {message.equipmentContext.model}
            {message.equipmentContext.issueType && (
              <span> • {message.equipmentContext.issueType}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MessageBubble;