import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { 
  ArrowLeft, 
  Search, 
  Package, 
  Camera, 
  Eye, 
  ShoppingCart, 
  CheckCircle, 
  AlertTriangle, 
  Clock, 
  User, 
  DollarSign,
  TrendingUp,
  FileText,
  Shield,
  Plus,
  Minus
} from 'lucide-react';

interface Equipment {
  id: string;
  display_name: string;
  manufacturer: string;
  model_series: string;
  category: string;
  location_name: string;
  parts_supplier_info?: any;
  technical_specs?: any;
}

interface PartItem {
  id: string;
  part_number: string;
  part_name: string;
  description: string;
  category: 'wear_item' | 'filter' | 'seal' | 'heating_element' | 'motor' | 'control' | 'safety' | 'accessory';
  estimated_cost_gbp: number;
  availability: 'in_stock' | 'order_required' | 'long_lead_time' | 'discontinued';
  supplier_name: string;
  supplier_contact?: string;
  compatibility_notes?: string;
  installation_difficulty: 'easy' | 'moderate' | 'professional_required';
  urgency_level: 'routine' | 'maintenance' | 'critical' | 'emergency';
  image_url?: string;
  maintenance_interval?: string;
  common_failure_symptoms?: string[];
  installation_time_minutes?: number;
}

interface PartsRequest {
  id?: string;
  part_item_id: string;
  quantity: number;
  justification: string;
  urgency: 'routine' | 'urgent' | 'emergency';
  estimated_total_cost: number;
  status: 'draft' | 'pending_approval' | 'approved' | 'ordered' | 'delivered' | 'rejected';
  manager_notes?: string;
}

interface PartsList {
  equipmentId: string;
  equipmentName: string;
  requests: PartsRequest[];
  totalEstimatedCost: number;
  requiresManagerApproval: boolean;
  submittedBy: string;
  maintenanceContext?: string;
}

