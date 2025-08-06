import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface Equipment {
  id: string;
  qr_code: string;
  internal_name: string;
  display_name: string;
  manufacturer: string;
  category: string;
  current_status: 'operational' | 'maintenance_required' | 'out_of_service' | 'under_repair';
  location_name: string;
  performance_rating: number;
  is_critical_equipment: boolean;
  equipment_type_id: string;
  last_maintenance_date?: string;
  next_maintenance_due?: string;
}

interface EquipmentContextType {
  equipment: Equipment[];
  loading: boolean;
  error: string | null;
  selectedEquipment: Equipment | null;
  setSelectedEquipment: (equipment: Equipment | null) => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  statusFilter: string;
  setStatusFilter: (status: string) => void;
  locationFilter: string;
  setLocationFilter: (location: string) => void;
  filteredEquipment: Equipment[];
  refreshEquipment: () => Promise<void>;
  scanQRCode: (qrCode: string) => Promise<Equipment | null>;
}

const EquipmentContext = createContext<EquipmentContextType | undefined>(undefined);

export const EquipmentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [locationFilter, setLocationFilter] = useState('all');

  // Fetch equipment from Supabase
  const fetchEquipment = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get equipment with all related data
      const { data, error: supabaseError } = await supabase
        .from('site_equipment')
        .select(`
          id,
          qr_code,
          internal_name,
          current_status,
          performance_rating,
          is_critical_equipment,
          equipment_type_id,
          last_maintenance_date,
          next_maintenance_due,
          equipment_locations (
            location_name
          ),
          equipment_catalog (
            display_name,
            manufacturer,
            category
          )
        `)
        .eq('site_id', 'dfca581b-5590-4845-9b05-8d90f59037c9') // TOCA test site
        .order('internal_name');

      if (supabaseError) {
        throw new Error(`Database error: ${supabaseError.message}`);
      }

      if (!data) {
        throw new Error('No equipment data received');
      }

      // Transform the data to match our Equipment interface
      // Handle the fact that Supabase joins return arrays even for single relationships
      const transformedEquipment: Equipment[] = data.map(item => {
        // Extract first element from arrays (since these are single relationships)
        const catalogData = Array.isArray(item.equipment_catalog) 
          ? item.equipment_catalog[0] 
          : item.equipment_catalog;
        const locationData = Array.isArray(item.equipment_locations) 
          ? item.equipment_locations[0] 
          : item.equipment_locations;

        return {
          id: item.id,
          qr_code: item.qr_code,
          internal_name: item.internal_name,
          display_name: catalogData?.display_name || item.internal_name,
          manufacturer: catalogData?.manufacturer || 'Unknown',
          category: catalogData?.category || 'unknown',
          current_status: item.current_status,
          location_name: locationData?.location_name || 'Unknown',
          performance_rating: item.performance_rating || 5.0,
          is_critical_equipment: item.is_critical_equipment,
          equipment_type_id: item.equipment_type_id,
          last_maintenance_date: item.last_maintenance_date,
          next_maintenance_due: item.next_maintenance_due
        };
      });

      setEquipment(transformedEquipment);
      console.log(`✅ Loaded ${transformedEquipment.length} equipment items from Supabase`);
      
    } catch (error) {
      console.error('Failed to fetch equipment:', error);
      setError(error instanceof Error ? error.message : 'Failed to load equipment');
      
      // Fallback to sample data for development
      setEquipment([
        {
          id: 'sample-1',
          qr_code: 'SAMPLE-001',
          internal_name: 'Sample Pizza Oven',
          display_name: 'Commercial Pizza Oven',
          manufacturer: 'Sample Manufacturer',
          category: 'cooking',
          current_status: 'operational',
          location_name: 'Main Kitchen',
          performance_rating: 4.5,
          is_critical_equipment: true,
          equipment_type_id: 'SAMPLE-PIZZA-OVEN'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  // QR Code scanning
  const scanQRCode = async (qrCode: string): Promise<Equipment | null> => {
    try {
      // Call the QR scanner Edge Function
      const { data, error } = await supabase.functions.invoke('qr-scanner', {
        body: { qr_code: qrCode }
      });

      if (error) {
        console.error('QR scan error:', error);
        return null;
      }

      if (data?.success && data?.scan_result?.equipment) {
        const scannedEquipment = data.scan_result.equipment;
        
        // Transform the equipment data to match our interface
        const equipment: Equipment = {
          id: scannedEquipment.id,
          qr_code: scannedEquipment.qr_code,
          internal_name: scannedEquipment.internal_name,
          display_name: scannedEquipment.display_name,
          manufacturer: scannedEquipment.manufacturer,
          category: scannedEquipment.category,
          current_status: scannedEquipment.current_status,
          location_name: scannedEquipment.location?.name || 'Unknown',
          performance_rating: scannedEquipment.performance_rating || 5.0,
          is_critical_equipment: scannedEquipment.is_critical_equipment,
          equipment_type_id: scannedEquipment.equipment_type_id
        };

        setSelectedEquipment(equipment);
        return equipment;
      }

      return null;
    } catch (error) {
      console.error('QR code scan failed:', error);
      return null;
    }
  };

  // Filter equipment based on search and filters
  const filteredEquipment = equipment.filter(item => {
    const matchesSearch = searchTerm === '' || 
      item.internal_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.display_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.manufacturer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.location_name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || item.current_status === statusFilter;
    const matchesLocation = locationFilter === 'all' || item.location_name === locationFilter;
    
    return matchesSearch && matchesStatus && matchesLocation;
  });

  // Initial load
  useEffect(() => {
    fetchEquipment();
  }, []);

  const value: EquipmentContextType = {
    equipment,
    loading,
    error,
    selectedEquipment,
    setSelectedEquipment,
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    locationFilter,
    setLocationFilter,
    filteredEquipment,
    refreshEquipment: fetchEquipment,
    scanQRCode
  };

  return (
    <EquipmentContext.Provider value={value}>
      {children}
    </EquipmentContext.Provider>
  );
};

export const useEquipment = () => {
  const context = useContext(EquipmentContext);
  if (context === undefined) {
    throw new Error('useEquipment must be used within an EquipmentProvider');
  }
  return context;
};
