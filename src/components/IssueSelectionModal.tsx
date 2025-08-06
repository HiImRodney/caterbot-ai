import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, MessageCircle, AlertTriangle, Snowflake, Flame, Droplet, Settings } from 'lucide-react';
import { Equipment } from '../contexts/EquipmentContext';
import { IssueType } from '../pages/ChatInterface';

interface IssueSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  equipment: Equipment;
}

const IssueSelectionModal: React.FC<IssueSelectionModalProps> = ({ isOpen, onClose, equipment }) => {
  const navigate = useNavigate();
  const [isStarting, setIsStarting] = useState(false);
  
  // Equipment-specific issues based on category
  const getIssuesForEquipment = (equipment: Equipment): IssueType[] => {
    const baseIssues: IssueType[] = [
      {
        id: 'other',
        title: 'Other issue',
        description: 'Describe your specific issue',
        category: 'general',
        severity: 'medium'
      }
    ];
    
    switch (equipment.category?.toLowerCase()) {
      case 'refrigeration':
      case 'cooling':
        return [
          {
            id: 'not_cooling',
            title: 'Not cooling properly',
            description: 'Temperature and cooling system issues',
            category: 'cooling',
            severity: 'high'
          },
          {
            id: 'ice_buildup',
            title: 'Ice buildup',
            description: 'Ice production and quality problems',
            category: 'mechanical',
            severity: 'medium'
          },
          {
            id: 'door_issues',
            title: 'Door issues',
            description: 'Door seal and closure issues',
            category: 'mechanical',
            severity: 'medium'
          },
          {
            id: 'temperature_problems',
            title: 'Temperature problems',
            description: 'Temperature control and monitoring issues',
            category: 'cooling',
            severity: 'high'
          },
          {
            id: 'unusual_noises',
            title: 'Unusual noises',
            description: 'Strange sounds from compressor or fans',
            category: 'mechanical',
            severity: 'medium'
          },
          ...baseIssues
        ];
      
      case 'cooking':
      case 'heating':
        return [
          {
            id: 'not_heating',
            title: 'Not heating properly',
            description: 'Temperature and heating system issues',
            category: 'heating',
            severity: 'high'
          },
          {
            id: 'uneven_heating',
            title: 'Uneven heating',
            description: 'Hot spots or cold areas in cooking area',
            category: 'heating',
            severity: 'medium'
          },
          {
            id: 'gas_issues',
            title: 'Gas burner problems',
            description: 'Issues with gas ignition or flame control',
            category: 'gas',
            severity: 'critical'
          },
          {
            id: 'electrical_issues',
            title: 'Electrical problems',
            description: 'Power, control, or electrical component issues',
            category: 'electrical',
            severity: 'critical'
          },
          {
            id: 'control_panel',
            title: 'Control panel issues',
            description: 'Display, buttons, or control problems',
            category: 'controls',
            severity: 'medium'
          },
          ...baseIssues
        ];
      
      case 'warewashing':
      case 'cleaning':
        return [
          {
            id: 'not_cleaning',
            title: 'Not cleaning properly',
            description: 'Poor wash quality or cleaning performance',
            category: 'cleaning',
            severity: 'high'
          },
          {
            id: 'water_temperature',
            title: 'Water temperature issues',
            description: 'Water too hot, cold, or inconsistent temperature',
            category: 'heating',
            severity: 'high'
          },
          {
            id: 'drainage_problems',
            title: 'Drainage problems',
            description: 'Water not draining or slow drainage',
            category: 'plumbing',
            severity: 'medium'
          },
          {
            id: 'chemical_dispensing',
            title: 'Chemical dispensing issues',
            description: 'Detergent or rinse aid problems',
            category: 'chemical',
            severity: 'medium'
          },
          {
            id: 'unusual_noises',
            title: 'Unusual noises',
            description: 'Strange sounds during operation',
            category: 'mechanical',
            severity: 'medium'
          },
          ...baseIssues
        ];
      
      case 'ice':
      case 'ice_production':
        return [
          {
            id: 'no_ice_production',
            title: 'No ice production',
            description: 'Machine not making ice at all',
            category: 'production',
            severity: 'high'
          },
          {
            id: 'slow_ice_production',
            title: 'Slow ice production',
            description: 'Taking too long to make ice',
            category: 'production',
            severity: 'medium'
          },
          {
            id: 'poor_ice_quality',
            title: 'Poor ice quality',
            description: 'Cloudy, small, or malformed ice cubes',
            category: 'quality',
            severity: 'medium'
          },
          {
            id: 'water_issues',
            title: 'Water supply issues',
            description: 'Water flow, pressure, or quality problems',
            category: 'water',
            severity: 'high'
          },
          {
            id: 'harvest_problems',
            title: 'Ice harvest problems',
            description: 'Ice not dropping or releasing properly',
            category: 'mechanical',
            severity: 'medium'
          },
          ...baseIssues
        ];
      
      default:
        return [
          {
            id: 'not_working',
            title: 'Equipment not working',
            description: 'General equipment malfunction',
            category: 'general',
            severity: 'high'
          },
          {
            id: 'performance_issues',
            title: 'Performance issues',
            description: 'Equipment running but not performing well',
            category: 'performance',
            severity: 'medium'
          },
          {
            id: 'unusual_behavior',
            title: 'Unusual behavior',
            description: 'Equipment acting differently than normal',
            category: 'general',
            severity: 'medium'
          },
          ...baseIssues
        ];
    }
  };
  
  const getIssueIcon = (issue: IssueType) => {
    switch (issue.category) {
      case 'cooling':
        return <Snowflake className="h-5 w-5 text-blue-400" />;
      case 'heating':
      case 'gas':
        return <Flame className="h-5 w-5 text-orange-400" />;
      case 'cleaning':
      case 'plumbing':
      case 'water':
        return <Droplet className="h-5 w-5 text-blue-400" />;
      case 'electrical':
        return <AlertTriangle className="h-5 w-5 text-yellow-400" />;
      default:
        return <Settings className="h-5 w-5 text-gray-400" />;
    }
  };
  
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'border-red-300 bg-red-50 hover:bg-red-100 text-red-900';
      case 'high':
        return 'border-orange-300 bg-orange-50 hover:bg-orange-100 text-orange-900';
      case 'medium':
        return 'border-yellow-300 bg-yellow-50 hover:bg-yellow-100 text-yellow-900';
      case 'low':
        return 'border-green-300 bg-green-50 hover:bg-green-100 text-green-900';
      default:
        return 'border-gray-300 bg-gray-50 hover:bg-gray-100 text-gray-900';
    }
  };
  
  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">Critical</span>;
      case 'high':
        return <span className="px-2 py-1 text-xs font-medium bg-orange-100 text-orange-800 rounded-full">High</span>;
      case 'medium':
        return <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">Medium</span>;
      case 'low':
        return <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">Low</span>;
      default:
        return <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">Normal</span>;
    }
  };
  
  const handleIssueSelect = async (issue: IssueType) => {
    setIsStarting(true);
    
    try {
      // Generate unique session ID
      const sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // Navigate to chat interface with equipment and issue context
      navigate(`/chat/${sessionId}`, {
        state: {
          equipment,
          selectedIssue: issue
        }
      });
      
    } catch (error) {
      console.error('Failed to start chat session:', error);
      setIsStarting(false);
    }
  };
  
  const getEquipmentIcon = (category: string) => {
    switch (category?.toLowerCase()) {
      case 'refrigeration':
      case 'cooling':
        return '❄️';
      case 'cooking':
      case 'heating':
        return '🔥';
      case 'warewashing':
      case 'cleaning':
        return '💧';
      case 'ice':
      case 'ice_production':
        return '🧊';
      default:
        return '⚙️';
    }
  };
  
  const issues = getIssuesForEquipment(equipment);
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div 
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" 
          onClick={onClose}
        ></div>
        
        {/* Modal panel */}
        <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <span className="text-2xl">{getEquipmentIcon(equipment.category)}</span>
              <div>
                <h3 className="text-lg font-medium text-gray-900">
                  {equipment.display_name}
                </h3>
                <p className="text-sm text-gray-500">
                  {equipment.manufacturer} • {equipment.location_name}
                </p>
              </div>
            </div>
            
            <button
              onClick={onClose}
              className="rounded-md text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          
          {/* Instructions */}
          <div className="mb-6">
            <h4 className="text-sm font-medium text-gray-900 mb-2">
              What type of issue are you experiencing?
            </h4>
            <p className="text-sm text-gray-600">
              Select the issue that best describes the problem to get targeted troubleshooting help.
            </p>
          </div>
          
          {/* Issue options */}
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {issues.map((issue) => (
              <button
                key={issue.id}
                onClick={() => handleIssueSelect(issue)}
                disabled={isStarting}
                className={`w-full text-left p-4 rounded-lg border-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed ${
                  getSeverityColor(issue.severity)
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    {getIssueIcon(issue)}
                    <div className="flex-1">
                      <h5 className="font-medium text-sm">
                        {issue.title}
                      </h5>
                      <p className="text-xs opacity-75 mt-1">
                        {issue.description}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end space-y-1">
                    {getSeverityBadge(issue.severity)}
                    {issue.severity === 'critical' && (
                      <span className="text-xs text-red-600 font-medium flex items-center">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        Safety Alert
                      </span>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
          
          {/* Footer */}
          <div className="mt-6 pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center text-sm text-gray-500">
                <MessageCircle className="h-4 w-4 mr-1" />
                <span>AI troubleshooting chat</span>
              </div>
              
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Cancel
              </button>
            </div>
            
            {isStarting && (
              <div className="mt-3 flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mr-2"></div>
                <span className="text-sm text-gray-600">Starting troubleshooting session...</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default IssueSelectionModal;