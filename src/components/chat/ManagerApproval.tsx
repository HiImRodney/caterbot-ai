import React, { useState, useEffect } from 'react';
import { Clock, User, DollarSign, CheckCircle, XCircle, MessageSquare, AlertTriangle, Phone } from 'lucide-react';

interface ManagerApprovalRequest {
  id: string;
  equipment: {
    id: string;
    name: string;
    location: string;
    model: string;
  };
  issue: {
    description: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    reported_by: string;
    timestamp: Date;
  };
  recommendation: {
    action: 'parts_order' | 'engineer_callout' | 'replacement' | 'maintenance';
    description: string;
    estimated_cost: number;
    estimated_downtime: string;
    urgency: 'immediate' | 'within_day' | 'within_week' | 'scheduled';
  };
  manager: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  status: 'pending' | 'approved' | 'declined' | 'more_info_requested';
  submitted_at: Date;
  responded_at?: Date;
  response_notes?: string;
  follow_up_required?: boolean;
}

interface ManagerApprovalProps {
  request: ManagerApprovalRequest;
  onApprove: (requestId: string, notes?: string) => void;
  onDecline: (requestId: string, reason: string) => void;
  onRequestMoreInfo: (requestId: string, questions: string) => void;
  onClose: () => void;
  isManager: boolean;
  currentUserId: string;
}

