import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )

    const { site_id, time_period = '30_days' } = await req.json()

    // Calculate date range
    const days = time_period === '7_days' ? 7 : time_period === '30_days' ? 30 : 90
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    // Get equipment health overview
    const { data: equipmentHealth } = await supabase
      .from('equipment_registry')
      .select('id, equipment_name, current_status, health_score')
      .eq('site_id', site_id)

    const healthSummary = {
      operational: equipmentHealth?.filter(e => e.current_status === 'operational').length || 0,
      attention_needed: equipmentHealth?.filter(e => e.current_status === 'attention_needed').length || 0,
      critical: equipmentHealth?.filter(e => e.current_status === 'critical').length || 0,
      offline: equipmentHealth?.filter(e => e.current_status === 'offline').length || 0,
      average_health_score: equipmentHealth?.reduce((acc, e) => acc + e.health_score, 0) / (equipmentHealth?.length || 1)
    }

    // Get maintenance analytics
    const { data: maintenanceData } = await supabase
      .from('maintenance_logs')
      .select('maintenance_type, completion_status, total_cost, completed_date')
      .eq('site_id', site_id)
      .gte('completed_date', startDate.toISOString())

    const maintenanceSummary = {
      total_completed: maintenanceData?.filter(m => m.completion_status === 'completed').length || 0,
      total_cost: maintenanceData?.reduce((acc, m) => acc + (m.total_cost || 0), 0) || 0,
      routine_maintenance: maintenanceData?.filter(m => m.maintenance_type === 'routine').length || 0,
      emergency_repairs: maintenanceData?.filter(m => m.maintenance_type === 'emergency').length || 0
    }

    // Get pending approvals
    const { data: pendingApprovals } = await supabase
      .from('manager_approvals')
      .select('id, request_type, estimated_cost, urgency_level')
      .eq('site_id', site_id)
      .eq('status', 'pending')

    const approvalsSummary = {
      total_pending: pendingApprovals?.length || 0,
      total_value: pendingApprovals?.reduce((acc, a) => acc + (a.estimated_cost || 0), 0) || 0,
      high_priority: pendingApprovals?.filter(a => a.urgency_level === 'high').length || 0
    }

    // Get cost savings analytics
    const { data: chatSessions } = await supabase
      .from('chat_sessions')
      .select('ai_cost_gbp, cost_savings_gbp, resolution_method')
      .eq('site_id', site_id)
      .gte('session_start', startDate.toISOString())

    const costAnalytics = {
      total_ai_cost: chatSessions?.reduce((acc, s) => acc + (s.ai_cost_gbp || 0), 0) || 0,
      total_savings: chatSessions?.reduce((acc, s) => acc + (s.cost_savings_gbp || 0), 0) || 0,
      pattern_matches: chatSessions?.filter(s => s.resolution_method === 'pattern_match').length || 0,
      ai_escalations: chatSessions?.filter(s => s.resolution_method === 'ai_escalation').length || 0
    }

    // Calculate ROI
    const roi = costAnalytics.total_savings > 0 
      ? ((costAnalytics.total_savings - costAnalytics.total_ai_cost) / costAnalytics.total_ai_cost) * 100 
      : 0

    return new Response(JSON.stringify({
      success: true,
      data: {
        equipment_health: healthSummary,
        maintenance_summary: maintenanceSummary,
        pending_approvals: approvalsSummary,
        cost_analytics: { ...costAnalytics, roi_percentage: roi },
        last_updated: new Date().toISOString()
      }
    }), {
      headers: { "Content-Type": "application/json" },
    })

  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
})