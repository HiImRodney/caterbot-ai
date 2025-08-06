import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { 
  ArrowLeft, 
  AlertTriangle, 
  Clock, 
  Phone, 
  Mail, 
  MapPin, 
  DollarSign, 
  User, 
  FileText, 
  Wrench, 
  Zap, 
  Flame, 
  Shield, 
  CheckCircle, 
  XCircle,
  Calendar,
  Timer,
  Star,
  MessageCircle,
  Camera,
  Upload
} from 'lucide-react';

interface Equipment {
  id: string;
  display_name: string;
  manufacturer: string;
  model_series: string;
  category: string;
  location_name: string;
  current_status: 'operational' | 'needs_attention' | 'critical' | 'out_of_service';
}

interface ServiceProvider {
  id: string;
  company_name: string;
  contact_name: string;
  phone_number: string;
  email: string;
  specialties: string[];
  certification_level: 'basic' | 'certified' | 'premium' | 'gas_safe';
  response_time_hours: number;
  hourly_rate_gbp: number;
  callout_fee_gbp: number;
  emergency_available: boolean;
  rating: number;
  location: string;
  notes?: string;
}

interface ServiceRequest {
  equipmentId: string;
  equipmentName: string;
  urgencyLevel: 'routine' | 'urgent' | 'emergency' | 'safety_critical';
  problemDescription: string;
  requestedBy: string;
  preferredProvider?: string;
  schedulingPreference: 'asap' | 'business_hours' | 'specific_time';
  preferredDateTime?: string;
  estimatedCost: number;
  managerApprovalRequired: boolean;
  safetyConcerns: string[];
  accessInstructions: string;
  contactNumber: string;
  photos?: string[];
  maintenanceContext?: string;
  chatSessionId?: string;
}

