// Edge Function: create-test-user
// Status: ACTIVE in Supabase Production (needs sync)
// Created: 2025-01-13
//
// ⚠️ This is a placeholder file. The actual function code needs to be synced from Supabase.
//
// To sync this function:
// 1. Use Supabase CLI: supabase functions download create-test-user
// 2. Or copy from Supabase Dashboard > Edge Functions > create-test-user

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

serve(async (req) => {
  return new Response(
    JSON.stringify({
      error: 'Function not yet synced from production',
      function: 'create-test-user',
      message: 'Please sync this function from Supabase production'
    }),
    { 
      status: 501,
      headers: { 'Content-Type': 'application/json' }
    }
  )
})