import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ServiceRequest {
  id: string;
  site_name: string;
  site_address: string;
  equipment_type: string;
  equipment_name: string;
  priority: 'urgent' | 'high' | 'medium' | 'low';
  status: 'pending' | 'assigned' | 'en_route' | 'on_site' | 'completed';
  created_at: string;
  estimated_cost: number;
  manager_notes?: string;
  engineer_id?: string;
  estimated_arrival?: string;
}

interface Engineer {
  id: string;
  name: string;
  phone: string;
  specialties: string[];
  current_location?: string;
  availability_status: 'available' | 'busy' | 'off_duty';
  rating: number;
  total_jobs: number;
  gas_safe_certified: boolean;
  current_job_site?: string;
}

interface PartsRequest {
  id: string;
  site_name: string;
  part_name: string;
  part_number: string;
  quantity: number;
  estimated_cost: number;
  status: 'pending' | 'approved' | 'ordered' | 'delivered';
  urgency: 'emergency' | 'urgent' | 'routine';
  requested_by: string;
  created_at: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Get the authorization header
    const authorization = req.headers.get('Authorization')
    if (authorization) {
      supabaseClient.auth.setSession({
        access_token: authorization.replace('Bearer ', ''),
        refresh_token: ''
      })
    }

    const { action, data } = await req.json()