const ManagerApproval: React.FC<ManagerApprovalProps> = ({
  request,
  onApprove,
  onDecline,
  onRequestMoreInfo,
  onClose,
  isManager,
  currentUserId,
}) => {
  const [response, setResponse] = useState('');
  const [showDeclineReason, setShowDeclineReason] = useState(false);
  const [showMoreInfoForm, setShowMoreInfoForm] = useState(false);
  const [declineReason, setDeclineReason] = useState('');
  const [moreInfoQuestions, setMoreInfoQuestions] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Real-time status polling for non-managers
  useEffect(() => {
    if (!isManager && request.status === 'pending') {
      const pollInterval = setInterval(async () => {
        // Poll for status updates from our Supabase database
        try {
          // This would integrate with our database-integration Edge Function
          const response = await fetch('/api/approval-status/' + request.id);
          if (response.ok) {
            const data = await response.json();
            if (data.status !== 'pending') {
              // Status has changed, refresh the component
              window.location.reload();
            }
          }
        } catch (error) {
          console.warn('Failed to poll approval status:', error);
        }
      }, 10000); // Poll every 10 seconds

      return () => clearInterval(pollInterval);
    }
  }, [isManager, request.status, request.id]);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'high':
        return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'medium':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      default:
        return 'text-blue-600 bg-blue-50 border-blue-200';
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'immediate':
        return 'text-red-600 bg-red-100';
      case 'within_day':
        return 'text-orange-600 bg-orange-100';
      case 'within_week':
        return 'text-yellow-600 bg-yellow-100';
      default:
        return 'text-green-600 bg-green-100';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
    }).format(amount);
  };

  const handleApprove = async () => {
    setIsSubmitting(true);
    try {
      await onApprove(request.id, response);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDecline = async () => {
    if (!declineReason.trim()) {
      alert('Please provide a reason for declining this request.');
      return;
    }
    setIsSubmitting(true);
    try {
      await onDecline(request.id, declineReason);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRequestMoreInfo = async () => {
    if (!moreInfoQuestions.trim()) {
      alert('Please specify what additional information you need.');
      return;
    }
    setIsSubmitting(true);
    try {
      await onRequestMoreInfo(request.id, moreInfoQuestions);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Manager approval interface
  if (isManager) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-screen overflow-y-auto">
          {/* Header */}
          <div className="bg-blue-600 text-white p-6 rounded-t-lg">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold flex items-center">
                  <CheckCircle className="w-6 h-6 mr-2" />
                  Manager Approval Required
                </h2>
                <p className="text-blue-100 text-sm mt-1">Request ID: {request.id}</p>
              </div>
              <div className="text-right">
                <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getUrgencyColor(request.recommendation.urgency)}`}>
                  {request.recommendation.urgency.replace('_', ' ').toUpperCase()}
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Equipment Information */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                <AlertTriangle className="w-5 h-5 mr-2 text-orange-600" />
                Equipment & Issue Details
              </h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-600">Equipment:</span>
                  <p className="text-gray-900">{request.equipment.name}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Location:</span>
                  <p className="text-gray-900">{request.equipment.location}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Model:</span>
                  <p className="text-gray-900">{request.equipment.model}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Reported by:</span>
                  <p className="text-gray-900">{request.issue.reported_by}</p>
                </div>
              </div>
              <div className="mt-3">
                <span className="font-medium text-gray-600">Issue Description:</span>
                <p className="text-gray-900 mt-1">{request.issue.description}</p>
                <div className={`inline-block mt-2 px-2 py-1 rounded text-xs font-medium border ${getSeverityColor(request.issue.severity)}`}>
                  {request.issue.severity.toUpperCase()} SEVERITY
                </div>
              </div>
            </div>

            {/* Recommended Action */}
            <div className="bg-blue-50 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-3 flex items-center">
                <DollarSign className="w-5 h-5 mr-2" />
                Recommended Action & Cost
              </h3>
              <div className="space-y-3">
                <div>
                  <span className="font-medium text-blue-800">Action:</span>
                  <p className="text-blue-900">{request.recommendation.description}</p>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-blue-800">Estimated Cost:</span>
                    <p className="text-2xl font-bold text-blue-900">
                      {formatCurrency(request.recommendation.estimated_cost)}
                    </p>
                  </div>
                  <div>
                    <span className="font-medium text-blue-800">Estimated Downtime:</span>
                    <p className="text-blue-900">{request.recommendation.estimated_downtime}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Timeline */}
            <div className="border-l-4 border-gray-200 pl-4">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Clock className="w-4 h-4" />
                <span>Submitted: {request.submitted_at.toLocaleString()}</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-600 mt-1">
                <User className="w-4 h-4" />
                <span>Assigned to: {request.manager.name} ({request.manager.role})</span>
              </div>
            </div>

            {/* Manager Response Section */}
            <div className="border-t pt-6">
              <h3 className="font-semibold text-gray-900 mb-4">Manager Response</h3>
              
              {!showDeclineReason && !showMoreInfoForm ? (
                <div className="space-y-4">
                  <textarea
                    value={response}
                    onChange={(e) => setResponse(e.target.value)}
                    placeholder="Add approval notes or comments (optional)..."
                    className="w-full border border-gray-300 rounded-lg p-3 text-sm"
                    rows={3}
                  />
                  
                  <div className="flex space-x-3">
                    <button
                      onClick={handleApprove}
                      disabled={isSubmitting}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center disabled:opacity-50"
                    >
                      <CheckCircle className="w-5 h-5 mr-2" />
                      {isSubmitting ? 'Approving...' : 'Approve Request'}
                    </button>
                    
                    <button
                      onClick={() => setShowDeclineReason(true)}
                      className="bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center"
                    >
                      <XCircle className="w-5 h-5 mr-2" />
                      Decline
                    </button>
                    
                    <button
                      onClick={() => setShowMoreInfoForm(true)}
                      className="bg-yellow-600 hover:bg-yellow-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center"
                    >
                      <MessageSquare className="w-5 h-5 mr-2" />
                      More Info
                    </button>
                  </div>
                </div>
              ) : showDeclineReason ? (
                <div className="space-y-4">
                  <textarea
                    value={declineReason}
                    onChange={(e) => setDeclineReason(e.target.value)}
                    placeholder="Please provide a reason for declining this request..."
                    className="w-full border border-red-300 rounded-lg p-3 text-sm"
                    rows={3}
                  />
                  <div className="flex space-x-3">
                    <button
                      onClick={handleDecline}
                      disabled={isSubmitting}
                      className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
                    >
                      {isSubmitting ? 'Declining...' : 'Confirm Decline'}
                    </button>
                    <button
                      onClick={() => {
                        setShowDeclineReason(false);
                        setDeclineReason('');
                      }}
                      className="bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <textarea
                    value={moreInfoQuestions}
                    onChange={(e) => setMoreInfoQuestions(e.target.value)}
                    placeholder="What additional information do you need to make this decision?"
                    className="w-full border border-yellow-300 rounded-lg p-3 text-sm"
                    rows={3}
                  />
                  <div className="flex space-x-3">
                    <button
                      onClick={handleRequestMoreInfo}
                      disabled={isSubmitting}
                      className="bg-yellow-600 hover:bg-yellow-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
                    >
                      {isSubmitting ? 'Requesting...' : 'Request More Info'}
                    </button>
                    <button
                      onClick={() => {
                        setShowMoreInfoForm(false);
                        setMoreInfoQuestions('');
                      }}
                      className="bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-6 py-4 rounded-b-lg flex justify-between items-center">
            <p className="text-sm text-gray-600">
              This request requires manager approval for costs over the authorized limit.
            </p>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Staff waiting interface
  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
      <div className="flex items-start space-x-3">
        <Clock className="w-5 h-5 text-yellow-600 mt-1" />
        <div className="flex-1">
          <h3 className="font-semibold text-yellow-900">Manager Approval Required</h3>
          <p className="text-yellow-800 text-sm mt-1">
            Your request for {request.equipment.name} ({formatCurrency(request.recommendation.estimated_cost)}) has been sent to {request.manager.name} for approval.
          </p>
          
          <div className="mt-3 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-yellow-700">Status:</span>
              <span className={`font-medium ${
                request.status === 'pending' ? 'text-yellow-600' :
                request.status === 'approved' ? 'text-green-600' :
                request.status === 'declined' ? 'text-red-600' :
                'text-blue-600'
              }`}>
                {request.status.replace('_', ' ').toUpperCase()}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-yellow-700">Submitted:</span>
              <span className="text-yellow-800">{request.submitted_at.toLocaleTimeString()}</span>
            </div>
            {request.responded_at && (
              <div className="flex justify-between text-sm">
                <span className="text-yellow-700">Responded:</span>
                <span className="text-yellow-800">{request.responded_at.toLocaleTimeString()}</span>
              </div>
            )}
          </div>

          {request.status === 'pending' && (
            <div className="mt-4 flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-600"></div>
                <span className="text-sm text-yellow-700">Awaiting response...</span>
              </div>
              <button
                onClick={() => window.location.href = `tel:${request.manager.email}`}
                className="text-yellow-600 hover:text-yellow-700 transition-colors"
                title="Contact manager"
              >
                <Phone className="w-4 h-4" />
              </button>
            </div>
          )}

          {request.response_notes && (
            <div className="mt-3 p-3 bg-white border border-yellow-200 rounded">
              <h4 className="font-medium text-yellow-900 text-sm">Manager Response:</h4>
              <p className="text-yellow-800 text-sm mt-1">{request.response_notes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ManagerApproval;