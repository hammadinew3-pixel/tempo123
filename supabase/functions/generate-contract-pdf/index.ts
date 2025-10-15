import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { contractId } = await req.json();

    if (!contractId) {
      throw new Error('Contract ID is required');
    }

    // Fetch contract data
    const { data: contract, error: contractError } = await supabase
      .from('contracts')
      .select(`
        *,
        clients(*),
        vehicles(*)
      `)
      .eq('id', contractId)
      .single();

    if (contractError) throw contractError;

    // Fetch vehicle changes
    const { data: vehicleChanges } = await supabase
      .from('vehicle_changes')
      .select(`
        *,
        old_vehicle:old_vehicle_id(marque, modele, immatriculation),
        new_vehicle:new_vehicle_id(marque, modele, immatriculation)
      `)
      .eq('contract_id', contractId)
      .order('change_date', { ascending: true });

    // Fetch secondary drivers
    const { data: secondaryDrivers } = await supabase
      .from('secondary_drivers')
      .select('*')
      .eq('contract_id', contractId);

    // Get the origin from the request headers or fallback to the environment
    const origin = req.headers.get('origin') || req.headers.get('referer')?.split('/').slice(0, 3).join('/') || 'https://66e40113-c245-4ca2-bcfb-093ee69d0d09.lovableproject.com';
    const pdfUrl = `${origin}/contract-template?id=${contractId}`;

    console.log('📄 Generated PDF URL:', pdfUrl);

    await supabase.from('contracts').update({ pdf_url: pdfUrl, signed_at: new Date().toISOString() }).eq('id', contractId);

    return new Response(JSON.stringify({ success: true, pdfUrl }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error: any) {
    return new Response(JSON.stringify({ success: false, error: error?.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