    switch (action) {
      case 'get_dashboard_data':
        return await getDashboardData(supabaseClient)
      
      case 'assign_engineer':
        return await assignEngineer(supabaseClient, data)
      
      case 'update_service_status':
        return await updateServiceStatus(supabaseClient, data)
      
      case 'approve_parts_request':
        return await approvePartsRequest(supabaseClient, data)
      
      case 'get_performance_metrics':
        return await getPerformanceMetrics(supabaseClient)
      
      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
    }
  } catch (error) {
    console.error('Error in operative-coordination function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

async function getDashboardData(supabase: any) {
  try {
    // Get service requests with site and equipment details
    const { data: serviceRequests, error: serviceError } = await supabase
      .from('service_requests')
      .select(`
        id,
        equipment_id,
        priority,
        status,
        estimated_cost,
        manager_notes,
        engineer_id,
        estimated_arrival,
        created_at,
        equipment_items (
          name,
          type,
          restaurants (
            name,
            address
          )
        )
      `)
      .eq('status', 'pending')
      .or('status.eq.assigned,status.eq.en_route,status.eq.on_site')
      .order('created_at', { ascending: false })
      .limit(20)

    if (serviceError) throw serviceError

    // Get available engineers with specialties
    const { data: engineers, error: engineerError } = await supabase
      .from('engineers')
      .select('*')
      .order('rating', { ascending: false })

    if (engineerError) throw engineerError

    // Get recent parts requests
    const { data: partsRequests, error: partsError } = await supabase
      .from('parts_requests')
      .select(`
        id,
        part_name,
        part_number,
        quantity,
        estimated_cost,
        status,
        urgency,
        requested_by,
        created_at,
        equipment_items (
          restaurants (
            name
          )
        )
      `)
      .neq('status', 'delivered')
      .order('created_at', { ascending: false })
      .limit(10)

    if (partsError) throw partsError

    // Format service requests for frontend
    const formattedServiceRequests = serviceRequests?.map(req => ({
      id: req.id,
      site_name: req.equipment_items?.restaurants?.name || 'Unknown Site',
      site_address: req.equipment_items?.restaurants?.address || 'Unknown Address',
      equipment_type: req.equipment_items?.type || 'Unknown Type',
      equipment_name: req.equipment_items?.name || 'Unknown Equipment',
      priority: req.priority,
      status: req.status,
      created_at: req.created_at,
      estimated_cost: req.estimated_cost,
      manager_notes: req.manager_notes,
      engineer_id: req.engineer_id,
      estimated_arrival: req.estimated_arrival
    })) || []

    // Format parts requests for frontend
    const formattedPartsRequests = partsRequests?.map(req => ({
      id: req.id,
      site_name: req.equipment_items?.restaurants?.name || 'Unknown Site',
      part_name: req.part_name,
      part_number: req.part_number,
      quantity: req.quantity,
      estimated_cost: req.estimated_cost,
      status: req.status,
      urgency: req.urgency,
      requested_by: req.requested_by,
      created_at: req.created_at
    })) || []

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          serviceRequests: formattedServiceRequests,
          engineers: engineers || [],
          partsRequests: formattedPartsRequests
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error getting dashboard data:', error)
    throw error
  }
}

async function assignEngineer(supabase: any, data: any) {
  try {
    const { serviceRequestId, engineerId } = data

    // Update service request with engineer assignment
    const { error: updateError } = await supabase
      .from('service_requests')
      .update({
        engineer_id: engineerId,
        status: 'assigned',
        assigned_at: new Date().toISOString()
      })
      .eq('id', serviceRequestId)

    if (updateError) throw updateError

    // Update engineer availability
    const { error: engineerError } = await supabase
      .from('engineers')
      .update({
        availability_status: 'busy',
        current_job_id: serviceRequestId
      })
      .eq('id', engineerId)

    if (engineerError) throw engineerError

    // Log the assignment for audit trail
    const { error: logError } = await supabase
      .from('service_logs')
      .insert({
        service_request_id: serviceRequestId,
        action: 'engineer_assigned',
        details: { engineer_id: engineerId },
        created_at: new Date().toISOString()
      })

    if (logError) console.error('Error logging assignment:', logError)

    return new Response(
      JSON.stringify({ success: true, message: 'Engineer assigned successfully' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error assigning engineer:', error)
    throw error
  }
}

async function updateServiceStatus(supabase: any, data: any) {
  try {
    const { serviceRequestId, newStatus } = data

    const updateData: any = {
      status: newStatus,
      updated_at: new Date().toISOString()
    }

    // Add timestamp for specific status changes
    if (newStatus === 'en_route') {
      updateData.en_route_at = new Date().toISOString()
    } else if (newStatus === 'on_site') {
      updateData.on_site_at = new Date().toISOString()
    } else if (newStatus === 'completed') {
      updateData.completed_at = new Date().toISOString()
      
      // If completed, make engineer available again
      const { data: serviceRequest } = await supabase
        .from('service_requests')
        .select('engineer_id')
        .eq('id', serviceRequestId)
        .single()

      if (serviceRequest?.engineer_id) {
        await supabase
          .from('engineers')
          .update({
            availability_status: 'available',
            current_job_id: null
          })
          .eq('id', serviceRequest.engineer_id)
      }
    }

    const { error } = await supabase
      .from('service_requests')
      .update(updateData)
      .eq('id', serviceRequestId)

    if (error) throw error

    // Log status change
    await supabase
      .from('service_logs')
      .insert({
        service_request_id: serviceRequestId,
        action: 'status_updated',
        details: { new_status: newStatus },
        created_at: new Date().toISOString()
      })

    return new Response(
      JSON.stringify({ success: true, message: 'Status updated successfully' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error updating service status:', error)
    throw error
  }
}

async function approvePartsRequest(supabase: any, data: any) {
  try {
    const { partsRequestId } = data

    const { error } = await supabase
      .from('parts_requests')
      .update({
        status: 'approved',
        approved_at: new Date().toISOString()
      })
      .eq('id', partsRequestId)

    if (error) throw error

    // Log the approval
    await supabase
      .from('parts_logs')
      .insert({
        parts_request_id: partsRequestId,
        action: 'approved',
        created_at: new Date().toISOString()
      })

    return new Response(
      JSON.stringify({ success: true, message: 'Parts request approved' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error approving parts request:', error)
    throw error
  }
}

async function getPerformanceMetrics(supabase: any) {
  try {
    const today = new Date().toISOString().split('T')[0]

    // Get today's metrics
    const { data: todayRequests } = await supabase
      .from('service_requests')
      .select('*')
      .gte('created_at', today)

    const { data: completedToday } = await supabase
      .from('service_requests')
      .select('*')
      .eq('status', 'completed')
      .gte('completed_at', today)

    const { data: activeEngineers } = await supabase
      .from('engineers')
      .select('*')
      .neq('availability_status', 'off_duty')

    // Calculate average response time (simplified)
    const { data: responseTimeData } = await supabase
      .from('service_requests')
      .select('created_at, assigned_at')
      .not('assigned_at', 'is', null)
      .gte('created_at', today)

    let averageResponseTime = 0
    if (responseTimeData && responseTimeData.length > 0) {
      const totalMinutes = responseTimeData.reduce((sum, req) => {
        const created = new Date(req.created_at)
        const assigned = new Date(req.assigned_at)
        return sum + (assigned.getTime() - created.getTime()) / 60000
      }, 0)
      averageResponseTime = Math.round(totalMinutes / responseTimeData.length)
    }

    // Calculate revenue (simplified)
    const { data: revenueData } = await supabase
      .from('service_requests')
      .select('estimated_cost')
      .eq('status', 'completed')
      .gte('completed_at', today)

    const revenueToday = revenueData?.reduce((sum, req) => sum + (req.estimated_cost || 0), 0) || 0

    const metrics = {
      total_service_requests: todayRequests?.length || 0,
      completed_today: completedToday?.length || 0,
      average_response_time: averageResponseTime,
      customer_satisfaction: 4.6, // Would come from actual feedback system
      revenue_today: revenueToday,
      engineers_active: activeEngineers?.length || 0
    }

    return new Response(
      JSON.stringify({ success: true, data: metrics }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error getting performance metrics:', error)
    throw error
  }
}
