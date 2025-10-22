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
    console.log('Generating invoice PDF for contract:', contractId);

    if (!contractId) {
      throw new Error('Contract ID is required');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const browserlessToken = Deno.env.get('BROWSERLESS_TOKEN');

    if (!browserlessToken) {
      throw new Error('BROWSERLESS_TOKEN is not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Générer l'URL du template de facture
    // Utiliser l'URL Lovable pour accéder au template
    const templateUrl = `https://32923ba1-bb0f-4cee-9b16-6c46841649d6.lovableproject.com/location-facture-template?id=${contractId}&print=true`;
    console.log('Template URL:', templateUrl);

    // Appeler Browserless pour générer le PDF
    console.log('Calling Browserless API...');
    const browserlessResponse = await fetch('https://chrome.browserless.io/pdf', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${browserlessToken}`,
      },
      body: JSON.stringify({
        url: templateUrl,
        options: {
          format: 'A4',
          printBackground: true,
          margin: {
            top: '10mm',
            right: '10mm',
            bottom: '10mm',
            left: '10mm',
          },
        },
      }),
    });

    if (!browserlessResponse.ok) {
      const errorText = await browserlessResponse.text();
      console.error('Browserless error:', errorText);
      throw new Error(`Browserless API error: ${browserlessResponse.status} - ${errorText}`);
    }

    const pdfBuffer = await browserlessResponse.arrayBuffer();
    console.log('PDF generated, size:', pdfBuffer.byteLength, 'bytes');

    // Uploader le PDF dans Supabase Storage
    const fileName = `facture-${contractId}-${Date.now()}.pdf`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('location-pdfs')
      .upload(fileName, pdfBuffer, {
        contentType: 'application/pdf',
        upsert: true,
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      throw uploadError;
    }

    console.log('PDF uploaded successfully:', uploadData.path);

    // Générer une URL signée valide 1 heure
    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from('location-pdfs')
      .createSignedUrl(fileName, 3600);

    if (signedUrlError) {
      console.error('Signed URL error:', signedUrlError);
      throw signedUrlError;
    }

    console.log('Invoice PDF generated successfully');

    return new Response(
      JSON.stringify({
        url: signedUrlData.signedUrl,
        fileName: fileName,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in generate-location-facture-pdf:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
