import React, { useState, useEffect } from 'react';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Calendar, 
  AlertTriangle, 
  FileText, 
  User, 
  Filter,
  Download,
  Eye,
  Search,
  Shield,
  Award,
  Clipboard,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL!,
  process.env.REACT_APP_SUPABASE_ANON_KEY!
);

interface ComplianceRecord {
  id: string;
  equipment_id: string;
  equipment_name: string;
  equipment_type: string;
  maintenance_type: 'routine_cleaning' | 'safety_check' | 'temperature_log' | 'deep_clean' | 'calibration' | 'preventive_maintenance';
  compliance_category: 'food_safety' | 'equipment_maintenance' | 'safety_certification' | 'operational_check';
  completion_date: string;
  completed_by: string;
  staff_name: string;
  status: 'completed' | 'overdue' | 'upcoming' | 'skipped';
  notes?: string;
  verification_signature?: string;
  temperature_readings?: number[];
  checklist_items?: {
    item: string;
    checked: boolean;
    notes?: string;
  }[];
  next_due_date?: string;
  regulatory_requirement: boolean;
  audit_trail: {
    created_at: string;
    updated_at: string;
    created_by: string;
    modifications: string[];
  };
}

interface ComplianceStats {
  total_records: number;
  completed_today: number;
  overdue_items: number;
  upcoming_this_week: number;
  compliance_rate_percent: number;
}

interface ComplianceTrackerProps {
  equipmentId?: string;
  equipmentType?: string;
  showCreateForm?: boolean;
  onRecordCreated?: (record: ComplianceRecord) => void;
  onRecordUpdated?: (record: ComplianceRecord) => void;
  managerView?: boolean;
  timeRange?: 'today' | 'week' | 'month' | 'quarter';
}