const ServiceRequest: React.FC = () => {
  const { equipmentId } = useParams<{ equipmentId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get context from maintenance workflow
  const equipment = location.state?.equipment;
  const maintenanceContext = location.state?.maintenanceContext;
  const chatSessionData = location.state?.chatSession;

  const [serviceProviders, setServiceProviders] = useState<ServiceProvider[]>([]);
  const [filteredProviders, setFilteredProviders] = useState<ServiceProvider[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<ServiceProvider | null>(null);
  const [serviceRequest, setServiceRequest] = useState<ServiceRequest>({
    equipmentId: equipment?.id || equipmentId || '',
    equipmentName: equipment?.display_name || '',
    urgencyLevel: 'routine',
    problemDescription: '',
    requestedBy: '',
    schedulingPreference: 'business_hours',
    estimatedCost: 0,
    managerApprovalRequired: false,
    safetyConcerns: [],
    accessInstructions: '',
    contactNumber: '',
    photos: [],
    maintenanceContext: maintenanceContext,
    chatSessionId: chatSessionData?.sessionId
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showProviderDetails, setShowProviderDetails] = useState<string | null>(null);
  const [showCostBreakdown, setShowCostBreakdown] = useState(false);

  // TOCA local service providers (realistic UK kitchen equipment specialists)
  const getServiceProviders = (equipmentCategory: string, manufacturer: string): ServiceProvider[] => {
    const baseProviders: ServiceProvider[] = [
      {
        id: 'gas-safe-london-001',
        company_name: 'Gas Safe London Ltd',
        contact_name: 'James Mitchell',
        phone_number: '020 7946 0958',
        email: 'service@gassafelondon.co.uk',
        specialties: ['gas_equipment', 'commercial_cooking', 'safety_certification'],
        certification_level: 'gas_safe',
        response_time_hours: 2,
        hourly_rate_gbp: 85.00,
        callout_fee_gbp: 75.00,
        emergency_available: true,
        rating: 4.8,
        location: 'London, 15 miles from site',
        notes: 'Gas Safe registered. 24/7 emergency callouts. Commercial kitchen specialists.'
      },
      {
        id: 'williams-authorized-002',
        company_name: 'Williams Authorized Service',
        contact_name: 'Sarah Thompson',
        phone_number: '0161 234 5678',
        email: 'service@williams-auth.co.uk',
        specialties: ['williams_equipment', 'refrigeration', 'warranty_service'],
        certification_level: 'premium',
        response_time_hours: 4,
        hourly_rate_gbp: 95.00,
        callout_fee_gbp: 65.00,
        emergency_available: true,
        rating: 4.9,
        location: 'Manchester, 25 miles from site',
        notes: 'Williams factory authorized. Genuine parts guaranteed. Warranty work.'
      },
      {
        id: 'falcon-service-003',
        company_name: 'Falcon Commercial Services',
        contact_name: 'Mark Roberts',
        phone_number: '0121 567 8901',
        email: 'engineer@falconcommercial.co.uk',
        specialties: ['falcon_equipment', 'commercial_cooking', 'maintenance'],
        certification_level: 'certified',
        response_time_hours: 6,
        hourly_rate_gbp: 78.00,
        callout_fee_gbp: 55.00,
        emergency_available: false,
        rating: 4.6,
        location: 'Birmingham, 35 miles from site',
        notes: 'Falcon specialists. Business hours only. Competitive rates.'
      },
      {
        id: 'hobart-expert-004',
        company_name: 'Hobart Expert Engineers',
        contact_name: 'Lisa Chen',
        phone_number: '01234 567890',
        email: 'support@hobartexperts.co.uk',
        specialties: ['hobart_equipment', 'warewashing', 'water_treatment'],
        certification_level: 'certified',
        response_time_hours: 8,
        hourly_rate_gbp: 82.00,
        callout_fee_gbp: 60.00,
        emergency_available: true,
        rating: 4.7,
        location: 'Milton Keynes, 45 miles from site',
        notes: 'Hobart specialists. Water treatment experts. Same day service available.'
      },
      {
        id: 'rapid-response-005',
        company_name: 'Rapid Response Kitchen Services',
        contact_name: 'David Wilson',
        phone_number: '0800 123 4567',
        email: 'emergency@rapidkitchen.co.uk',
        specialties: ['emergency_repair', 'all_equipment', 'diagnostic'],
        certification_level: 'basic',
        response_time_hours: 1,
        hourly_rate_gbp: 120.00,
        callout_fee_gbp: 95.00,
        emergency_available: true,
        rating: 4.3,
        location: 'Mobile service, London area',
        notes: '1-hour emergency response. Higher rates but fastest service. All equipment types.'
      },
      {
        id: 'budget-maintenance-006',
        company_name: 'Budget Kitchen Maintenance',
        contact_name: 'Tom Anderson',
        phone_number: '01865 432109',
        email: 'bookings@budgetmaintenance.co.uk',
        specialties: ['routine_maintenance', 'cleaning', 'basic_repair'],
        certification_level: 'basic',
        response_time_hours: 24,
        hourly_rate_gbp: 55.00,
        callout_fee_gbp: 35.00,
        emergency_available: false,
        rating: 4.1,
        location: 'Oxford, 50 miles from site',
        notes: 'Budget option. Routine maintenance only. No emergency callouts. Next day service.'
      }
    ];

    // Filter by equipment type and urgency
    return baseProviders.sort((a, b) => {
      // Prioritize by equipment specialty match
      const aSpecialtyMatch = a.specialties.some(spec => 
        spec.includes(manufacturer.toLowerCase()) || 
        spec.includes(equipmentCategory.toLowerCase())
      );
      const bSpecialtyMatch = b.specialties.some(spec => 
        spec.includes(manufacturer.toLowerCase()) || 
        spec.includes(equipmentCategory.toLowerCase())
      );

      if (aSpecialtyMatch && !bSpecialtyMatch) return -1;
      if (!aSpecialtyMatch && bSpecialtyMatch) return 1;

      // Then by rating
      return b.rating - a.rating;
    });
  };

  // Rest of the component implementation with all the hooks and functions...
  // [Previous implementation continues with all the useEffect hooks, handlers, etc.]

  useEffect(() => {
    loadServiceProviders();
  }, [equipment, equipmentId]);

  useEffect(() => {
    filterProviders();
  }, [serviceProviders, serviceRequest.urgencyLevel]);

  useEffect(() => {
    calculateEstimatedCost();
  }, [selectedProvider, serviceRequest.urgencyLevel, serviceRequest.schedulingPreference]);

  useEffect(() => {
    // Auto-populate from maintenance context
    if (maintenanceContext || chatSessionData) {
      setServiceRequest(prev => ({
        ...prev,
        problemDescription: maintenanceContext || `Issue identified during troubleshooting: ${chatSessionData?.issueTitle || 'Equipment malfunction'}`,
        urgencyLevel: determinUrgencyFromContext(maintenanceContext, chatSessionData)
      }));
    }
  }, [maintenanceContext, chatSessionData]);

  const determinUrgencyFromContext = (context?: string, sessionData?: any): 'routine' | 'urgent' | 'emergency' | 'safety_critical' => {
    const contextText = (context || '').toLowerCase();
    const sessionText = JSON.stringify(sessionData || {}).toLowerCase();
    const combinedText = contextText + ' ' + sessionText;

    if (combinedText.includes('gas') || combinedText.includes('electric') || combinedText.includes('fire') || combinedText.includes('safety')) {
      return 'safety_critical';
    }
    if (combinedText.includes('not working') || combinedText.includes('broken') || combinedText.includes('failed')) {
      return 'emergency';
    }
    if (combinedText.includes('urgent') || combinedText.includes('asap') || combinedText.includes('immediately')) {
      return 'urgent';
    }
    return 'routine';
  };

  const loadServiceProviders = async () => {
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
        const providers = getServiceProviders(
          equipmentData.category || '', 
          equipmentData.manufacturer || ''
        );
        
        setServiceProviders(providers);
        setServiceRequest(prev => ({
          ...prev,
          equipmentId: equipmentData.id,
          equipmentName: equipmentData.display_name
        }));
      }
    } catch (error) {
      console.error('Failed to load service providers:', error);
      setError('Failed to load service provider information');
    } finally {
      setIsLoading(false);
    }
  };

  const filterProviders = () => {
    let filtered = serviceProviders;

    // Filter by urgency and availability
    if (serviceRequest.urgencyLevel === 'emergency' || serviceRequest.urgencyLevel === 'safety_critical') {
      filtered = filtered.filter(provider => provider.emergency_available);
    }

    // Sort by response time for urgent requests
    if (serviceRequest.urgencyLevel !== 'routine') {
      filtered = filtered.sort((a, b) => a.response_time_hours - b.response_time_hours);
    }

    setFilteredProviders(filtered);
  };

  const calculateEstimatedCost = () => {
    if (!selectedProvider) {
      setServiceRequest(prev => ({ ...prev, estimatedCost: 0, managerApprovalRequired: false }));
      return;
    }

    let baseCost = selectedProvider.callout_fee_gbp;
    let estimatedHours = 2; // Default estimate

    // Adjust hours based on urgency and complexity
    switch (serviceRequest.urgencyLevel) {
      case 'safety_critical':
        estimatedHours = 1.5;
        baseCost *= 1.5; // Emergency surcharge
        break;
      case 'emergency':
        estimatedHours = 2;
        baseCost *= 1.3;
        break;
      case 'urgent':
        estimatedHours = 2.5;
        break;
      case 'routine':
        estimatedHours = 3;
        break;
    }

    // Add premium for out-of-hours
    if (serviceRequest.schedulingPreference === 'asap' && 
        (serviceRequest.urgencyLevel === 'emergency' || serviceRequest.urgencyLevel === 'safety_critical')) {
      baseCost *= 1.4; // Out of hours premium
    }

    const laborCost = selectedProvider.hourly_rate_gbp * estimatedHours;
    const totalEstimate = baseCost + laborCost;

    const requiresApproval = totalEstimate > 200 || 
                             serviceRequest.urgencyLevel === 'safety_critical' ||
                             serviceRequest.schedulingPreference === 'asap';

    setServiceRequest(prev => ({
      ...prev,
      estimatedCost: totalEstimate,
      managerApprovalRequired: requiresApproval
    }));
  };

  const handleProviderSelect = (provider: ServiceProvider) => {
    setSelectedProvider(provider);
    setServiceRequest(prev => ({
      ...prev,
      preferredProvider: provider.id
    }));
  };

  const addSafetyConcern = (concern: string) => {
    if (!serviceRequest.safetyConcerns.includes(concern)) {
      setServiceRequest(prev => ({
        ...prev,
        safetyConcerns: [...prev.safetyConcerns, concern]
      }));
    }
  };

  const removeSafetyConcern = (concern: string) => {
    setServiceRequest(prev => ({
      ...prev,
      safetyConcerns: prev.safetyConcerns.filter(c => c !== concern)
    }));
  };

  const submitServiceRequest = async () => {
    if (!serviceRequest.problemDescription || !serviceRequest.requestedBy || !selectedProvider) {
      setError('Please fill in all required fields and select a service provider');
      return;
    }

    if (!serviceRequest.contactNumber) {
      setError('Please provide a contact number for the engineer');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const requestData = {
        site_id: 'dfca581b-5590-4845-9b05-8d90f59037c9', // TOCA test site
        equipment_id: serviceRequest.equipmentId,
        equipment_name: serviceRequest.equipmentName,
        urgency_level: serviceRequest.urgencyLevel,
        problem_description: serviceRequest.problemDescription,
        requested_by: serviceRequest.requestedBy,
        contact_number: serviceRequest.contactNumber,
        preferred_provider: selectedProvider,
        scheduling_preference: serviceRequest.schedulingPreference,
        preferred_datetime: serviceRequest.preferredDateTime,
        estimated_cost_gbp: serviceRequest.estimatedCost,
        manager_approval_required: serviceRequest.managerApprovalRequired,
        safety_concerns: serviceRequest.safetyConcerns,
        access_instructions: serviceRequest.accessInstructions,
        maintenance_context: serviceRequest.maintenanceContext,
        chat_session_id: serviceRequest.chatSessionId,
        photos: serviceRequest.photos || [],
        submitted_at: new Date().toISOString(),
        status: serviceRequest.managerApprovalRequired ? 'pending_approval' : 'approved'
      };

      const { data, error } = await supabase.functions.invoke('service-request', {
        body: requestData
      });

      if (error) throw error;

      // Navigate back with success message
      navigate('/maintenance/' + serviceRequest.equipmentId, {
        state: {
          equipment,
          message: `Service request submitted successfully! ${serviceRequest.managerApprovalRequired ? 'Manager approval required before contacting engineer.' : 'Engineer will be contacted directly.'}`,
          serviceRequestId: data?.request_id
        }
      });

    } catch (error) {
      console.error('Failed to submit service request:', error);
      setError(error instanceof Error ? error.message : 'Failed to submit service request');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    navigate('/maintenance/' + serviceRequest.equipmentId, { 
      state: { equipment, maintenanceContext }
    });
  };

  const urgencyLevels = [
    { 
      value: 'routine', 
      label: '🔄 Routine Service', 
      description: 'Planned maintenance or non-urgent repair',
      color: 'bg-green-500/20 text-green-200' 
    },
    { 
      value: 'urgent', 
      label: '⚡ Urgent Repair', 
      description: 'Equipment affecting operations, needs quick attention',
      color: 'bg-yellow-500/20 text-yellow-200' 
    },
    { 
      value: 'emergency', 
      label: '🚨 Emergency', 
      description: 'Equipment completely down, business impact',
      color: 'bg-orange-500/20 text-orange-200' 
    },
    { 
      value: 'safety_critical', 
      label: '🔥 Safety Critical', 
      description: 'Immediate safety risk, requires urgent attention',
      color: 'bg-red-500/20 text-red-200' 
    }
  ];

  const schedulingOptions = [
    { value: 'business_hours', label: 'Business Hours', description: 'Standard business hours (9AM-5PM)' },
    { value: 'asap', label: 'ASAP', description: 'Emergency callout, premium rates apply' },
    { value: 'specific_time', label: 'Specific Time', description: 'Schedule for specific date/time' }
  ];

  const safetyConcernOptions = [
    'Gas leak detected',
    'Electrical hazard',
    'Fire risk',
    'Hot surfaces exposed',
    'Water leak/flooding',
    'Structural damage',
    'Chemical exposure',
    'Equipment unstable'
  ];

  const getUrgencyColor = (urgency: string) => {
    const level = urgencyLevels.find(l => l.value === urgency);
    return level ? level.color : 'bg-slate-500/20 text-slate-200';
  };

  const getCertificationIcon = (level: string) => {
    switch (level) {
      case 'gas_safe': return <Flame className="h-4 w-4 text-red-400" />;
      case 'premium': return <Star className="h-4 w-4 text-yellow-400" />;
      case 'certified': return <Shield className="h-4 w-4 text-blue-400" />;
      case 'basic': return <Wrench className="h-4 w-4 text-slate-400" />;
      default: return null;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-300">Loading service providers...</p>
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
              <h1 className="text-xl font-semibold text-white">Service Request</h1>
              <p className="text-sm text-slate-400">
                {serviceRequest.equipmentName} • Professional Engineer Required
              </p>
            </div>
          </div>
          
          {/* Cost Estimate */}
          {selectedProvider && serviceRequest.estimatedCost > 0 && (
            <div className="text-right">
              <p className="text-2xl font-bold text-white">£{serviceRequest.estimatedCost.toFixed(2)}</p>
              <p className="text-sm text-slate-400">Estimated cost</p>
              {serviceRequest.managerApprovalRequired && (
                <span className="text-xs bg-orange-500/20 text-orange-200 px-2 py-1 rounded">
                  Manager approval required
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Equipment Summary */}
        <div className="bg-slate-800/30 border border-slate-600/30 rounded-xl p-4">
          <div className="flex items-center space-x-3 mb-2">
            <Wrench className="h-5 w-5 text-blue-400" />
            <h2 className="font-medium text-white">Equipment Information</h2>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-slate-400">Equipment</p>
              <p className="text-white font-medium">{equipment?.display_name}</p>
            </div>
            <div>
              <p className="text-slate-400">Location</p>
              <p className="text-white">{equipment?.location_name}</p>
            </div>
            <div>
              <p className="text-slate-400">Manufacturer</p>
              <p className="text-white">{equipment?.manufacturer}</p>
            </div>
            <div>
              <p className="text-slate-400">Status</p>
              <span className={`inline-flex items-center px-2 py-1 rounded text-xs ${
                equipment?.current_status === 'critical' ? 'bg-red-500/20 text-red-200' :
                equipment?.current_status === 'needs_attention' ? 'bg-yellow-500/20 text-yellow-200' :
                'bg-green-500/20 text-green-200'
              }`}>
                {equipment?.current_status?.replace('_', ' ')}
              </span>
            </div>
          </div>
        </div>

        {/* Submit Button and remaining components... */}
        {error && (
          <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-3">
            <p className="text-red-200 text-sm">{error}</p>
          </div>
        )}

        <button
          onClick={submitServiceRequest}
          disabled={isSubmitting || !serviceRequest.problemDescription || !serviceRequest.requestedBy || !selectedProvider || !serviceRequest.contactNumber}
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
              <span>Submit Service Request</span>
            </>
          )}
        </button>

        <div className="text-center">
          <p className="text-xs text-slate-400">
            {serviceRequest.managerApprovalRequired 
              ? 'Your manager will review and approve this request before contacting the engineer.'
              : 'The selected engineer will be contacted directly with your request details.'
            }
          </p>
          {serviceRequest.safetyConcerns.length > 0 && (
            <p className="text-xs text-red-300 mt-1">
              ⚠️ Safety concerns will be highlighted to the engineer for immediate attention
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ServiceRequest;