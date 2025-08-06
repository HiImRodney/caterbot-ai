import React from 'react';
import { Search, Filter } from 'lucide-react';
import { useEquipment } from '../contexts/EquipmentContext';

const EquipmentSearch: React.FC = () => {
  const {
    equipment,
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    locationFilter,
    setLocationFilter
  } = useEquipment();
  
  // Get unique locations for filter
  const uniqueLocations = Array.from(new Set(equipment.map(eq => eq.location_name)));
  
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Search Input */}
        <div className="md:col-span-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search equipment..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
        
        {/* Status Filter */}
        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Statuses</option>
            <option value="operational">Operational</option>
            <option value="maintenance_required">Maintenance Required</option>
            <option value="out_of_service">Out of Service</option>
            <option value="under_repair">Under Repair</option>
          </select>
        </div>
        
        {/* Location Filter */}
        <div>
          <select
            value={locationFilter}
            onChange={(e) => setLocationFilter(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Locations</option>
            {uniqueLocations.map((location) => (
              <option key={location} value={location}>
                {location}
              </option>
            ))}
          </select>
        </div>
      </div>
      
      {/* Active filters display */}
      {(searchTerm || statusFilter !== 'all' || locationFilter !== 'all') && (
        <div className="mt-3 flex items-center space-x-2">
          <Filter className="h-4 w-4 text-gray-400" />
          <span className="text-sm text-gray-600">Active filters:</span>
          
          {searchTerm && (
            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
              Search: "{searchTerm}"
            </span>
          )}
          
          {statusFilter !== 'all' && (
            <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
              Status: {statusFilter.replace('_', ' ')}
            </span>
          )}
          
          {locationFilter !== 'all' && (
            <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
              Location: {locationFilter}
            </span>
          )}
          
          <button
            onClick={() => {
              setSearchTerm('');
              setStatusFilter('all');
              setLocationFilter('all');
            }}
            className="text-xs text-gray-500 hover:text-gray-700 underline"
          >
            Clear all
          </button>
        </div>
      )}
    </div>
  );
};

export default EquipmentSearch;