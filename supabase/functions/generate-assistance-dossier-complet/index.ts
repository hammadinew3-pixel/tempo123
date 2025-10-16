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
    const { assistanceId } = await req.json();
    console.log('Generating dossier complet for assistance:', assistanceId);

    if (!assistanceId) {
      throw new Error('assistanceId is required');
    }

    const BROWSERLESS_TOKEN = Deno.env.get('BROWSERLESS_TOKEN');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');

    if (!BROWSERLESS_TOKEN) {
      throw new Error('BROWSERLESS_TOKEN not configured');
    }

    // Construct template URL
    const templateUrl = `${SUPABASE_URL?.replace('.supabase.co', '.lovableproject.com') || ''}/assistance-complet-template?id=${assistanceId}&download=true`;
    console.log('Template URL:', templateUrl);

    // Call Browserless to generate PDF
    const pdfResponse = await fetch('https://chrome.browserless.io/pdf?token=' + BROWSERLESS_TOKEN, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: templateUrl,
        options: {
          displayHeaderFooter: false,
          printBackground: true,
          format: 'A4',
          margin: {
            top: '0mm',
            right: '0mm',
            bottom: '0mm',
            left: '0mm',
          },
        },
      }),
    });

    if (!pdfResponse.ok) {
      const errorText = await pdfResponse.text();
      console.error('Browserless error:', errorText);
      throw new Error(`Failed to generate PDF: ${pdfResponse.statusText}`);
    }

    const pdfBuffer = await pdfResponse.arrayBuffer();
    console.log('PDF generated, size:', pdfBuffer.byteLength);

    // Upload to Supabase Storage
    const fileName = `dossier-complet-${assistanceId}-${Date.now()}.pdf`;
    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { error: uploadError } = await supabase.storage
      .from('assistance-pdfs')
      .upload(fileName, pdfBuffer, {
        contentType: 'application/pdf',
        upsert: false,
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      throw uploadError;
    }

    console.log('PDF uploaded to storage:', fileName);

    // Create signed URL
    const { data: signedData, error: signedError } = await supabase.storage
      .from('assistance-pdfs')
      .createSignedUrl(fileName, 3600);

    if (signedError) {
      console.error('Signed URL error:', signedError);
      throw signedError;
    }

    console.log('Signed URL created');

    return new Response(
      JSON.stringify({
        url: signedData.signedUrl,
        fileName: fileName,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Error generating dossier complet:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