const PartsList: React.FC = () => {
  const { equipmentId } = useParams<{ equipmentId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get context from maintenance workflow
  const equipment = location.state?.equipment;
  const maintenanceContext = location.state?.maintenanceContext;
  const chatSessionData = location.state?.chatSession;

  const [availableParts, setAvailableParts] = useState<PartItem[]>([]);
  const [filteredParts, setFilteredParts] = useState<PartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [partsRequest, setPartsRequest] = useState<PartsList>({
    equipmentId: equipment?.id || equipmentId || '',
    equipmentName: equipment?.display_name || '',
    requests: [],
    totalEstimatedCost: 0,
    requiresManagerApproval: false,
    submittedBy: '', // Will be populated from user context
    maintenanceContext: maintenanceContext
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showVisualId, setShowVisualId] = useState<string | null>(null);
  const [showPrivacyInfo, setShowPrivacyInfo] = useState(false);

  // Equipment-specific parts data (TOCA equipment focus)
  const getEquipmentParts = (equipmentType: string, manufacturer: string): PartItem[] => {
    // Williams Reach-In Chiller Parts
    if (manufacturer.toLowerCase().includes('williams') && equipmentType.toLowerCase().includes('chill')) {
      return [
        {
          id: 'williams-chill-001',
          part_number: 'WIL-DC-001',
          part_name: 'Door Seal (Main)',
          description: 'Primary door gasket seal for Williams reach-in chiller',
          category: 'seal',
          estimated_cost_gbp: 45.99,
          availability: 'in_stock',
          supplier_name: 'Williams Direct',
          supplier_contact: 'parts@williams-refrigeration.co.uk',
          installation_difficulty: 'easy',
          urgency_level: 'maintenance',
          maintenance_interval: 'Every 18 months',
          common_failure_symptoms: ['Cold air escaping', 'Condensation around door', 'Higher energy bills'],
          installation_time_minutes: 30
        },
        {
          id: 'williams-chill-002', 
          part_number: 'WIL-TH-002',
          part_name: 'Thermostat Control',
          description: 'Digital temperature controller for Williams chiller',
          category: 'control',
          estimated_cost_gbp: 89.50,
          availability: 'order_required',
          supplier_name: 'Williams Direct',
          installation_difficulty: 'professional_required',
          urgency_level: 'critical',
          common_failure_symptoms: ['Temperature fluctuations', 'Display not working', 'Compressor running constantly'],
          installation_time_minutes: 90
        },
        {
          id: 'williams-chill-003',
          part_number: 'WIL-FAN-003',
          part_name: 'Evaporator Fan Motor',
          description: 'Internal circulation fan for even cooling',
          category: 'motor',
          estimated_cost_gbp: 125.00,
          availability: 'in_stock',
          supplier_name: 'Williams Direct',
          installation_difficulty: 'moderate',
          urgency_level: 'critical',
          common_failure_symptoms: ['No air circulation', 'Loud noises', 'Uneven temperatures'],
          installation_time_minutes: 120
        },
        {
          id: 'williams-chill-004',
          part_number: 'WIL-FILT-004',
          part_name: 'Air Filter Set (3-pack)',
          description: 'HEPA air filters for clean air circulation',
          category: 'filter',
          estimated_cost_gbp: 28.75,
          availability: 'in_stock',
          supplier_name: 'Commercial Kitchen Supplies',
          installation_difficulty: 'easy',
          urgency_level: 'routine',
          maintenance_interval: 'Every 3 months',
          common_failure_symptoms: ['Reduced cooling efficiency', 'Dust buildup', 'Poor air quality'],
          installation_time_minutes: 15
        }
      ];
    }

    // Falcon Range Parts
    if (manufacturer.toLowerCase().includes('falcon') && equipmentType.toLowerCase().includes('range')) {
      return [
        {
          id: 'falcon-range-001',
          part_number: 'FAL-IGN-001',
          part_name: 'Ignition Electrode Set',
          description: 'Gas ignition electrodes for Falcon 6-burner range',
          category: 'safety',
          estimated_cost_gbp: 67.50,
          availability: 'in_stock',
          supplier_name: 'Falcon Parts Direct',
          installation_difficulty: 'professional_required',
          urgency_level: 'emergency',
          common_failure_symptoms: ['Burners not lighting', 'Clicking but no flame', 'Gas smell'],
          installation_time_minutes: 60
        },
        {
          id: 'falcon-range-002',
          part_number: 'FAL-VALVE-002', 
          part_name: 'Gas Control Valve',
          description: 'Individual burner gas control valve',
          category: 'safety',
          estimated_cost_gbp: 94.25,
          availability: 'order_required',
          supplier_name: 'Falcon Parts Direct',
          installation_difficulty: 'professional_required',
          urgency_level: 'critical',
          common_failure_symptoms: ['Gas not shutting off', 'Flame too high/low', 'Valve handle loose'],
          installation_time_minutes: 90
        },
        {
          id: 'falcon-range-003',
          part_number: 'FAL-GRAT-003',
          part_name: 'Burner Grate (Cast Iron)',
          description: 'Heavy-duty cast iron burner grate',
          category: 'wear_item',
          estimated_cost_gbp: 156.00,
          availability: 'in_stock',
          supplier_name: 'Commercial Kitchen Supplies',
          installation_difficulty: 'easy',
          urgency_level: 'maintenance',
          common_failure_symptoms: ['Cracked grate', 'Unstable pots', 'Rust formation'],
          installation_time_minutes: 10
        }
      ];
    }

    // Hobart Dishwasher Parts  
    if (manufacturer.toLowerCase().includes('hobart') && equipmentType.toLowerCase().includes('dish')) {
      return [
        {
          id: 'hobart-dish-001',
          part_number: 'HOB-ARM-001',
          part_name: 'Wash Arm Assembly',
          description: 'Lower wash arm with spray jets for Hobart dishwasher',
          category: 'wear_item',
          estimated_cost_gbp: 89.99,
          availability: 'in_stock',
          supplier_name: 'Hobart Service',
          installation_difficulty: 'moderate',
          urgency_level: 'critical',
          common_failure_symptoms: ['Poor washing performance', 'Blocked spray holes', 'Arm not rotating'],
          installation_time_minutes: 45
        },
        {
          id: 'hobart-dish-002',
          part_number: 'HOB-PUMP-002',
          part_name: 'Water Pump Motor',
          description: 'Main wash pump motor assembly',
          category: 'motor',
          estimated_cost_gbp: 245.50,
          availability: 'order_required',
          supplier_name: 'Hobart Service',
          installation_difficulty: 'professional_required',
          urgency_level: 'emergency',
          common_failure_symptoms: ['No water circulation', 'Strange noises', 'Tripping electrics'],
          installation_time_minutes: 180
        },
        {
          id: 'hobart-dish-003',
          part_number: 'HOB-FILT-003',
          part_name: 'Water Filter Cartridge',
          description: 'Pre-wash water filtration cartridge',
          category: 'filter',
          estimated_cost_gbp: 34.25,
          availability: 'in_stock',
          supplier_name: 'Commercial Kitchen Supplies',
          installation_difficulty: 'easy',
          urgency_level: 'routine',
          maintenance_interval: 'Every 6 months',
          common_failure_symptoms: ['Spots on dishes', 'Scale buildup', 'Poor rinse quality'],
          installation_time_minutes: 20
        }
      ];
    }

    // Generic/Universal parts for unknown equipment
    return [
      {
        id: 'generic-001',
        part_number: 'GEN-CLEAN-001',
        part_name: 'Universal Cleaning Kit',
        description: 'Professional kitchen equipment cleaning supplies',
        category: 'accessory',
        estimated_cost_gbp: 25.99,
        availability: 'in_stock',
        supplier_name: 'Commercial Kitchen Supplies',
        installation_difficulty: 'easy',
        urgency_level: 'routine',
        installation_time_minutes: 5
      },
      {
        id: 'generic-002',
        part_number: 'GEN-SEAL-002',
        part_name: 'Generic Door Seal Kit',
        description: 'Universal door sealing kit for various equipment',
        category: 'seal',
        estimated_cost_gbp: 42.50,
        availability: 'in_stock',
        supplier_name: 'Commercial Kitchen Supplies',
        installation_difficulty: 'moderate',
        urgency_level: 'maintenance',
        installation_time_minutes: 60
      }
    ];
  };

  useEffect(() => {
    loadEquipmentParts();
  }, [equipment, equipmentId]);

  useEffect(() => {
    filterParts();
  }, [searchTerm, selectedCategory, availableParts]);

  useEffect(() => {
    calculateTotalCost();
  }, [partsRequest.requests]);

  const loadEquipmentParts = async () => {
    setIsLoading(true);
    try {
      // Load equipment data if not provided
      let equipmentData = equipment;
      if (!equipmentData && equipmentId) {
        const { data, error } = await supabase
          .from('equipment')
          .select('*')
          .eq('id', equipmentId)
          .single();

        if (error) throw error;
        equipmentData = data;
      }

      if (equipmentData) {
        // Get parts based on equipment type and manufacturer
        const parts = getEquipmentParts(
          equipmentData.category || '', 
          equipmentData.manufacturer || ''
        );
        
        setAvailableParts(parts);
        setPartsRequest(prev => ({
          ...prev,
          equipmentId: equipmentData.id,
          equipmentName: equipmentData.display_name
        }));
      }
    } catch (error) {
      console.error('Failed to load equipment parts:', error);
      setError('Failed to load parts information');
    } finally {
      setIsLoading(false);
    }
  };

  const filterParts = () => {
    let filtered = availableParts;

    if (searchTerm) {
      filtered = filtered.filter(part => 
        part.part_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        part.part_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        part.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (part.common_failure_symptoms || []).some(symptom => 
          symptom.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(part => part.category === selectedCategory);
    }

    setFilteredParts(filtered);
  };

  const calculateTotalCost = () => {
    const total = partsRequest.requests.reduce((sum, request) => {
      const part = availableParts.find(p => p.id === request.part_item_id);
      return sum + (part ? part.estimated_cost_gbp * request.quantity : 0);
    }, 0);

    setPartsRequest(prev => ({
      ...prev,
      totalEstimatedCost: total,
      requiresManagerApproval: total > 100 || prev.requests.some(r => r.urgency === 'emergency')
    }));
  };

  const addPartToRequest = (part: PartItem) => {
    const existingRequest = partsRequest.requests.find(r => r.part_item_id === part.id);
    
    if (existingRequest) {
      setPartsRequest(prev => ({
        ...prev,
        requests: prev.requests.map(r => 
          r.part_item_id === part.id 
            ? { ...r, quantity: r.quantity + 1, estimated_total_cost: part.estimated_cost_gbp * (r.quantity + 1) }
            : r
        )
      }));
    } else {
      const newRequest: PartsRequest = {
        part_item_id: part.id,
        quantity: 1,
        justification: `Required for ${equipment?.display_name} maintenance`,
        urgency: part.urgency_level as any,
        estimated_total_cost: part.estimated_cost_gbp,
        status: 'draft'
      };

      setPartsRequest(prev => ({
        ...prev,
        requests: [...prev.requests, newRequest]
      }));
    }
  };

  const updatePartQuantity = (partId: string, change: number) => {
    setPartsRequest(prev => ({
      ...prev,
      requests: prev.requests.map(r => {
        if (r.part_item_id === partId) {
          const newQuantity = Math.max(0, r.quantity + change);
          const part = availableParts.find(p => p.id === partId);
          return {
            ...r,
            quantity: newQuantity,
            estimated_total_cost: part ? part.estimated_cost_gbp * newQuantity : 0
          };
        }
        return r;
      }).filter(r => r.quantity > 0)
    }));
  };

  const updateRequestJustification = (partId: string, justification: string) => {
    setPartsRequest(prev => ({
      ...prev,
      requests: prev.requests.map(r => 
        r.part_item_id === partId ? { ...r, justification } : r
      )
    }));
  };

  const submitPartsRequest = async () => {
    if (partsRequest.requests.length === 0) {
      setError('Please add at least one part to your request');
      return;
    }

    if (!partsRequest.submittedBy) {
      setError('Please provide your name');
      return;
    }

    if (partsRequest.requests.some(r => !r.justification.trim())) {
      setError('Please provide justification for all requested parts');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Submit to parts-request Edge Function
      const requestData = {
        site_id: 'dfca581b-5590-4845-9b05-8d90f59037c9', // TOCA test site
        equipment_id: partsRequest.equipmentId,
        equipment_name: partsRequest.equipmentName,
        requested_by: partsRequest.submittedBy,
        maintenance_context: partsRequest.maintenanceContext,
        chat_session_id: chatSessionData?.sessionId,
        parts_requests: partsRequest.requests.map(request => {
          const part = availableParts.find(p => p.id === request.part_item_id);
          return {
            ...request,
            part_details: part,
            estimated_cost_gbp: request.estimated_total_cost
          };
        }),
        total_estimated_cost: partsRequest.totalEstimatedCost,
        requires_manager_approval: partsRequest.requiresManagerApproval,
        submitted_at: new Date().toISOString()
      };

      const { data, error } = await supabase.functions.invoke('parts-request', {
        body: requestData
      });

      if (error) throw error;

      // Navigate back with success message
      navigate('/maintenance/' + partsRequest.equipmentId, {
        state: {
          equipment,
          message: `Parts request submitted successfully! ${partsRequest.requiresManagerApproval ? 'Manager approval required.' : 'Processing order.'}`,
          partsRequestId: data?.request_id
        }
      });

    } catch (error) {
      console.error('Failed to submit parts request:', error);
      setError(error instanceof Error ? error.message : 'Failed to submit parts request');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    navigate('/maintenance/' + partsRequest.equipmentId, { 
      state: { equipment, maintenanceContext }
    });
  };

  const categories = [
    { value: 'all', label: 'All Parts', icon: Package },
    { value: 'wear_item', label: 'Wear Items', icon: Clock },
    { value: 'filter', label: 'Filters', icon: Shield },
    { value: 'seal', label: 'Seals', icon: Shield },
    { value: 'heating_element', label: 'Heating', icon: TrendingUp },
    { value: 'motor', label: 'Motors', icon: Package },
    { value: 'control', label: 'Controls', icon: FileText },
    { value: 'safety', label: 'Safety', icon: AlertTriangle },
    { value: 'accessory', label: 'Accessories', icon: Plus }
  ];

  const getPartQuantityInRequest = (partId: string): number => {
    const request = partsRequest.requests.find(r => r.part_item_id === partId);
    return request ? request.quantity : 0;
  };

  const getAvailabilityColor = (availability: string) => {
    switch (availability) {
      case 'in_stock': return 'text-green-400';
      case 'order_required': return 'text-yellow-400';
      case 'long_lead_time': return 'text-orange-400';
      case 'discontinued': return 'text-red-400';
      default: return 'text-slate-400';
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'routine': return 'bg-green-500/20 text-green-200';
      case 'maintenance': return 'bg-blue-500/20 text-blue-200';
      case 'critical': return 'bg-orange-500/20 text-orange-200';
      case 'emergency': return 'bg-red-500/20 text-red-200';
      default: return 'bg-slate-500/20 text-slate-200';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-300">Loading parts catalog...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800">
      {/* Header */}
      <div className="bg-slate-800/30 border-b border-slate-600/30 px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={handleBack}
              className="p-2 rounded-lg bg-slate-700/50 border border-slate-600 hover:bg-slate-600/50 transition-colors"
            >
              <ArrowLeft className="h-5 w-5 text-slate-300" />
            </button>
            <div>
              <h1 className="text-xl font-semibold text-white">Equipment Parts</h1>
              <p className="text-sm text-slate-400">
                {partsRequest.equipmentName} • {filteredParts.length} parts available
              </p>
            </div>
          </div>
          
          {/* Shopping Cart Summary */}
          {partsRequest.requests.length > 0 && (
            <div className="flex items-center space-x-2">
              <div className="bg-blue-500/20 border border-blue-500/30 rounded-lg px-3 py-2">
                <div className="flex items-center space-x-2 text-blue-200">
                  <ShoppingCart className="h-4 w-4" />
                  <span className="text-sm font-medium">
                    {partsRequest.requests.length} items • £{partsRequest.totalEstimatedCost.toFixed(2)}
                  </span>
                </div>
              </div>
              {partsRequest.requiresManagerApproval && (
                <div className="bg-orange-500/20 border border-orange-500/30 rounded-lg px-2 py-1">
                  <span className="text-xs text-orange-200">Manager Approval Required</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Search and Filter */}
        <div className="bg-slate-800/30 border border-slate-600/30 rounded-xl p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search parts, symptoms, or part numbers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {categories.map(category => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Parts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredParts.map((part) => {
            const quantityInRequest = getPartQuantityInRequest(part.id);
            return (
              <div key={part.id} className="bg-slate-800/30 border border-slate-600/30 rounded-xl p-4 hover:bg-slate-700/30 transition-colors">
                {/* Part Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <h3 className="font-medium text-white">{part.part_name}</h3>
                      <span className={`text-xs px-2 py-1 rounded ${getUrgencyColor(part.urgency_level)}`}>
                        {part.urgency_level.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-sm text-slate-400 mb-1">{part.part_number}</p>
                    <p className="text-sm text-slate-300">{part.description}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold text-white">£{part.estimated_cost_gbp.toFixed(2)}</p>
                    <p className={`text-xs ${getAvailabilityColor(part.availability)}`}>
                      {part.availability.replace('_', ' ')}
                    </p>
                  </div>
                </div>

                {/* Part Details */}
                <div className="grid grid-cols-2 gap-3 mb-3 text-xs">
                  <div>
                    <p className="text-slate-400">Supplier</p>
                    <p className="text-slate-300">{part.supplier_name}</p>
                  </div>
                  <div>
                    <p className="text-slate-400">Installation</p>
                    <p className="text-slate-300">{part.installation_difficulty.replace('_', ' ')}</p>
                  </div>
                  <div>
                    <p className="text-slate-400">Category</p>
                    <p className="text-slate-300">{part.category.replace('_', ' ')}</p>
                  </div>
                  <div>
                    <p className="text-slate-400">Est. Time</p>
                    <p className="text-slate-300">{part.installation_time_minutes || 0}min</p>
                  </div>
                </div>

                {/* Common Symptoms */}
                {part.common_failure_symptoms && part.common_failure_symptoms.length > 0 && (
                  <div className="mb-3">
                    <p className="text-xs text-slate-400 mb-1">Common symptoms:</p>
                    <div className="flex flex-wrap gap-1">
                      {part.common_failure_symptoms.slice(0, 2).map((symptom, index) => (
                        <span key={index} className="text-xs bg-slate-700/50 text-slate-300 px-2 py-1 rounded">
                          {symptom}
                        </span>
                      ))}
                      {part.common_failure_symptoms.length > 2 && (
                        <span className="text-xs text-slate-400">+{part.common_failure_symptoms.length - 2} more</span>
                      )}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {part.image_url && (
                      <button
                        onClick={() => setShowVisualId(showVisualId === part.id ? null : part.id)}
                        className="p-1 rounded bg-slate-700/50 hover:bg-slate-600/50 transition-colors"
                      >
                        <Eye className="h-4 w-4 text-slate-300" />
                      </button>
                    )}
                    {part.installation_difficulty === 'professional_required' && (
                      <AlertTriangle className="h-4 w-4 text-orange-400" aria-label="Professional installation required" />
                    )}
                  </div>

                  {/* Quantity Controls */}
                  {quantityInRequest > 0 ? (
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => updatePartQuantity(part.id, -1)}
                        className="w-8 h-8 rounded-full bg-red-500/20 border border-red-500/30 text-red-200 hover:bg-red-500/30 transition-colors flex items-center justify-center"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <span className="text-white font-medium w-8 text-center">{quantityInRequest}</span>
                      <button
                        onClick={() => updatePartQuantity(part.id, 1)}
                        className="w-8 h-8 rounded-full bg-green-500/20 border border-green-500/30 text-green-200 hover:bg-green-500/30 transition-colors flex items-center justify-center"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => addPartToRequest(part)}
                      disabled={part.availability === 'discontinued'}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors flex items-center space-x-2"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Add</span>
                    </button>
                  )}
                </div>

                {/* Visual ID Panel */}
                {showVisualId === part.id && part.image_url && (
                  <div className="mt-3 pt-3 border-t border-slate-600/30">
                    <div className="bg-slate-700/30 rounded-lg p-3">
                      <p className="text-xs text-slate-400 mb-2">Visual identification:</p>
                      <img 
                        src={part.image_url} 
                        alt={part.part_name}
                        className="w-full h-32 object-cover rounded border border-slate-600"
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Parts Request Summary */}
        {partsRequest.requests.length > 0 && (
          <div className="bg-slate-800/30 border border-slate-600/30 rounded-xl p-4">
            <h3 className="font-medium text-white mb-4 flex items-center space-x-2">
              <ShoppingCart className="h-5 w-5" />
              <span>Parts Request ({partsRequest.requests.length} items)</span>
            </h3>

            <div className="space-y-3 mb-4">
              {partsRequest.requests.map((request) => {
                const part = availableParts.find(p => p.id === request.part_item_id);
                if (!part) return null;

                return (
                  <div key={request.part_item_id} className="bg-slate-700/30 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="text-white font-medium">{part.part_name}</p>
                        <p className="text-sm text-slate-400">{part.part_number}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-white">Qty: {request.quantity}</p>
                        <p className="text-slate-300">£{request.estimated_total_cost.toFixed(2)}</p>
                      </div>
                    </div>
                    <textarea
                      value={request.justification}
                      onChange={(e) => updateRequestJustification(request.part_item_id, e.target.value)}
                      placeholder="Justification for this part request..."
                      className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded text-white placeholder-slate-400 text-sm"
                      rows={2}
                    />
                  </div>
                );
              })}
            </div>

            {/* Staff Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-white font-medium mb-2">
                  Requested By <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={partsRequest.submittedBy}
                  onChange={(e) => setPartsRequest(prev => ({ ...prev, submittedBy: e.target.value }))}
                  placeholder="Your name"
                  className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400"
                />
              </div>
              <div>
                <label className="block text-white font-medium mb-2">Total Cost</label>
                <div className="flex items-center space-x-2">
                  <span className="text-2xl font-bold text-white">£{partsRequest.totalEstimatedCost.toFixed(2)}</span>
                  {partsRequest.requiresManagerApproval && (
                    <span className="text-xs bg-orange-500/20 text-orange-200 px-2 py-1 rounded">
                      Manager approval required
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Submit Button */}
            {error && (
              <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-3 mb-4">
                <p className="text-red-200 text-sm">{error}</p>
              </div>
            )}

            <button
              onClick={submitPartsRequest}
              disabled={isSubmitting || partsRequest.requests.length === 0 || !partsRequest.submittedBy}
              className="w-full bg-green-600 hover:bg-green-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Submitting Request...</span>
                </>
              ) : (
                <>
                  <CheckCircle className="h-5 w-5" />
                  <span>Submit Parts Request</span>
                </>
              )}
            </button>

            <p className="text-xs text-slate-400 text-center mt-2">
              {partsRequest.requiresManagerApproval 
                ? 'Your manager will review and approve this request before ordering.'
                : 'Parts will be ordered automatically upon submission.'
              }
            </p>
          </div>
        )}

        {/* Empty State */}
        {filteredParts.length === 0 && !isLoading && (
          <div className="text-center py-12">
            <Package className="h-12 w-12 text-slate-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-300 mb-2">No parts found</h3>
            <p className="text-slate-400">
              {searchTerm || selectedCategory !== 'all' 
                ? 'Try adjusting your search or filter criteria'
                : 'No parts catalog available for this equipment'
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PartsList;