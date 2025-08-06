import React from 'react';
import { ArrowLeft, Clock, Wifi, CheckCircle, AlertTriangle, XCircle, Wrench } from 'lucide-react';
import { Equipment } from '../../contexts/EquipmentContext';
import { IssueType } from '../../pages/ChatInterface';

interface ChatHeaderProps {
  equipment: Equipment;
  selectedIssue?: IssueType;
  onBack: () => void;
}

const ChatHeader: React.FC<ChatHeaderProps> = ({ equipment, selectedIssue, onBack }) => {
  const getEquipmentIcon = (category: string) => {
    switch (category.toLowerCase()) {
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
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'operational':
        return 'text-green-400';
      case 'maintenance_required':
        return 'text-yellow-400';
      case 'out_of_service':
      case 'under_repair':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  };
  
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'operational':
        return <CheckCircle className="h-4 w-4" />;
      case 'maintenance_required':
        return <AlertTriangle className="h-4 w-4" />;
      case 'out_of_service':
      case 'under_repair':
        return <XCircle className="h-4 w-4" />;
      default:
        return <Wrench className="h-4 w-4" />;
    }
  };
  
  const getStatusText = (status: string) => {
    switch (status) {
      case 'operational':
        return 'Operational';
      case 'maintenance_required':
        return 'Maintenance Required';
      case 'out_of_service':
        return 'Out of Service';
      case 'under_repair':
        return 'Under Repair';
      default:
        return 'Unknown Status';
    }
  };
  
  const getPerformanceBarColor = (rating: number) => {
    if (rating >= 4.0) return 'bg-green-500';
    if (rating >= 3.0) return 'bg-yellow-500';
    return 'bg-red-500';
  };
  
  const currentTime = new Date().toLocaleTimeString('en-GB', { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
  
  return (
    <div className="bg-slate-800/90 backdrop-blur-sm border-b border-slate-700 px-4 py-3">
      {/* Top Row - Equipment Name and Status */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-3">
          <button
            onClick={onBack}
            className="p-2 rounded-lg bg-slate-700/50 hover:bg-slate-700 transition-colors"
            aria-label="Back to equipment grid"
          >
            <ArrowLeft className="h-5 w-5 text-white" />
          </button>
          
          <div className="flex items-center space-x-2">
            <span className="text-2xl">{getEquipmentIcon(equipment.category)}</span>
            <div>
              <h1 className="text-lg font-semibold text-white">
                {equipment.display_name}
              </h1>
              <p className="text-sm text-slate-300">
                {equipment.manufacturer} • {equipment.internal_name}
              </p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-4 text-sm text-slate-300">
          <div className="flex items-center space-x-1">
            <Clock className="h-4 w-4" />
            <span>{currentTime}</span>
          </div>
          
          <div className="flex items-center space-x-1">
            <Wifi className="h-4 w-4 text-green-400" />
            <span>Online</span>
          </div>
          
          <div className="flex items-center space-x-1 text-blue-400">
            <CheckCircle className="h-4 w-4" />
            <span>Expert Help</span>
          </div>
        </div>
      </div>
      
      {/* Second Row - Issue Context */}
      {selectedIssue && (
        <div className="mb-3">
          <p className="text-slate-200 text-sm">
            <span className="font-medium">Issue:</span> {selectedIssue.title}
          </p>
          {selectedIssue.description && (
            <p className="text-slate-400 text-xs mt-1">
              {selectedIssue.description}
            </p>
          )}
        </div>
      )}
      
      {/* Third Row - Equipment Status Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3 flex-1">
          {/* Performance Rating Bar */}
          <div className="flex-1 max-w-xs">
            <div className="flex items-center space-x-2">
              <div className="flex-1 bg-slate-700 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-300 ${
                    getPerformanceBarColor(equipment.performance_rating)
                  }`}
                  style={{ width: `${(equipment.performance_rating / 5.0) * 100}%` }}
                ></div>
              </div>
              
              <span className="text-xs text-slate-300 min-w-0">
                {Math.round((equipment.performance_rating / 5.0) * 100)}%
              </span>
            </div>
          </div>
          
          {/* Status Indicator */}
          <div className={`flex items-center space-x-1 ${getStatusColor(equipment.current_status)}`}>
            {getStatusIcon(equipment.current_status)}
            <span className="text-sm font-medium">
              {getStatusText(equipment.current_status)}
            </span>
          </div>
        </div>
        
        {/* Location */}
        <div className="text-right">
          <p className="text-xs text-slate-400">
            📍 {equipment.location_name}
          </p>
          {equipment.is_critical_equipment && (
            <p className="text-xs text-orange-400 font-medium">
              ⚠️ Critical Equipment
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatHeader;