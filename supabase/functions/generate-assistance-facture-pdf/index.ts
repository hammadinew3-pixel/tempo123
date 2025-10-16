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
    const { assistanceId, assistanceIds } = await req.json();

    if (!assistanceId && !assistanceIds) {
      throw new Error('Assistance ID or IDs are required');
    }

    const isGrouped = !!assistanceIds;
    const ids = isGrouped ? assistanceIds.split(',') : [assistanceId];

    console.log('📄 Generating assistance facture PDF for:', ids);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const browserlessToken = Deno.env.get('BROWSERLESS_TOKEN');

    if (!browserlessToken) {
      throw new Error('BROWSERLESS_TOKEN is not configured');
    }

    // Generate the template URL
    const origin = req.headers.get('origin') || req.headers.get('referer')?.split('/').slice(0, 3).join('/') || 'https://32923ba1-bb0f-4cee-9b16-6c46841649d6.lovableproject.com';
    const templateUrl = isGrouped 
      ? `${origin}/assistance-facture-template?ids=${assistanceIds}&print=true`
      : `${origin}/assistance-facture-template?id=${assistanceId}&print=true`;

    console.log('📄 Template URL:', templateUrl);

    // Generate PDF using Browserless
    const browserlessUrl = `https://chrome.browserless.io/pdf?token=${browserlessToken}`;
    
    const pdfResponse = await fetch(browserlessUrl, {
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
            left: '10mm'
          }
        },
        waitFor: 3000 // Wait for page to fully load
      })
    });

    if (!pdfResponse.ok) {
      const errorText = await pdfResponse.text();
      console.error('Browserless error:', errorText);
      throw new Error(`Browserless API error: ${pdfResponse.statusText}`);
    }

    const pdfBuffer = await pdfResponse.arrayBuffer();

    // Store PDF in Supabase Storage
    const supabase = createClient(supabaseUrl, supabaseKey);
    const fileName = isGrouped 
      ? `facture-groupee-${Date.now()}.pdf`
      : `facture-${assistanceId}-${Date.now()}.pdf`;
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('assistance-pdfs')
      .upload(fileName, pdfBuffer, {
        contentType: 'application/pdf',
        upsert: false
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      throw uploadError;
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('assistance-pdfs')
      .getPublicUrl(fileName);

    console.log('✅ PDF generated and stored successfully:', publicUrl);

    // Return the PDF directly for download
    return new Response(pdfBuffer, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    });
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