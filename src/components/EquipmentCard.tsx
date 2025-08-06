import React from 'react';
import { CheckCircle, AlertTriangle, XCircle, Wrench, MapPin } from 'lucide-react';
import { Equipment } from '../contexts/EquipmentContext';

interface EquipmentCardProps {
  equipment: Equipment;
  onClick: () => void;
}

const EquipmentCard: React.FC<EquipmentCardProps> = ({ equipment, onClick }) => {
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
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'operational':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'maintenance_required':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'out_of_service':
      case 'under_repair':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
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
  
  const getPerformanceColor = (rating: number) => {
    if (rating >= 4.0) return 'text-green-600';
    if (rating >= 3.0) return 'text-yellow-600';
    return 'text-red-600';
  };
  
  return (
    <div 
      onClick={onClick}
      className="bg-white rounded-lg shadow-md border border-gray-200 p-6 hover:shadow-lg hover:border-blue-300 transition-all duration-200 cursor-pointer group"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="text-3xl">
            {getEquipmentIcon(equipment.category)}
          </div>
          
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
              {equipment.display_name}
            </h3>
            <p className="text-sm text-gray-600">
              {equipment.manufacturer}
            </p>
          </div>
        </div>
        
        {equipment.is_critical_equipment && (
          <span className="px-2 py-1 text-xs font-medium bg-orange-100 text-orange-800 rounded-full">
            Critical
          </span>
        )}
      </div>
      
      {/* Status */}
      <div className="mb-4">
        <div className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-medium border ${
          getStatusColor(equipment.current_status)
        }`}>
          {getStatusIcon(equipment.current_status)}
          <span>{getStatusText(equipment.current_status)}</span>
        </div>
      </div>
      
      {/* Performance Rating */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Performance</span>
          <span className={`font-medium ${getPerformanceColor(equipment.performance_rating)}`}>
            {equipment.performance_rating?.toFixed(1)}/5.0
          </span>
        </div>
        
        <div className="mt-1 bg-gray-200 rounded-full h-2">
          <div 
            className={`h-2 rounded-full transition-all duration-300 ${
              equipment.performance_rating >= 4.0 ? 'bg-green-500' :
              equipment.performance_rating >= 3.0 ? 'bg-yellow-500' : 'bg-red-500'
            }`}
            style={{ width: `${(equipment.performance_rating / 5.0) * 100}%` }}
          ></div>
        </div>
      </div>
      
      {/* Details */}
      <div className="space-y-2 text-sm text-gray-600">
        <div className="flex items-center space-x-1">
          <MapPin className="h-4 w-4" />
          <span>{equipment.location_name}</span>
        </div>
        
        <div>
          <span className="font-medium">Model:</span> {equipment.internal_name}
        </div>
        
        {equipment.qr_code && (
          <div>
            <span className="font-medium">QR:</span> {equipment.qr_code}
          </div>
        )}
      </div>
      
      {/* Maintenance Info */}
      {equipment.next_maintenance_due && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="text-xs text-gray-500">
            Next maintenance: {new Date(equipment.next_maintenance_due).toLocaleDateString()}
          </div>
        </div>
      )}
      
      {/* Hover Action */}
      <div className="mt-4 text-center opacity-0 group-hover:opacity-100 transition-opacity">
        <span className="text-sm text-blue-600 font-medium">
          Click to get troubleshooting help →
        </span>
      </div>
    </div>
  );
};

export default EquipmentCard;