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
    const { type, id, ids } = await req.json();
    
    console.log('📄 Generating PDF:', { type, id, ids });
    
    // Mapping des 8 types de templates
    const templates: Record<string, string> = {
      'contract': `/contract-template?id=${id}&print=true`,
      'contract-blank': `/contract-template?blankMode=true&print=true`,
      'facture-location': `/location-facture-template?id=${id}&print=true`,
      'assistance-contract': `/assistance-contract-template?id=${id}&print=true`,
      'assistance-contract-blank': `/assistance-contract-template?blankMode=true&print=true`,
      'facture-assistance': ids 
        ? `/assistance-facture-template?ids=${ids}&print=true`
        : `/assistance-facture-template?id=${id}&print=true`,
      'dossier-complet-assistance': `/assistance-complet-template?id=${id}&download=true`
    };
    
    if (!templates[type]) {
      throw new Error(`Type de PDF invalide: ${type}`);
    }
    
    // Construire l'URL du template en utilisant le domaine public de l'app
    const origin = Deno.env.get('PUBLIC_APP_URL') || 'https://app.crsapp.ma';
    const templateUrl = `${origin}${templates[type]}`;
    
    console.log('🌐 Template URL:', templateUrl);
    
    // Appel à Gotenberg sur Railway
    const gotenbergUrl = Deno.env.get('GOTENBERG_URL');
    if (!gotenbergUrl) {
      throw new Error('GOTENBERG_URL not configured');
    }
    
    const formData = new FormData();
    formData.append('url', templateUrl);
    formData.append('waitDelay', '2s'); // Attendre 2s pour le chargement complet
    formData.append('emulatedMediaType', 'print');
    formData.append('paperWidth', '8.27'); // A4 width in inches
    formData.append('paperHeight', '11.7'); // A4 height in inches
    formData.append('marginTop', '0.39'); // 10mm in inches
    formData.append('marginBottom', '0.39');
    formData.append('marginLeft', '0.39');
    formData.append('marginRight', '0.39');
    formData.append('printBackground', 'true');
    
    console.log('🖨️ Calling Gotenberg...');
    
    const pdfResponse = await fetch(`${gotenbergUrl}/forms/chromium/convert/url`, {
      method: 'POST',
      body: formData
    });
    
    if (!pdfResponse.ok) {
      const errorText = await pdfResponse.text();
      console.error('Gotenberg error:', errorText);
      throw new Error(`Gotenberg error: ${pdfResponse.statusText}`);
    }
    
    const pdfBuffer = await pdfResponse.arrayBuffer();
    console.log('✅ PDF generated, size:', pdfBuffer.byteLength, 'bytes');
    
    // Upload vers Supabase Storage
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Déterminer le bucket selon le type
    const bucket = type.includes('assistance') ? 'assistance-pdfs' : 
                   type.includes('facture') && !type.includes('assistance') ? 'location-pdfs' : 
                   'contract-pdfs';
    
    const fileName = `${type}-${id || ids || 'blank'}-${Date.now()}.pdf`;
    
    console.log('📤 Uploading to bucket:', bucket, fileName);
    
    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(fileName, pdfBuffer, {
        contentType: 'application/pdf',
        upsert: false
      });
    
    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      throw uploadError;
    }
    
    // Créer signed URL (1h)
    const { data: signedData, error: signError } = await supabase.storage
      .from(bucket)
      .createSignedUrl(fileName, 3600);
    
    if (signError || !signedData?.signedUrl) {
      console.error('Signed URL error:', signError);
      throw new Error('Could not create signed URL');
    }
    
    console.log('✅ PDF ready:', signedData.signedUrl);
    
    return new Response(
      JSON.stringify({ 
        url: signedData.signedUrl, 
        fileName,
        bucket 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
    
  } catch (error) {
    console.error('❌ Error generating PDF:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    );
  }
});
