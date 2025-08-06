import React from 'react';
import { AlertTriangle, Phone, Shield, AlertCircle, X } from 'lucide-react';

interface SafetyAlert {
  id: string;
  type: 'gas_leak' | 'electrical' | 'fire_safety' | 'water_emergency' | 'general_safety';
  severity: 'critical' | 'high' | 'medium';
  title: string;
  message: string;
  immediateActions: string[];
  professionalContacts: Array<{
    role: string;
    name: string;
    phone: string;
    available: string;
  }>;
  emergencyServices?: {
    number: string;
    label: string;
  };
  doNotActions?: string[];
  timestamp: Date;
}

interface SafetyAlertProps {
  alert: SafetyAlert;
  onClose: () => void;
  onContactCalled: (contactType: string) => void;
  onActionConfirmed: (action: string) => void;
}

const SafetyAlert: React.FC<SafetyAlertProps> = ({
  alert,
  onClose,
  onContactCalled,
  onActionConfirmed,
}) => {
  const getSeverityColors = (severity: string) => {
    switch (severity) {
      case 'critical':
        return {
          bg: 'bg-red-50 border-red-200',
          header: 'bg-red-600',
          text: 'text-red-900',
          accent: 'text-red-600',
          button: 'bg-red-600 hover:bg-red-700',
        };
      case 'high':
        return {
          bg: 'bg-orange-50 border-orange-200',
          header: 'bg-orange-600',
          text: 'text-orange-900',
          accent: 'text-orange-600',
          button: 'bg-orange-600 hover:bg-orange-700',
        };
      default:
        return {
          bg: 'bg-yellow-50 border-yellow-200',
          header: 'bg-yellow-600',
          text: 'text-yellow-900',
          accent: 'text-yellow-600',
          button: 'bg-yellow-600 hover:bg-yellow-700',
        };
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'gas_leak':
        return '⛽';
      case 'electrical':
        return '⚡';
      case 'fire_safety':
        return '🔥';
      case 'water_emergency':
        return '💧';
      default:
        return '⚠️';
    }
  };

  const colors = getSeverityColors(alert.severity);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className={`max-w-lg w-full ${colors.bg} border-2 rounded-lg shadow-2xl overflow-hidden animate-pulse`}>
        {/* Alert Header */}
        <div className={`${colors.header} text-white p-4 flex items-center justify-between`}>
          <div className="flex items-center space-x-3">
            <div className="text-3xl">{getAlertIcon(alert.type)}</div>
            <div>
              <h2 className="text-xl font-bold flex items-center">
                <Shield className="w-6 h-6 mr-2" />
                SAFETY ALERT
              </h2>
              <p className="text-sm opacity-90">{alert.severity.toUpperCase()} PRIORITY</p>
            </div>
          </div>
          {alert.severity !== 'critical' && (
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          )}
        </div>

        {/* Alert Content */}
        <div className="p-6 space-y-6">
          {/* Alert Title and Message */}
          <div>
            <h3 className={`text-lg font-bold ${colors.text} mb-2`}>{alert.title}</h3>
            <p className={`${colors.text} leading-relaxed`}>{alert.message}</p>
          </div>

          {/* Emergency Services (if critical) */}
          {alert.emergencyServices && alert.severity === 'critical' && (
            <div className="bg-red-100 border border-red-300 rounded-lg p-4">
              <h4 className="font-bold text-red-900 mb-2 flex items-center">
                <AlertTriangle className="w-5 h-5 mr-2" />
                CALL EMERGENCY SERVICES NOW
              </h4>
              <button
                onClick={() => {
                  window.location.href = `tel:${alert.emergencyServices?.number}`;
                  onContactCalled('emergency');
                }}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded-lg transition-colors flex items-center justify-center"
              >
                <Phone className="w-5 h-5 mr-2" />
                {alert.emergencyServices.label}: {alert.emergencyServices.number}
              </button>
            </div>
          )}

          {/* Immediate Actions */}
          <div>
            <h4 className={`font-bold ${colors.text} mb-3 flex items-center`}>
              <AlertCircle className="w-5 h-5 mr-2" />
              IMMEDIATE ACTIONS REQUIRED:
            </h4>
            <div className="space-y-2">
              {alert.immediateActions.map((action, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <span className={`${colors.accent} font-bold text-lg mt-1`}>
                    {index + 1}.
                  </span>
                  <span className={`${colors.text} flex-1`}>{action}</span>
                  <button
                    onClick={() => onActionConfirmed(action)}
                    className="text-green-600 hover:text-green-700 transition-colors"
                    title="Mark as completed"
                  >
                    ✅
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Do NOT Actions */}
          {alert.doNotActions && alert.doNotActions.length > 0 && (
            <div className="bg-gray-100 border border-gray-300 rounded-lg p-4">
              <h4 className="font-bold text-gray-900 mb-2 flex items-center">
                <X className="w-5 h-5 mr-2 text-red-600" />
                DO NOT:
              </h4>
              <ul className="space-y-1">
                {alert.doNotActions.map((action, index) => (
                  <li key={index} className="flex items-start space-x-2">
                    <span className="text-red-600 font-bold">✗</span>
                    <span className="text-gray-800">{action}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Professional Contacts */}
          <div>
            <h4 className={`font-bold ${colors.text} mb-3 flex items-center`}>
              <Phone className="w-5 h-5 mr-2" />
              PROFESSIONAL CONTACTS:
            </h4>
            <div className="space-y-3">
              {alert.professionalContacts.map((contact, index) => (
                <div key={index} className="bg-white border border-gray-200 rounded-lg p-3">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h5 className="font-semibold text-gray-900">{contact.role}</h5>
                      <p className="text-sm text-gray-600">{contact.name}</p>
                      <p className="text-xs text-gray-500">{contact.available}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      window.location.href = `tel:${contact.phone}`;
                      onContactCalled(contact.role.toLowerCase());
                    }}
                    className={`w-full ${colors.button} text-white font-semibold py-2 px-4 rounded transition-colors flex items-center justify-center`}
                  >
                    <Phone className="w-4 h-4 mr-2" />
                    Call: {contact.phone}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Safety Protocol Footer */}
          <div className="text-center pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              Safety is our top priority. When in doubt, always escalate to professionals.
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Alert generated: {alert.timestamp.toLocaleTimeString()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Safety Alert Generator Functions
export const createGasLeakAlert = (equipmentName: string): SafetyAlert => ({
  id: `gas-${Date.now()}`,
  type: 'gas_leak',
  severity: 'critical',
  title: 'GAS LEAK DETECTED',
  message: `Potential gas leak detected with ${equipmentName}. This is a life-threatening emergency requiring immediate action.`,
  immediateActions: [
    'Turn off all gas equipment immediately',
    'Open windows and doors for ventilation',
    'Do not use electrical switches or create sparks',
    'Evacuate the area immediately',
    'Call emergency services from outside the building',
  ],
  emergencyServices: {
    number: '999',
    label: 'Emergency Services',
  },
  professionalContacts: [
    {
      role: 'Gas Safe Engineer',
      name: 'Emergency Gas Services',
      phone: '0800 111 999',
      available: '24/7 Emergency',
    },
    {
      role: 'Site Manager',
      name: 'Emergency Contact',
      phone: '07123 456789',
      available: '24/7',
    },
  ],
  doNotActions: [
    'Use electrical switches',
    'Light matches or create any sparks',
    'Enter the building until cleared by professionals',
    'Attempt any repairs yourself',
  ],
  timestamp: new Date(),
});

export const createElectricalAlert = (equipmentName: string): SafetyAlert => ({
  id: `electrical-${Date.now()}`,
  type: 'electrical',
  severity: 'critical',
  title: 'ELECTRICAL SAFETY EMERGENCY',
  message: `Electrical safety issue detected with ${equipmentName}. Risk of electrocution or fire.`,
  immediateActions: [
    'Turn off power at the main breaker if safe to access',
    'Do not touch the equipment',
    'Keep the area clear of all personnel',
    'Contact a qualified electrician immediately',
  ],
  professionalContacts: [
    {
      role: 'Qualified Electrician',
      name: 'Emergency Electrical Services',
      phone: '0800 123 456',
      available: '24/7 Emergency',
    },
    {
      role: 'Facilities Manager',
      name: 'On-Call Manager',
      phone: '07123 456789',
      available: '24/7',
    },
  ],
  doNotActions: [
    'Touch the equipment with bare hands',
    'Use water near electrical components',
    'Attempt electrical repairs yourself',
    'Ignore unusual smells or sounds',
  ],
  timestamp: new Date(),
});

export const createFireSafetyAlert = (equipmentName: string): SafetyAlert => ({
  id: `fire-${Date.now()}`,
  type: 'fire_safety',
  severity: 'critical',
  title: 'FIRE SAFETY EMERGENCY',
  message: `Fire or smoke detected from ${equipmentName}. Immediate evacuation may be required.`,
  immediateActions: [
    'Turn off equipment immediately if safe to do so',
    'Call 999 if smoke persists or fire is visible',
    'Evacuate the building if necessary',
    'Use appropriate fire extinguisher only if trained and safe',
  ],
  emergencyServices: {
    number: '999',
    label: 'Fire & Rescue',
  },
  professionalContacts: [
    {
      role: 'Fire Safety Officer',
      name: 'Emergency Services',
      phone: '999',
      available: '24/7',
    },
    {
      role: 'Site Safety Manager',
      name: 'Emergency Contact',
      phone: '07123 456789',
      available: '24/7',
    },
  ],
  doNotActions: [
    'Use water on electrical or grease fires',
    'Re-enter the building until cleared',
    'Block fire exits',
    'Ignore fire alarms',
  ],
  timestamp: new Date(),
});

export default SafetyAlert;