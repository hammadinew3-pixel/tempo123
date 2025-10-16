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
    const { assistanceId } = await req.json();

    if (!assistanceId) {
      throw new Error('Assistance ID is required');
    }

    console.log('📄 Generating assistance facture PDF for:', assistanceId);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get assistance data with related client, vehicle, and insurance
    const { data: assistance, error: assistanceError } = await supabase
      .from('assistance')
      .select(`
        *,
        clients (nom, prenom, cin, telephone, email),
        vehicles (marque, modele, immatriculation)
      `)
      .eq('id', assistanceId)
      .single();

    if (assistanceError) throw assistanceError;
    if (!assistance) throw new Error('Assistance not found');

    // Get insurance data if assureur_id exists
    let insuranceData = null;
    if (assistance.assureur_id) {
      const { data: insurance } = await supabase
        .from('assurances')
        .select('nom, contact_nom, contact_telephone, contact_email')
        .eq('id', assistance.assureur_id)
        .single();
      
      insuranceData = insurance;
    }

    // Get agency settings
    const { data: agenceSettings } = await supabase
      .from('agence_settings')
      .select('*')
      .single();

    console.log('✅ Assistance data loaded successfully');

    // Generate the PDF URL - point to the template page
    const origin = req.headers.get('origin') || req.headers.get('referer')?.split('/').slice(0, 3).join('/') || 'https://32923ba1-bb0f-4cee-9b16-6c46841649d6.lovableproject.com';
    const pdfUrl = `${origin}/assistance-facture-template?id=${assistanceId}&print=true`;

    console.log('📄 Generated PDF URL:', pdfUrl);

    return new Response(
      JSON.stringify({ 
        success: true, 
        pdfUrl,
        assistanceData: assistance,
        insuranceData,
        agenceSettings,
        message: 'Facture generated successfully' 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error generating facture:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});