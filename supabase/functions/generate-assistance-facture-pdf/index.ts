import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { assistanceId } = await req.json()

    if (!assistanceId) {
      return new Response(
        JSON.stringify({ error: 'assistanceId is required' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const templateUrl = `${req.headers.get('origin') || 'https://32923ba1-bb0f-4cee-9b16-6c46841649d6.lovableproject.com'}/assistance-facture-template?id=${assistanceId}&print=true`
    
    console.log('Generating PDF for URL:', templateUrl)

    // Use Puppeteer Browserless API
    const browserlessUrl = 'https://chrome.browserless.io/pdf?token=YOUR_BROWSERLESS_TOKEN'
    
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
        waitFor: 2000 // Wait for page to fully load
      })
    })

    if (!pdfResponse.ok) {
      throw new Error(`Browserless API error: ${pdfResponse.statusText}`)
    }

    const pdfBuffer = await pdfResponse.arrayBuffer()

    return new Response(pdfBuffer, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="facture-${assistanceId}.pdf"`,
      },
    })
  } catch (error) {
    console.error('Error generating PDF:', error)
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})