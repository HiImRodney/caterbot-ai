import React, { useState, useEffect } from "react";
import {
  Activity,
  AlertCircle,
  CheckCircle,
  Clock,
  TrendingUp,
  TrendingDown,
  Calendar,
  Wrench,
} from "lucide-react";

interface Equipment {
  id: string;
  name: string;
  current_status: string;
  health_percentage: number;
  performance_rating: number;
  active_alerts?: number;
  maintenance?: {
    is_overdue: boolean;
    days_until_due: number;
  };
  trend: string;
}

interface EquipmentStatus {
  id: string;
  name: string;
  internal_name: string;
  location: string;
  category: string;
  manufacturer: string;
  model: string;
  current_status:
    | "operational"
    | "maintenance_required"
    | "out_of_service"
    | "critical";
  health_percentage: number;
  performance_rating: number;
  last_maintenance: Date | null;
  next_maintenance_due: Date | null;
  uptime_percentage: number;
  temperature?: number;
  pressure?: string;
  active_alerts: number;
  recent_issues: Array<{
    type: string;
    severity: string;
    timestamp: Date;
    resolved: boolean;
  }>;
  maintenance_history: Array<{
    date: Date;
    type: string;
    cost: number;
    effectiveness_rating: number;
  }>;
  trend: "improving" | "stable" | "declining";
  predicted_failure_risk: "low" | "medium" | "high";
}

interface EquipmentStatusProps {
  equipment: EquipmentStatus;
  showDetails?: boolean;
  onClick?: () => void;
  className?: string;
}