const ComplianceTracker: React.FC<ComplianceTrackerProps> = ({
  equipmentId,
  equipmentType,
  showCreateForm = true,
  onRecordCreated,
  onRecordUpdated,
  managerView = false,
  timeRange = 'week'
}) => {
  const [records, setRecords] = useState<ComplianceRecord[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<ComplianceRecord[]>([]);
  const [stats, setStats] = useState<ComplianceStats>({
    total_records: 0,
    completed_today: 0,
    overdue_items: 0,
    upcoming_this_week: 0,
    compliance_rate_percent: 0
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [expandedRecord, setExpandedRecord] = useState<string | null>(null);
  const [showNewRecordForm, setShowNewRecordForm] = useState(false);
  
  // New record form state
  const [newRecord, setNewRecord] = useState<Partial<ComplianceRecord>>({
    maintenance_type: 'routine_cleaning',
    compliance_category: 'food_safety',
    status: 'completed',
    completion_date: new Date().toISOString().split('T')[0],
    regulatory_requirement: false
  });

  // Sample compliance records
  const sampleRecords: ComplianceRecord[] = [
    {
      id: 'comp-1',
      equipment_id: 'eq-fryer-1',
      equipment_name: 'Main Fryer',
      equipment_type: 'fryer',
      maintenance_type: 'routine_cleaning',
      compliance_category: 'food_safety',
      completion_date: new Date().toISOString().split('T')[0],
      completed_by: 'staff-1',
      staff_name: 'Alice Johnson',
      status: 'completed',
      notes: 'Deep cleaned and oil changed. All filters replaced.',
      checklist_items: [
        { item: 'Oil drained and replaced', checked: true },
        { item: 'Filters cleaned/replaced', checked: true },
        { item: 'Internal surfaces cleaned', checked: true },
        { item: 'Temperature calibration checked', checked: true }
      ],
      next_due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      regulatory_requirement: true,
      audit_trail: {
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        created_by: 'staff-1',
        modifications: []
      }
    },
    {
      id: 'comp-2',
      equipment_id: 'eq-oven-1',
      equipment_name: 'Convection Oven A',
      equipment_type: 'oven',
      maintenance_type: 'temperature_log',
      compliance_category: 'food_safety',
      completion_date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      completed_by: 'staff-2',
      staff_name: 'Bob Smith',
      status: 'completed',
      notes: 'Temperature readings within acceptable range.',
      temperature_readings: [175, 178, 176, 180, 177],
      next_due_date: new Date().toISOString().split('T')[0],
      regulatory_requirement: true,
      audit_trail: {
        created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        created_by: 'staff-2',
        modifications: []
      }
    }
  ];

  // Load compliance records
  useEffect(() => {
    const loadRecords = async () => {
      setIsLoading(true);
      try {
        let recordsData = sampleRecords;
        
        if (equipmentId) {
          recordsData = recordsData.filter(record => record.equipment_id === equipmentId);
        } else if (equipmentType) {
          recordsData = recordsData.filter(record => record.equipment_type === equipmentType);
        }
        
        recordsData.sort((a, b) => new Date(b.completion_date).getTime() - new Date(a.completion_date).getTime());
        setRecords(recordsData);
        
        // Calculate stats
        const today = new Date().toISOString().split('T')[0];
        const completedToday = recordsData.filter(r => r.completion_date === today && r.status === 'completed').length;
        const overdueItems = recordsData.filter(r => r.status === 'overdue').length;
        const completedRecords = recordsData.filter(r => r.status === 'completed').length;
        
        setStats({
          total_records: recordsData.length,
          completed_today: completedToday,
          overdue_items: overdueItems,
          upcoming_this_week: 0,
          compliance_rate_percent: recordsData.length > 0 ? Math.round((completedRecords / recordsData.length) * 100) : 0
        });
        
      } catch (err) {
        console.error('Error loading compliance records:', err);
        setError('Failed to load compliance records');
      } finally {
        setIsLoading(false);
      }
    };

    loadRecords();
  }, [equipmentId, equipmentType]);

  // Filter records
  useEffect(() => {
    let filtered = [...records];

    if (searchTerm) {
      filtered = filtered.filter(record =>
        record.equipment_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.staff_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.notes?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(record => record.status === statusFilter);
    }

    if (categoryFilter !== 'all') {
      filtered = filtered.filter(record => record.compliance_category === categoryFilter);
    }

    setFilteredRecords(filtered);
  }, [records, searchTerm, statusFilter, categoryFilter]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-400 bg-green-500/20 border-green-500/30';
      case 'overdue': return 'text-red-400 bg-red-500/20 border-red-500/30';
      case 'upcoming': return 'text-blue-400 bg-blue-500/20 border-blue-500/30';
      case 'skipped': return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30';
      default: return 'text-slate-400 bg-slate-500/20 border-slate-500/30';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'food_safety': return <Shield className="h-4 w-4" />;
      case 'equipment_maintenance': return <Award className="h-4 w-4" />;
      case 'safety_certification': return <FileText className="h-4 w-4" />;
      case 'operational_check': return <Clipboard className="h-4 w-4" />;
      default: return <CheckCircle className="h-4 w-4" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex items-center space-x-3">
          <div className="w-6 h-6 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-slate-300">Loading compliance records...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header and Stats */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-white">Compliance Tracker</h3>
            <p className="text-sm text-slate-400">
              Basic maintenance completion records and audit trail
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-3 bg-slate-800/30 border border-slate-600/30 rounded-lg">
            <div className="text-lg font-semibold text-white">{stats.total_records}</div>
            <div className="text-xs text-slate-400">Total Records</div>
          </div>
          
          <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
            <div className="text-lg font-semibold text-green-400">{stats.completed_today}</div>
            <div className="text-xs text-green-200/60">Completed Today</div>
          </div>
          
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
            <div className="text-lg font-semibold text-red-400">{stats.overdue_items}</div>
            <div className="text-xs text-red-200/60">Overdue Items</div>
          </div>
          
          <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg">
            <div className="text-lg font-semibold text-purple-400">{stats.compliance_rate_percent}%</div>
            <div className="text-xs text-purple-200/60">Compliance Rate</div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search records by equipment, staff, or notes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          >
            <option value="all">All Status</option>
            <option value="completed">Completed</option>
            <option value="overdue">Overdue</option>
          </select>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          >
            <option value="all">All Categories</option>
            <option value="food_safety">Food Safety</option>
            <option value="equipment_maintenance">Equipment Maintenance</option>
          </select>
        </div>
      </div>

      {/* Records List */}
      <div className="space-y-3">
        {filteredRecords.length === 0 ? (
          <div className="text-center py-8">
            <Clipboard className="h-12 w-12 text-slate-500 mx-auto mb-3" />
            <p className="text-slate-400">No compliance records found</p>
          </div>
        ) : (
          filteredRecords.map((record) => (
            <div
              key={record.id}
              className="p-4 border border-slate-600/30 bg-slate-800/30 rounded-lg"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-3">
                  {getCategoryIcon(record.compliance_category)}
                  <div>
                    <h4 className="font-medium text-white">{record.equipment_name}</h4>
                    <p className="text-sm text-slate-400">
                      {record.maintenance_type.replace('_', ' ')} • {record.staff_name}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 border rounded text-xs ${getStatusColor(record.status)}`}>
                    {record.status}
                  </span>
                  
                  {record.regulatory_requirement && (
                    <span className="px-2 py-1 bg-blue-500/20 border border-blue-500/30 text-blue-200 rounded text-xs">
                      Regulatory
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                <div className="flex items-center space-x-1">
                  <Calendar className="h-3 w-3 text-slate-400" />
                  <span className="text-slate-300">Completed: {record.completion_date}</span>
                </div>
                
                {record.next_due_date && (
                  <div className="flex items-center space-x-1">
                    <Clock className="h-3 w-3 text-slate-400" />
                    <span className="text-slate-300">Next due: {record.next_due_date}</span>
                  </div>
                )}
                
                <div className="flex items-center space-x-1">
                  <User className="h-3 w-3 text-slate-400" />
                  <span className="text-slate-300">{record.staff_name}</span>
                </div>
              </div>

              {record.notes && (
                <div className="mt-3 p-2 bg-slate-700/30 rounded text-sm text-slate-300">
                  {record.notes}
                </div>
              )}

              {record.checklist_items && record.checklist_items.length > 0 && (
                <div className="mt-3">
                  <h5 className="text-sm font-medium text-white mb-2">Checklist Items:</h5>
                  <div className="space-y-1">
                    {record.checklist_items.map((item, index) => (
                      <div key={index} className="flex items-center space-x-2 text-sm">
                        {item.checked ? (
                          <CheckCircle className="h-3 w-3 text-green-400" />
                        ) : (
                          <XCircle className="h-3 w-3 text-red-400" />
                        )}
                        <span className="text-slate-300">{item.item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Guidelines */}
      <div className="p-4 bg-slate-800/30 border border-slate-600/30 rounded-lg">
        <h4 className="text-sm font-medium text-white mb-2">Compliance Guidelines</h4>
        <ul className="text-xs text-slate-400 space-y-1">
          <li>• Records maintenance completion for audit trail purposes</li>
          <li>• NOT for health inspector compliance - basic operational tracking only</li>
          <li>• Manager dashboard provides oversight of completion rates</li>
          <li>• Records integrate with existing maintenance logging system</li>
        </ul>
      </div>
    </div>
  );
};

export default ComplianceTracker;