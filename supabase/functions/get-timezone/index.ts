import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { lat, lng } = await req.json();

    // Use TimezoneDB API (free tier available)
    // Alternative: Use a calculation based on longitude for rough estimation
    const response = await fetch(
      `https://timeapi.io/api/timezone/coordinate?latitude=${lat}&longitude=${lng}`
    );

    if (!response.ok) {
      throw new Error('Failed to fetch timezone data');
    }

    const data = await response.json();
    
    return new Response(
      JSON.stringify({
        timezone: data.timeZone || 'UTC',
        offset: data.currentUtcOffset || { seconds: 0 }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in get-timezone function:', error);
    return new Response(
      JSON.stringify({ error: errorMessage, timezone: 'UTC', offset: { seconds: 0 } }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
