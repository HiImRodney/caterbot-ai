import React from 'react';
import { useEquipment } from '../contexts/EquipmentContext';
import { CheckCircle, AlertTriangle, XCircle, TrendingUp, MapPin, Calendar } from 'lucide-react';

const EquipmentSummary: React.FC = () => {
  const { equipment } = useEquipment();
  
  // Calculate statistics
  const totalEquipment = equipment.length;
  const operationalCount = equipment.filter(eq => eq.current_status === 'operational').length;
  const maintenanceCount = equipment.filter(eq => eq.current_status === 'maintenance_required').length;
  const outOfServiceCount = equipment.filter(eq => eq.current_status === 'out_of_service' || eq.current_status === 'under_repair').length;
  const criticalCount = equipment.filter(eq => eq.is_critical_equipment).length;
  
  const averagePerformance = equipment.reduce((sum, eq) => sum + (eq.performance_rating || 0), 0) / equipment.length;
  
  // Group by location
  const locationGroups = equipment.reduce((groups, eq) => {
    const location = eq.location_name || 'Unknown';
    if (!groups[location]) {
      groups[location] = [];
    }
    groups[location].push(eq);
    return groups;
  }, {} as Record<string, typeof equipment>);
  
  // Group by category
  const categoryGroups = equipment.reduce((groups, eq) => {
    const category = eq.category || 'Unknown';
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(eq);
    return groups;
  }, {} as Record<string, typeof equipment>);
  
  const getCategoryIcon = (category: string) => {
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
  
  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Equipment</p>
              <p className="text-3xl font-bold text-gray-900">{totalEquipment}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <TrendingUp className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Operational</p>
              <p className="text-3xl font-bold text-green-600">{operationalCount}</p>
              <p className="text-xs text-gray-500">
                {Math.round((operationalCount / totalEquipment) * 100)}% of total
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Needs Maintenance</p>
              <p className="text-3xl font-bold text-yellow-600">{maintenanceCount}</p>
              <p className="text-xs text-gray-500">
                {Math.round((maintenanceCount / totalEquipment) * 100)}% of total
              </p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-full">
              <AlertTriangle className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Out of Service</p>
              <p className="text-3xl font-bold text-red-600">{outOfServiceCount}</p>
              <p className="text-xs text-gray-500">
                {Math.round((outOfServiceCount / totalEquipment) * 100)}% of total
              </p>
            </div>
            <div className="p-3 bg-red-100 rounded-full">
              <XCircle className="h-6 w-6 text-red-600" />
            </div>
          </div>
        </div>
      </div>
      
      {/* Performance Overview */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Overview</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">Average Performance</span>
              <span className="text-lg font-bold text-gray-900">
                {averagePerformance.toFixed(1)}/5.0
              </span>
            </div>
            
            <div className="bg-gray-200 rounded-full h-3">
              <div 
                className={`h-3 rounded-full transition-all duration-300 ${
                  averagePerformance >= 4.0 ? 'bg-green-500' :
                  averagePerformance >= 3.0 ? 'bg-yellow-500' : 'bg-red-500'
                }`}
                style={{ width: `${(averagePerformance / 5.0) * 100}%` }}
              ></div>
            </div>
          </div>
          
          <div>
            <div className="text-sm text-gray-600 mb-2">
              <span className="font-medium">Critical Equipment:</span> {criticalCount} of {totalEquipment}
            </div>
            <div className="text-xs text-gray-500">
              {criticalCount > 0 && (
                <span className="text-orange-600 font-medium">
                  ⚠️ {criticalCount} critical equipment requires priority monitoring
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Location Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <MapPin className="h-5 w-5 mr-2" />
            Equipment by Location
          </h3>
          
          <div className="space-y-3">
            {Object.entries(locationGroups).map(([location, equipmentList]) => (
              <div key={location} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                <span className="font-medium text-gray-700">{location}</span>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">{equipmentList.length} items</span>
                  <div className="flex space-x-1">
                    {equipmentList.filter(eq => eq.current_status === 'operational').length > 0 && (
                      <div className="w-3 h-3 bg-green-400 rounded-full" title="Operational"></div>
                    )}
                    {equipmentList.filter(eq => eq.current_status === 'maintenance_required').length > 0 && (
                      <div className="w-3 h-3 bg-yellow-400 rounded-full" title="Maintenance Required"></div>
                    )}
                    {equipmentList.filter(eq => eq.current_status === 'out_of_service' || eq.current_status === 'under_repair').length > 0 && (
                      <div className="w-3 h-3 bg-red-400 rounded-full" title="Out of Service"></div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Category Breakdown */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Equipment by Category
          </h3>
          
          <div className="space-y-3">
            {Object.entries(categoryGroups).map(([category, equipmentList]) => (
              <div key={category} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                <div className="flex items-center space-x-2">
                  <span className="text-lg">{getCategoryIcon(category)}</span>
                  <span className="font-medium text-gray-700 capitalize">
                    {category.replace('_', ' ')}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">{equipmentList.length} items</span>
                  <div className="flex space-x-1">
                    {equipmentList.filter(eq => eq.current_status === 'operational').length > 0 && (
                      <div className="w-3 h-3 bg-green-400 rounded-full" title="Operational"></div>
                    )}
                    {equipmentList.filter(eq => eq.current_status === 'maintenance_required').length > 0 && (
                      <div className="w-3 h-3 bg-yellow-400 rounded-full" title="Maintenance Required"></div>
                    )}
                    {equipmentList.filter(eq => eq.current_status === 'out_of_service' || eq.current_status === 'under_repair').length > 0 && (
                      <div className="w-3 h-3 bg-red-400 rounded-full" title="Out of Service"></div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EquipmentSummary;