import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )

    const { equipment_id } = await req.json()

    // Get equipment basic info
    const { data: equipment } = await supabase
      .from('equipment_registry')
      .select(`
        *,
        equipment_locations (location_name, location_type)
      `)
      .eq('id', equipment_id)
      .single()

    // Get maintenance history (last 12 months)
    const twelveMonthsAgo = new Date()
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12)

    const { data: maintenanceHistory } = await supabase
      .from('maintenance_logs')
      .select('*')
      .eq('equipment_id', equipment_id)
      .gte('completed_date', twelveMonthsAgo.toISOString())
      .order('completed_date', { ascending: false })

    // Get financial breakdown (last 6 months)
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

    const { data: financials } = await supabase
      .from('equipment_financials')
      .select('*')
      .eq('equipment_id', equipment_id)
      .gte('month_year', sixMonthsAgo.toISOString().substring(0, 7))
      .order('month_year', { ascending: false })

    // Calculate financial totals
    const financialSummary = financials?.reduce((acc, f) => ({
      total_parts_cost: acc.total_parts_cost + (f.parts_cost_gbp || 0),
      total_labor_cost: acc.total_labor_cost + (f.labor_cost_gbp || 0),
      total_ai_cost: acc.total_ai_cost + (f.ai_interaction_cost_gbp || 0),
      total_maintenance_cost: acc.total_maintenance_cost + (f.total_maintenance_cost_gbp || 0),
      total_savings: acc.total_savings + (f.cost_savings_delivered_gbp || 0)
    }), {
      total_parts_cost: 0,
      total_labor_cost: 0,
      total_ai_cost: 0,
      total_maintenance_cost: 0,
      total_savings: 0
    }) || {}

    // Get upcoming maintenance
    const { data: upcomingMaintenance } = await supabase
      .from('maintenance_schedule')
      .select('*')
      .eq('equipment_id', equipment_id)
      .gte('scheduled_date', new Date().toISOString())
      .order('scheduled_date', { ascending: true })

    // Get performance analytics
    const { data: performance } = await supabase
      .from('equipment_performance_analytics')
      .select('*')
      .eq('equipment_id', equipment_id)
      .order('analysis_date', { ascending: false })
      .limit(1)

    // Get chat sessions for this equipment
    const { data: chatSessions } = await supabase
      .from('chat_sessions')
      .select('*')
      .eq('equipment_id', equipment_id)
      .gte('session_start', sixMonthsAgo.toISOString())
      .order('session_start', { ascending: false })

    return new Response(JSON.stringify({
      success: true,
      data: {
        equipment_info: equipment,
        maintenance_history: maintenanceHistory,
        financial_summary: financialSummary,
        financial_breakdown: financials,
        upcoming_maintenance: upcomingMaintenance,
        performance_analytics: performance?.[0] || null,
        recent_chat_sessions: chatSessions,
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