const EquipmentStatus: React.FC<EquipmentStatusProps> = ({
  equipment,
  showDetails = false,
  onClick,
  className = "",
}) => {
  const [liveData, setLiveData] = useState(equipment);
  const [isUpdating, setIsUpdating] = useState(false);

  // Real-time status updates via Supabase
  useEffect(() => {
    const updateInterval = setInterval(async () => {
      setIsUpdating(true);
      try {
        // Call our equipment-context Edge Function for live data
        const response = await fetch(
          `${process.env.REACT_APP_SUPABASE_URL}/functions/v1/equipment-context`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${process.env.REACT_APP_SUPABASE_ANON_KEY}`,
            },
            body: JSON.stringify({ equipment_id: equipment.id }),
          }
        );

        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            // Update live data with fresh equipment status
            setLiveData((prev) => ({
              ...prev,
              current_status: data.equipment.current_status,
              health_percentage: calculateHealthPercentage(data.equipment),
              performance_rating: data.equipment.performance_rating,
              active_alerts: data.equipment.active_alerts || 0,
            }));
          }
        }
      } catch (error) {
        console.warn("Failed to update equipment status:", error);
      } finally {
        setIsUpdating(false);
      }
    }, 30000); // Update every 30 seconds

    return () => clearInterval(updateInterval);
  }, [equipment.id]);

  const calculateHealthPercentage = (equip: Equipment): number => {
    let health = 100;

    // Reduce health based on status
    if (equip.current_status === "maintenance_required") health -= 20;
    if (equip.current_status === "out_of_service") health = 0;
    if (equip.current_status === "critical") health -= 40;

    // Reduce health based on overdue maintenance
    if (equip.maintenance?.is_overdue) {
      health -= Math.min(equip.maintenance.days_until_due * -2, 30);
    }

    // Factor in performance rating
    if (equip.performance_rating < 4) {
      health -= (4 - equip.performance_rating) * 10;
    }

    return Math.max(0, Math.min(100, health));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "operational":
        return "text-green-600 bg-green-50 border-green-200";
      case "maintenance_required":
        return "text-yellow-600 bg-yellow-50 border-yellow-200";
      case "out_of_service":
        return "text-red-600 bg-red-50 border-red-200";
      case "critical":
        return "text-red-600 bg-red-50 border-red-200 animate-pulse";
      default:
        return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  const getHealthColor = (percentage: number) => {
    if (percentage >= 80) return "bg-green-500";
    if (percentage >= 60) return "bg-yellow-500";
    if (percentage >= 40) return "bg-orange-500";
    return "bg-red-500";
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "improving":
        return <TrendingUp className="w-4 h-4 text-green-600" />;
      case "declining":
        return <TrendingDown className="w-4 h-4 text-red-600" />;
      default:
        return <Activity className="w-4 h-4 text-blue-600" />;
    }
  };

  const formatTimeAgo = (date: Date | null) => {
    if (!date) return "Never";
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return "Today";
    if (days === 1) return "Yesterday";
    if (days < 7) return `${days} days ago`;
    if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
    return `${Math.floor(days / 30)} months ago`;
  };

  const formatNextDue = (date: Date | null) => {
    if (!date) return "Not scheduled";
    const now = new Date();
    const diff = date.getTime() - now.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days < 0) return `${Math.abs(days)} days overdue`;
    if (days === 0) return "Due today";
    if (days === 1) return "Due tomorrow";
    if (days < 7) return `Due in ${days} days`;
    if (days < 30) return `Due in ${Math.floor(days / 7)} weeks`;
    return `Due in ${Math.floor(days / 30)} months`;
  };

  // Compact status bar for chat header
  if (!showDetails) {
    return (
      <div
        className={`flex items-center space-x-3 cursor-pointer hover:bg-gray-50 p-2 rounded transition-colors ${className}`}
        onClick={onClick}
      >
        {/* Status indicator */}
        <div className="relative">
          <div
            className={`w-3 h-3 rounded-full ${
              liveData.current_status === "operational"
                ? "bg-green-500"
                : liveData.current_status === "maintenance_required"
                ? "bg-yellow-500"
                : liveData.current_status === "critical"
                ? "bg-red-500 animate-pulse"
                : "bg-red-600"
            }`}
          />
          {isUpdating && (
            <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full animate-ping" />
          )}
        </div>

        {/* Equipment name and health */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-gray-900 truncate">
              {liveData.name}
            </span>
            {getTrendIcon(liveData.trend)}
          </div>

          {/* Health bar */}
          <div className="flex items-center space-x-2 mt-1">
            <div className="flex-1 bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all duration-300 ${getHealthColor(
                  liveData.health_percentage
                )}`}
                style={{ width: `${liveData.health_percentage}%` }}
              />
            </div>
            <span className="text-xs text-gray-500 min-w-0">
              {liveData.health_percentage}%
            </span>
          </div>
        </div>

        {/* Alert count */}
        {liveData.active_alerts > 0 && (
          <div className="bg-red-100 text-red-600 text-xs font-medium px-2 py-1 rounded-full">
            {liveData.active_alerts}
          </div>
        )}
      </div>
    );
  }

  // Detailed status card
  return (
    <div
      className={`bg-white border border-gray-200 rounded-lg shadow-sm ${className}`}
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              {liveData.name}
              {isUpdating && (
                <div className="ml-2 w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              )}
            </h3>
            <p className="text-sm text-gray-600">
              {liveData.location} • {liveData.manufacturer} {liveData.model}
            </p>
          </div>
          <div
            className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(
              liveData.current_status
            )}`}
          >
            {liveData.current_status.replace("_", " ").toUpperCase()}
          </div>
        </div>
      </div>

      {/* Status Overview */}
      <div className="p-4 space-y-4">
        {/* Health and Performance */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">
                Equipment Health
              </span>
              <span className="text-sm text-gray-600">
                {liveData.health_percentage}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className={`h-3 rounded-full transition-all duration-500 ${getHealthColor(
                  liveData.health_percentage
                )}`}
                style={{ width: `${liveData.health_percentage}%` }}
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">
                Performance
              </span>
              <div className="flex items-center space-x-1">
                <span className="text-sm text-gray-600">
                  {liveData.performance_rating}/5
                </span>
                {getTrendIcon(liveData.trend)}
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="h-3 rounded-full bg-blue-500 transition-all duration-500"
                style={{ width: `${(liveData.performance_rating / 5) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Real-time Metrics */}
        {(liveData.temperature !== undefined || liveData.pressure) && (
          <div className="bg-blue-50 rounded-lg p-3">
            <h4 className="font-medium text-blue-900 mb-2 flex items-center">
              <Activity className="w-4 h-4 mr-2" />
              Live Metrics
            </h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              {liveData.temperature !== undefined && (
                <div>
                  <span className="text-blue-700">Temperature:</span>
                  <span className="text-blue-900 font-medium ml-2">
                    {liveData.temperature}°C
                  </span>
                </div>
              )}
              {liveData.pressure && (
                <div>
                  <span className="text-blue-700">Pressure:</span>
                  <span className="text-blue-900 font-medium ml-2">
                    {liveData.pressure}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Maintenance Schedule */}
        <div className="bg-gray-50 rounded-lg p-3">
          <h4 className="font-medium text-gray-900 mb-2 flex items-center">
            <Wrench className="w-4 h-4 mr-2" />
            Maintenance Schedule
          </h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Last Service:</span>
              <p className="text-gray-900 font-medium">
                {formatTimeAgo(liveData.last_maintenance)}
              </p>
            </div>
            <div>
              <span className="text-gray-600">Next Due:</span>
              <p
                className={`font-medium ${
                  liveData.next_maintenance_due &&
                  new Date(liveData.next_maintenance_due) < new Date()
                    ? "text-red-600"
                    : "text-gray-900"
                }`}
              >
                {formatNextDue(liveData.next_maintenance_due)}
              </p>
            </div>
          </div>
        </div>

        {/* Active Alerts */}
        {liveData.active_alerts > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <h4 className="font-medium text-red-900 mb-2 flex items-center">
              <AlertCircle className="w-4 h-4 mr-2" />
              Active Alerts ({liveData.active_alerts})
            </h4>
            {liveData.recent_issues
              .filter((issue) => !issue.resolved)
              .map((issue, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="text-red-800">{issue.type}</span>
                  <span
                    className={`px-2 py-1 rounded text-xs ${
                      issue.severity === "critical"
                        ? "bg-red-200 text-red-800"
                        : issue.severity === "high"
                        ? "bg-orange-200 text-orange-800"
                        : "bg-yellow-200 text-yellow-800"
                    }`}
                  >
                    {issue.severity}
                  </span>
                </div>
              ))}
          </div>
        )}

        {/* Quick Actions */}
        <div className="flex space-x-2 pt-2 border-t border-gray-200">
          <button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 px-3 rounded transition-colors">
            Start Troubleshooting
          </button>
          <button className="flex-1 bg-gray-500 hover:bg-gray-600 text-white text-sm font-medium py-2 px-3 rounded transition-colors">
            View History
          </button>
          <button className="bg-green-600 hover:bg-green-700 text-white text-sm font-medium py-2 px-3 rounded transition-colors flex items-center">
            <Calendar className="w-4 h-4 mr-1" />
            Schedule
          </button>
        </div>
      </div>
    </div>
  );
};

// Equipment Status Summary for multiple equipment
interface EquipmentStatusSummaryProps {
  equipmentList: EquipmentStatus[];
  className?: string;
}

export const EquipmentStatusSummary: React.FC<EquipmentStatusSummaryProps> = ({
  equipmentList,
  className = "",
}) => {
  const [selectedEquipment, setSelectedEquipment] = useState<string | null>(
    null
  );

  const getCounts = () => {
    return {
      operational: equipmentList.filter(
        (e) => e.current_status === "operational"
      ).length,
      maintenance: equipmentList.filter(
        (e) => e.current_status === "maintenance_required"
      ).length,
      critical: equipmentList.filter(
        (e) =>
          e.current_status === "critical" ||
          e.current_status === "out_of_service"
      ).length,
      total: equipmentList.length,
    };
  };

  const counts = getCounts();

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Summary Header */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h3 className="font-semibold text-gray-900 mb-3">
          Equipment Status Overview
        </h3>
        <div className="grid grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-gray-900">
              {counts.total}
            </div>
            <div className="text-sm text-gray-600">Total</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-600">
              {counts.operational}
            </div>
            <div className="text-sm text-gray-600">Operational</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-yellow-600">
              {counts.maintenance}
            </div>
            <div className="text-sm text-gray-600">Maintenance</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-red-600">
              {counts.critical}
            </div>
            <div className="text-sm text-gray-600">Critical</div>
          </div>
        </div>
      </div>

      {/* Equipment List */}
      <div className="space-y-2">
        {equipmentList.map((equipment) => (
          <EquipmentStatus
            key={equipment.id}
            equipment={equipment}
            showDetails={selectedEquipment === equipment.id}
            onClick={() =>
              setSelectedEquipment(
                selectedEquipment === equipment.id ? null : equipment.id
              )
            }
          />
        ))}
      </div>
    </div>
  );
};

export default EquipmentStatus;
