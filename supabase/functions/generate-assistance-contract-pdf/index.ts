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
    console.log('Generating contract PDF for assistance:', assistanceId);

    if (!assistanceId) {
      throw new Error('Assistance ID is required');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const browserlessToken = Deno.env.get('BROWSERLESS_TOKEN');

    if (!browserlessToken) {
      throw new Error('BROWSERLESS_TOKEN is not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Générer l'URL du template de contrat dynamiquement
    const origin = req.headers.get('origin') || 
                   req.headers.get('referer')?.split('/').slice(0, 3).join('/') || 
                   'https://32923ba1-bb0f-4cee-9b16-6c46841649d6.lovableproject.com';
    const templateUrl = `${origin}/assistance-contract-template?id=${assistanceId}&print=true`;
    console.log('Template URL:', templateUrl);

    // Appeler Browserless pour générer le PDF avec token en query param
    console.log('Calling Browserless API...');
    const browserlessUrl = `https://chrome.browserless.io/pdf?token=${browserlessToken}`;
    const browserlessResponse = await fetch(browserlessUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
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
        waitFor: 3000,
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
    const fileName = `contrat-assistance-${assistanceId}-${Date.now()}.pdf`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('assistance-pdfs')
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
      .from('assistance-pdfs')
      .createSignedUrl(fileName, 3600);

    if (signedUrlError) {
      console.error('Signed URL error:', signedUrlError);
      throw signedUrlError;
    }

    console.log('Contract PDF generated successfully');

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
    console.error('Error in generate-assistance-contract-pdf:', error);
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
