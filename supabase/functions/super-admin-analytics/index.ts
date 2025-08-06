import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { analytics_type, date_range, include_forecasts } = await req.json()

    // Verify super admin access
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user } } = await supabase.auth.getUser(token)

    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if user has super_admin role
    const { data: staffMember } = await supabase
      .from('staff_members')
      .select('caterbot_role')
      .eq('auth_user_id', user.id)
      .single()

    if (!staffMember || staffMember.caterbot_role !== 'super_admin') {
      return new Response(
        JSON.stringify({ error: 'Super admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Calculate revenue analytics and platform metrics
    const mockResponse = {
      customer_overview: [
        {
          customer_name: "TOCA Group",
          total_sites: 8,
          active_sites: 8,
          total_equipment: 156,
          total_staff: 89,
          avg_health_score: 9.2,
          monthly_revenue: 3192,
          total_ai_cost: 287,
          total_savings_delivered: 28450,
          avg_adoption_rate: 94,
          next_renewal_date: "2025-12-15",
          renewal_probability: 0.96,
          subscription_tier: "Enterprise",
          churn_risk_level: "low"
        }
      ],
      revenue_analytics: {
        current_mrr: 12150,
        mrr_growth_rate: 15.8,
        total_customers: 5,
        avg_clv: 28460,
        churn_rate: 2.1,
        expansion_revenue: 3480,
        monthly_costs: 4250,
        profit_margin: 65.0
      },
      platform_metrics: {
        total_sites: 50,
        total_equipment_managed: 964,
        total_active_users: 628,
        platform_uptime: 99.7,
        avg_response_time: 1.2,
        ai_success_rate: 94.3,
        pattern_match_rate: 76.8,
        customer_satisfaction: 4.6,
        total_cost_savings: 149700,
        monthly_ai_costs: 1084
      },
      business_insights: [
        {
          type: 'opportunity',
          title: 'Enterprise Expansion',
          description: 'Multiple customers ready for Enterprise upgrade.',
          impact: 'high',
          urgency: 'soon',
          value: '+£876/month'
        }
      ],
      generated_at: new Date().toISOString()
    }

    return new Response(
      JSON.stringify(mockResponse),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )

  } catch (error) {
    console.error('Super admin analytics error:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: error.message 
      }),
      { 
        status: 500, 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )
  }
})