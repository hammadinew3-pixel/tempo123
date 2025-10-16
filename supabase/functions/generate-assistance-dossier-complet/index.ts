import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function generateWithBrowserless(templateUrl: string, browserlessToken: string): Promise<ArrayBuffer> {
  const pdfResponse = await fetch('https://chrome.browserless.io/pdf?token=' + browserlessToken, {
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
    throw new Error(`Failed to generate PDF with Browserless: ${pdfResponse.statusText}`);
  }

  return await pdfResponse.arrayBuffer();
}

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

    const HTML2PDF_APP_KEY = Deno.env.get('HTML2PDF_APP_KEY');
    const BROWSERLESS_TOKEN = Deno.env.get('BROWSERLESS_TOKEN');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');

    // Construct template URL
    const templateUrl = `${SUPABASE_URL?.replace('.supabase.co', '.lovableproject.com') || ''}/assistance-complet-template?id=${assistanceId}&download=true`;
    console.log('Template URL:', templateUrl);

    let pdfBuffer: ArrayBuffer;

    // Try html2pdf.app first if API key is available
    if (HTML2PDF_APP_KEY) {
      console.log('Using html2pdf.app for PDF generation');
      
      try {
        const html2pdfUrl = `https://api.html2pdf.app/v1/generate?apiKey=${HTML2PDF_APP_KEY}&html=${encodeURIComponent(templateUrl)}&pageSize=A4&orientation=portrait&margin=10&printBackground=true`;
        
        const pdfResponse = await fetch(html2pdfUrl, {
          method: 'GET',
        });

        if (!pdfResponse.ok) {
          const errorText = await pdfResponse.text();
          console.error('html2pdf.app error:', errorText);
          throw new Error(`html2pdf.app failed: ${pdfResponse.statusText}`);
        }

        pdfBuffer = await pdfResponse.arrayBuffer();
        console.log('PDF generated with html2pdf.app, size:', pdfBuffer.byteLength);
      } catch (error) {
        console.error('html2pdf.app failed, trying Browserless fallback:', error);
        
        // Fallback to Browserless
        if (!BROWSERLESS_TOKEN) {
          throw new Error('Both HTML2PDF_APP_KEY and BROWSERLESS_TOKEN failed/unavailable');
        }
        
        pdfBuffer = await generateWithBrowserless(templateUrl, BROWSERLESS_TOKEN);
        console.log('PDF generated with Browserless (fallback), size:', pdfBuffer.byteLength);
      }
    } else if (BROWSERLESS_TOKEN) {
      console.log('Using Browserless for PDF generation');
      pdfBuffer = await generateWithBrowserless(templateUrl, BROWSERLESS_TOKEN);
      console.log('PDF generated with Browserless, size:', pdfBuffer.byteLength);
    } else {
      throw new Error('No PDF generation service configured (HTML2PDF_APP_KEY or BROWSERLESS_TOKEN required)');
    }

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
