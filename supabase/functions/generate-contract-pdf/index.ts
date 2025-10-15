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
    const { contractId } = await req.json();

    if (!contractId) {
      throw new Error('Contract ID is required');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get contract data with related client and vehicle
    const { data: contract, error: contractError } = await supabase
      .from('contracts')
      .select(`
        *,
        clients (*),
        vehicles (*)
      `)
      .eq('id', contractId)
      .single();

    if (contractError) throw contractError;
    if (!contract) throw new Error('Contract not found');

    // Get vehicle changes history for this contract
    const { data: vehicleChanges, error: changesError } = await supabase
      .from('vehicle_changes')
      .select('*, old_vehicle:old_vehicle_id(*), new_vehicle:new_vehicle_id(*)')
      .eq('contract_id', contractId)
      .order('change_date', { ascending: true });

    if (changesError) {
      console.error('Error fetching vehicle changes:', changesError);
    }

    // Get secondary drivers
    const { data: secondaryDrivers, error: driversError } = await supabase
      .from('secondary_drivers')
      .select('*')
      .eq('contract_id', contractId);

    if (driversError) {
      console.error('Error fetching secondary drivers:', driversError);
    }

    // Get agency settings
    const { data: agenceSettings } = await supabase
      .from('agence_settings')
      .select('*')
      .single();

    console.log('📋 Vehicle changes found:', vehicleChanges?.length || 0);
    console.log('👥 Secondary drivers found:', secondaryDrivers?.length || 0);

    // Get the origin from the request headers
    const origin = req.headers.get('origin') || req.headers.get('referer')?.split('/').slice(0, 3).join('/') || 'https://66e40113-c245-4ca2-bcfb-093ee69d0d09.lovableproject.com';
    
    // Create URL pointing to the contract template page on the app domain
    const pdfUrl = `${origin}/contract-template?id=${contractId}`;

    console.log('📄 Generated PDF URL:', pdfUrl);

    // Update contract with PDF URL and signed timestamp
    const { error: updateError } = await supabase
      .from('contracts')
      .update({ 
        pdf_url: pdfUrl,
        signed_at: new Date().toISOString()
      })
      .eq('id', contractId);

    if (updateError) {
      console.error('❌ Error updating contract:', updateError);
      throw updateError;
    }

    console.log('✅ Contract updated with PDF URL');

    return new Response(
      JSON.stringify({ 
        success: true, 
        pdfUrl,
        contractData: contract,
        vehicleChanges: vehicleChanges || [],
        secondaryDrivers: secondaryDrivers || [],
        agenceSettings,
        message: 'PDF generated successfully' 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error generating PDF:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
