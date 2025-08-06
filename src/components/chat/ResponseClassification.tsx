import React from 'react';
import { Zap, Brain, Shield, DollarSign, Clock, CheckCircle, AlertTriangle } from 'lucide-react';

interface ResponseClassificationData {
  type: 'pattern_match' | 'ai_response' | 'cache_hit' | 'safety_escalation' | 'human_escalation';
  confidence: number;
  safety_level: 'safe' | 'caution' | 'danger';
  processing_time_ms: number;
  cost_gbp: number;
  tokens_used?: number;
  model_used?: string;
  pattern_matched?: string;
  escalation_reason?: string;
  quality_indicators: {
    accuracy_score: number;
    completeness_score: number;
    safety_verified: boolean;
    professional_review_needed: boolean;
  };
}

interface ResponseClassificationProps {
  classification: ResponseClassificationData;
  showDetails?: boolean;
  className?: string;
}

const ResponseClassification: React.FC<ResponseClassificationProps> = ({
  classification,
  showDetails = false,
  className = '',
}) => {
  const getTypeConfig = (type: string) => {
    switch (type) {
      case 'pattern_match':
        return {
          icon: <Zap className="w-4 h-4" />,
          label: 'Instant Solution',
          description: 'Resolved using proven troubleshooting patterns',
          color: 'text-green-600 bg-green-50 border-green-200',
          priority: 'Immediate response - Pattern matched',
        };
      case 'ai_response':
        return {
          icon: <Brain className="w-4 h-4" />,
          label: 'Expert Analysis',
          description: 'AI-powered analysis tailored to your equipment',
          color: 'text-blue-600 bg-blue-50 border-blue-200',
          priority: 'Intelligent analysis - Custom solution',
        };
      case 'cache_hit':
        return {
          icon: <Clock className="w-4 h-4" />,
          label: 'Proven Solution',
          description: 'Previously verified solution with high success rate',
          color: 'text-purple-600 bg-purple-50 border-purple-200',
          priority: 'Tested solution - Fast delivery',
        };
      case 'safety_escalation':
        return {
          icon: <Shield className="w-4 h-4" />,
          label: 'Safety Alert',
          description: 'Critical safety issue requiring immediate professional attention',
          color: 'text-red-600 bg-red-50 border-red-200',
          priority: 'Safety critical - Professional required',
        };
      case 'human_escalation':
        return {
          icon: <AlertTriangle className="w-4 h-4" />,
          label: 'Expert Required',
          description: 'Complex issue requiring human specialist review',
          color: 'text-orange-600 bg-orange-50 border-orange-200',
          priority: 'Specialist review - Enhanced support',
        };
      default:
        return {
          icon: <CheckCircle className="w-4 h-4" />,
          label: 'Response',
          description: 'Standard response',
          color: 'text-gray-600 bg-gray-50 border-gray-200',
          priority: 'Standard processing',
        };
    }
  };

  const getSafetyConfig = (safety: string) => {
    switch (safety) {
      case 'safe':
        return {
          icon: '🟢',
          label: 'Safe',
          description: 'No safety concerns identified',
          color: 'text-green-700 bg-green-100',
        };
      case 'caution':
        return {
          icon: '🟡',
          label: 'Caution',
          description: 'Exercise caution when following instructions',
          color: 'text-yellow-700 bg-yellow-100',
        };
      case 'danger':
        return {
          icon: '🔴',
          label: 'Danger',
          description: 'Critical safety risk - professional required',
          color: 'text-red-700 bg-red-100',
        };
      default:
        return {
          icon: '⚪',
          label: 'Unknown',
          description: 'Safety level not determined',
          color: 'text-gray-700 bg-gray-100',
        };
    }
  };

  const formatCost = (cost: number) => {
    if (cost === 0) return 'Free';
    return `£${cost.toFixed(4)}`;
  };

  const formatProcessingTime = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.9) return 'text-green-600';
    if (confidence >= 0.7) return 'text-blue-600';
    if (confidence >= 0.5) return 'text-yellow-600';
    return 'text-red-600';
  };

  const typeConfig = getTypeConfig(classification.type);
  const safetyConfig = getSafetyConfig(classification.safety_level);

  // Compact badge view
  if (!showDetails) {
    return (
      <div className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full border text-sm font-medium ${typeConfig.color} ${className}`}>
        {typeConfig.icon}
        <span>{typeConfig.label}</span>
        {classification.safety_level === 'danger' && (
          <span className="text-red-600">{safetyConfig.icon}</span>
        )}
      </div>
    );
  }

  // Detailed classification view
  return (
    <div className={`bg-white border border-gray-200 rounded-lg p-4 space-y-4 ${className}`}>
      {/* Response Type */}
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-3">
          <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg border ${typeConfig.color}`}>
            {typeConfig.icon}
            <span className="font-medium">{typeConfig.label}</span>
          </div>
          <div className={`flex items-center space-x-2 px-2 py-1 rounded ${safetyConfig.color}`}>
            <span>{safetyConfig.icon}</span>
            <span className="text-sm font-medium">{safetyConfig.label}</span>
          </div>
        </div>
        
        {/* Cost indicator (hidden from customers) */}
        <div className="text-right">
          <div className="text-sm text-gray-500">Cost</div>
          <div className={`text-sm font-medium ${classification.cost_gbp === 0 ? 'text-green-600' : 'text-blue-600'}`}>
            {formatCost(classification.cost_gbp)}
          </div>
        </div>
      </div>

      {/* Description and Priority */}
      <div className="space-y-2">
        <p className="text-gray-700">{typeConfig.description}</p>
        <p className="text-sm text-gray-600 italic">{typeConfig.priority}</p>
      </div>

      {/* Safety Information */}
      {classification.safety_level !== 'safe' && (
        <div className={`p-3 rounded-lg ${safetyConfig.color}`}>
          <div className="flex items-center space-x-2 mb-1">
            <Shield className="w-4 h-4" />
            <span className="font-medium">Safety Notice</span>
          </div>
          <p className="text-sm">{safetyConfig.description}</p>
        </div>
      )}

      {/* Quality Metrics */}
      <div className="bg-gray-50 rounded-lg p-3">
        <h4 className="font-medium text-gray-900 mb-3">Response Quality Metrics</h4>
        <div className="grid grid-cols-2 gap-4">
          {/* Confidence Score */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm text-gray-600">Confidence</span>
              <span className={`text-sm font-medium ${getConfidenceColor(classification.confidence)}`}>
                {Math.round(classification.confidence * 100)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full ${
                  classification.confidence >= 0.9 ? 'bg-green-500' :
                  classification.confidence >= 0.7 ? 'bg-blue-500' :
                  classification.confidence >= 0.5 ? 'bg-yellow-500' :
                  'bg-red-500'
                }`}
                style={{ width: `${classification.confidence * 100}%` }}
              />
            </div>
          </div>

          {/* Processing Time */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm text-gray-600">Response Time</span>
              <span className="text-sm font-medium text-gray-900">
                {formatProcessingTime(classification.processing_time_ms)}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full ${
                  classification.processing_time_ms < 1000 ? 'bg-green-500' :
                  classification.processing_time_ms < 3000 ? 'bg-yellow-500' :
                  'bg-red-500'
                }`}
                style={{ 
                  width: `${Math.min(100, (5000 - classification.processing_time_ms) / 5000 * 100)}%` 
                }}
              />
            </div>
          </div>

          {/* Accuracy Score */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm text-gray-600">Accuracy</span>
              <span className="text-sm font-medium text-gray-900">
                {Math.round(classification.quality_indicators.accuracy_score * 100)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="h-2 rounded-full bg-blue-500"
                style={{ width: `${classification.quality_indicators.accuracy_score * 100}%` }}
              />
            </div>
          </div>

          {/* Completeness Score */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm text-gray-600">Completeness</span>
              <span className="text-sm font-medium text-gray-900">
                {Math.round(classification.quality_indicators.completeness_score * 100)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="h-2 rounded-full bg-purple-500"
                style={{ width: `${classification.quality_indicators.completeness_score * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Quality Indicators */}
        <div className="mt-3 flex flex-wrap gap-2">
          {classification.quality_indicators.safety_verified && (
            <div className="flex items-center space-x-1 text-green-600 text-xs">
              <CheckCircle className="w-3 h-3" />
              <span>Safety Verified</span>
            </div>
          )}
          {classification.quality_indicators.professional_review_needed && (
            <div className="flex items-center space-x-1 text-orange-600 text-xs">
              <AlertTriangle className="w-3 h-3" />
              <span>Professional Review Needed</span>
            </div>
          )}
        </div>
      </div>

      {/* Technical Details */}
      <div className="border-t border-gray-200 pt-3">
        <details className="text-sm">
          <summary className="cursor-pointer text-gray-600 hover:text-gray-800">
            Technical Details
          </summary>
          <div className="mt-2 space-y-2 text-xs text-gray-500">
            {classification.pattern_matched && (
              <div>
                <span className="font-medium">Pattern:</span> {classification.pattern_matched}
              </div>
            )}
            {classification.model_used && (
              <div>
                <span className="font-medium">Model:</span> {classification.model_used}
              </div>
            )}
            {classification.tokens_used && (
              <div>
                <span className="font-medium">Tokens:</span> {classification.tokens_used}
              </div>
            )}
            {classification.escalation_reason && (
              <div>
                <span className="font-medium">Escalation Reason:</span> {classification.escalation_reason}
              </div>
            )}
            <div>
              <span className="font-medium">Processing Time:</span> {formatProcessingTime(classification.processing_time_ms)}
            </div>
            <div>
              <span className="font-medium">Cost:</span> {formatCost(classification.cost_gbp)}
            </div>
          </div>
        </details>
      </div>
    </div>
  );
};

// Helper function to create classification data from API response
export const createResponseClassification = (
  apiResponse: any,
  startTime: number
): ResponseClassificationData => {
  const processingTime = Date.now() - startTime;
  
  // Determine response type from API response
  let type: ResponseClassificationData['type'] = 'ai_response';
  let cost = 0.002; // Default AI cost
  
  if (apiResponse.response_type === 'pattern_match') {
    type = 'pattern_match';
    cost = 0;
  } else if (apiResponse.response_type === 'cache_hit') {
    type = 'cache_hit';
    cost = 0;
  } else if (apiResponse.response_type === 'safety_escalation') {
    type = 'safety_escalation';
    cost = 0;
  } else if (apiResponse.escalation_required) {
    type = 'human_escalation';
  }

  // Determine safety level
  let safety_level: ResponseClassificationData['safety_level'] = 'safe';
  if (apiResponse.safety_critical || type === 'safety_escalation') {
    safety_level = 'danger';
  } else if (apiResponse.escalation_required) {
    safety_level = 'caution';
  }

  return {
    type,
    confidence: apiResponse.confidence_score || 0.8,
    safety_level,
    processing_time_ms: processingTime,
    cost_gbp: apiResponse.cost_gbp || cost,
    tokens_used: apiResponse.tokens_used,
    model_used: apiResponse.model_used || 'claude-3-5-sonnet',
    pattern_matched: apiResponse.pattern_match?.response_key,
    escalation_reason: apiResponse.escalation_reason,
    quality_indicators: {
      accuracy_score: apiResponse.accuracy_score || 0.85,
      completeness_score: apiResponse.completeness_score || 0.9,
      safety_verified: !apiResponse.safety_critical,
      professional_review_needed: apiResponse.escalation_required || false,
    },
  };
};

export default ResponseClassification;