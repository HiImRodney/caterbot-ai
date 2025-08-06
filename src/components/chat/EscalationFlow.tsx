import React, { useState } from 'react';
import { Phone, User, Clock, AlertCircle, CheckCircle, MessageCircle, ExternalLink } from 'lucide-react';

interface ProfessionalContact {
  id: string;
  role: 'gas_safe_engineer' | 'electrician' | 'refrigeration_engineer' | 'general_technician' | 'emergency_services';
  name: string;
  company: string;
  phone: string;
  email?: string;
  certification: string;
  available_hours: string;
  is_emergency_contact: boolean;
  specialties: string[];
  response_time_estimate: string;
  coverage_areas: string[];
  rating: number;
  last_contacted?: Date;
  notes?: string;
}

interface EscalationFlowProps {
  equipmentName: string;
  issueType: string;
  issueSeverity: 'low' | 'medium' | 'high' | 'critical';
  onContactSelected: (contact: ProfessionalContact) => void;
  onEscalationLogged: (escalationType: string, contactId: string) => void;
  className?: string;
}

const EscalationFlow: React.FC<EscalationFlowProps> = ({
  equipmentName,
  issueType,
  issueSeverity,
  onContactSelected,
  onEscalationLogged,
  className = '',
}) => {
  const [selectedContact, setSelectedContact] = useState<ProfessionalContact | null>(null);
  const [showContactDetails, setShowContactDetails] = useState(false);
  const [escalationNotes, setEscalationNotes] = useState('');
  const [isContacting, setIsContacting] = useState(false);

  // Professional contacts database (would come from Supabase in real implementation)
  const professionalContacts: ProfessionalContact[] = [
    {
      id: 'gas-1',
      role: 'gas_safe_engineer',
      name: 'Emergency Gas Services Ltd',
      company: 'Gas Safe Emergency Response',
      phone: '0800 111 999',
      email: 'emergency@gassafe.co.uk',
      certification: 'Gas Safe Registered #123456',
      available_hours: '24/7 Emergency Service',
      is_emergency_contact: true,
      specialties: ['Commercial gas appliances', 'Emergency leak response', 'Safety inspections'],
      response_time_estimate: '30-60 minutes',
      coverage_areas: ['Greater London', 'Home Counties'],
      rating: 4.9,
      notes: 'Preferred emergency gas contractor with 24/7 response guarantee',
    },
    {
      id: 'electrical-1',
      name: 'Commercial Electrical Solutions',
      company: 'CES Emergency Services',
      role: 'electrician',
      phone: '0800 123 456',
      email: 'emergency@ces-electrical.co.uk',
      certification: 'NICEIC Approved #ELE789',
      available_hours: '24/7 for emergencies, 8AM-6PM standard',
      is_emergency_contact: true,
      specialties: ['Commercial kitchen electrical', 'Emergency repairs', 'Safety testing'],
      response_time_estimate: '45-90 minutes',
      coverage_areas: ['London', 'Surrey', 'Essex'],
      rating: 4.7,
      notes: 'Specializes in commercial kitchen electrical systems',
    },
    {
      id: 'refrigeration-1',
      name: 'CoolTech Refrigeration Services',
      company: 'CoolTech Engineering',
      role: 'refrigeration_engineer',
      phone: '0207 456 789',
      email: 'service@cooltech-eng.co.uk',
      certification: 'F-Gas Certified #REF456',
      available_hours: '8AM-8PM Mon-Fri, 9AM-5PM Weekends',
      is_emergency_contact: false,
      specialties: ['Commercial refrigeration', 'Walk-in coolers', 'Precision temperature control'],
      response_time_estimate: '2-4 hours same day',
      coverage_areas: ['Central London', 'North London'],
      rating: 4.8,
      notes: 'Excellent for Precision and Williams equipment repairs',
    },
    {
      id: 'general-1',
      name: 'Kitchen Equipment Specialists',
      company: 'KES Maintenance',
      role: 'general_technician',
      phone: '0207 789 123',
      email: 'bookings@kes-maintenance.co.uk',
      certification: 'Multi-trade certified technician',
      available_hours: '7AM-7PM Mon-Sat',
      is_emergency_contact: false,
      specialties: ['General equipment maintenance', 'Preventive service', 'Warranty repairs'],
      response_time_estimate: 'Same day or next day',
      coverage_areas: ['London', 'Surrounding areas'],
      rating: 4.5,
      notes: 'Good for non-emergency repairs and maintenance',
    },
  ];

  const getRecommendedContacts = () => {
    // Filter contacts based on issue type and severity
    let recommended = professionalContacts;

    // Filter by issue type
    if (issueType.includes('gas')) {
      recommended = recommended.filter(c => c.role === 'gas_safe_engineer');
    } else if (issueType.includes('electrical')) {
      recommended = recommended.filter(c => c.role === 'electrician');
    } else if (issueType.includes('refrigeration') || issueType.includes('temperature')) {
      recommended = recommended.filter(c => c.role === 'refrigeration_engineer');
    }

    // For critical issues, prioritize emergency contacts
    if (issueSeverity === 'critical') {
      recommended = recommended.filter(c => c.is_emergency_contact);
    }

    // Sort by rating and emergency availability
    return recommended.sort((a, b) => {
      if (a.is_emergency_contact && !b.is_emergency_contact) return -1;
      if (!a.is_emergency_contact && b.is_emergency_contact) return 1;
      return b.rating - a.rating;
    });
  };

  const getSeverityConfig = (severity: string) => {
    switch (severity) {
      case 'critical':
        return {
          color: 'text-red-600 bg-red-50 border-red-200',
          message: 'Critical issue requiring immediate professional attention',
          urgency: 'IMMEDIATE RESPONSE REQUIRED',
        };
      case 'high':
        return {
          color: 'text-orange-600 bg-orange-50 border-orange-200',
          message: 'High priority issue - professional service recommended',
          urgency: 'SAME DAY RESPONSE PREFERRED',
        };
      case 'medium':
        return {
          color: 'text-yellow-600 bg-yellow-50 border-yellow-200',
          message: 'Medium priority - schedule professional service',
          urgency: 'RESPONSE WITHIN 24-48 HOURS',
        };
      default:
        return {
          color: 'text-blue-600 bg-blue-50 border-blue-200',
          message: 'Standard issue - professional service when convenient',
          urgency: 'RESPONSE WITHIN WEEK',
        };
    }
  };

  const handleContactSelection = async (contact: ProfessionalContact) => {
    setSelectedContact(contact);
    setShowContactDetails(true);
  };

  const handleInitiateContact = async (contact: ProfessionalContact, method: 'phone' | 'email') => {
    setIsContacting(true);
    
    try {
      // Log the escalation in our database
      await onEscalationLogged('professional_contact', contact.id);
      
      // Initiate contact
      if (method === 'phone') {
        window.location.href = `tel:${contact.phone}`;
      } else if (method === 'email' && contact.email) {
        const subject = encodeURIComponent(`Equipment Issue - ${equipmentName}`);
        const body = encodeURIComponent(
          `Hello,\n\nWe have an issue with our ${equipmentName}.\n\nIssue Type: ${issueType}\nSeverity: ${issueSeverity}\n\nAdditional Notes:\n${escalationNotes}\n\nPlease contact us to arrange service.\n\nThank you.`
        );
        window.location.href = `mailto:${contact.email}?subject=${subject}&body=${body}`;
      }
      
      // Notify parent component
      onContactSelected(contact);
    } finally {
      setIsContacting(false);
    }
  };

  const severityConfig = getSeverityConfig(issueSeverity);
  const recommendedContacts = getRecommendedContacts();

  return (
    <div className={`bg-white border border-gray-200 rounded-lg shadow-sm ${className}`}>
      {/* Header */}
      <div className={`p-4 border-b border-gray-200 ${severityConfig.color}`}>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold flex items-center">
              <AlertCircle className="w-5 h-5 mr-2" />
              Professional Service Required
            </h3>
            <p className="text-sm mt-1">{severityConfig.message}</p>
          </div>
          <div className="text-right">
            <div className="text-xs font-medium">{severityConfig.urgency}</div>
            <div className="text-xs opacity-75 mt-1">
              {recommendedContacts.length} contacts available
            </div>
          </div>
        </div>
      </div>

      {/* Equipment and Issue Summary */}
      <div className="p-4 bg-gray-50">
        <h4 className="font-medium text-gray-900 mb-2">Issue Summary</h4>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Equipment:</span>
            <p className="text-gray-900 font-medium">{equipmentName}</p>
          </div>
          <div>
            <span className="text-gray-600">Issue Type:</span>
            <p className="text-gray-900 font-medium">{issueType}</p>
          </div>
        </div>
      </div>

      {/* Recommended Contacts */}
      <div className="p-4">
        <h4 className="font-medium text-gray-900 mb-4 flex items-center">
          <User className="w-4 h-4 mr-2" />
          Recommended Professional Contacts
        </h4>
        
        <div className="space-y-3">
          {recommendedContacts.map((contact) => (
            <div
              key={contact.id}
              className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <h5 className="font-semibold text-gray-900">{contact.name}</h5>
                    {contact.is_emergency_contact && (
                      <span className="bg-red-100 text-red-600 text-xs font-medium px-2 py-1 rounded">
                        24/7 Emergency
                      </span>
                    )}
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-2">{contact.company}</p>
                  
                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-500 mb-2">
                    <div>
                      <span className="font-medium">Certification:</span>
                      <p>{contact.certification}</p>
                    </div>
                    <div>
                      <span className="font-medium">Response Time:</span>
                      <p>{contact.response_time_estimate}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4 text-xs text-gray-500">
                    <div className="flex items-center">
                      <Clock className="w-3 h-3 mr-1" />
                      {contact.available_hours}
                    </div>
                    <div className="flex items-center">
                      ⭐ {contact.rating}/5
                    </div>
                  </div>
                </div>
                
                <div className="ml-4 space-y-2">
                  <button
                    onClick={() => handleInitiateContact(contact, 'phone')}
                    disabled={isContacting}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 px-3 rounded transition-colors flex items-center justify-center disabled:opacity-50"
                  >
                    <Phone className="w-4 h-4 mr-1" />
                    Call Now
                  </button>
                  
                  {contact.email && (
                    <button
                      onClick={() => handleInitiateContact(contact, 'email')}
                      disabled={isContacting}
                      className="w-full bg-gray-500 hover:bg-gray-600 text-white text-sm font-medium py-2 px-3 rounded transition-colors flex items-center justify-center disabled:opacity-50"
                    >
                      <MessageCircle className="w-4 h-4 mr-1" />
                      Email
                    </button>
                  )}
                  
                  <button
                    onClick={() => handleContactSelection(contact)}
                    className="w-full text-blue-600 hover:text-blue-700 text-sm font-medium py-1 px-3 rounded transition-colors"
                  >
                    View Details
                  </button>
                </div>
              </div>
              
              {/* Specialties */}
              <div className="mt-2 flex flex-wrap gap-1">
                {contact.specialties.slice(0, 3).map((specialty, index) => (
                  <span
                    key={index}
                    className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded"
                  >
                    {specialty}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Additional Notes */}
      <div className="p-4 border-t border-gray-200">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Additional Notes for Professional (Optional)
        </label>
        <textarea
          value={escalationNotes}
          onChange={(e) => setEscalationNotes(e.target.value)}
          placeholder="Add any additional details about the issue that would help the professional..."
          className="w-full border border-gray-300 rounded-lg p-3 text-sm"
          rows={3}
        />
      </div>

      {/* Contact Details Modal */}
      {showContactDetails && selectedContact && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-2xl max-w-md w-full max-h-screen overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Contact Details</h3>
                <button
                  onClick={() => setShowContactDetails(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  ✕
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-gray-900">{selectedContact.name}</h4>
                  <p className="text-gray-600">{selectedContact.company}</p>
                </div>
                
                <div className="grid grid-cols-1 gap-3 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">Phone:</span>
                    <p className="text-gray-900">{selectedContact.phone}</p>
                  </div>
                  
                  {selectedContact.email && (
                    <div>
                      <span className="font-medium text-gray-700">Email:</span>
                      <p className="text-gray-900">{selectedContact.email}</p>
                    </div>
                  )}
                  
                  <div>
                    <span className="font-medium text-gray-700">Certification:</span>
                    <p className="text-gray-900">{selectedContact.certification}</p>
                  </div>
                  
                  <div>
                    <span className="font-medium text-gray-700">Available Hours:</span>
                    <p className="text-gray-900">{selectedContact.available_hours}</p>
                  </div>
                  
                  <div>
                    <span className="font-medium text-gray-700">Response Time:</span>
                    <p className="text-gray-900">{selectedContact.response_time_estimate}</p>
                  </div>
                  
                  <div>
                    <span className="font-medium text-gray-700">Coverage Areas:</span>
                    <p className="text-gray-900">{selectedContact.coverage_areas.join(', ')}</p>
                  </div>
                </div>
                
                <div>
                  <span className="font-medium text-gray-700">Specialties:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {selectedContact.specialties.map((specialty, index) => (
                      <span
                        key={index}
                        className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded"
                      >
                        {specialty}
                      </span>
                    ))}
                  </div>
                </div>
                
                {selectedContact.notes && (
                  <div>
                    <span className="font-medium text-gray-700">Notes:</span>
                    <p className="text-gray-900 text-sm">{selectedContact.notes}</p>
                  </div>
                )}
                
                <div className="flex space-x-3 pt-4">
                  <button
                    onClick={() => handleInitiateContact(selectedContact, 'phone')}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded transition-colors flex items-center justify-center"
                  >
                    <Phone className="w-4 h-4 mr-2" />
                    Call Now
                  </button>
                  
                  {selectedContact.email && (
                    <button
                      onClick={() => handleInitiateContact(selectedContact, 'email')}
                      className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded transition-colors flex items-center justify-center"
                    >
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Email
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EscalationFlow;