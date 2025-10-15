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

    console.log('📄 Generating contract PDF for:', contractId);

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

    console.log('✅ Contract data loaded successfully');

    // Generate HTML for PDF
    const formatDate = (date: string | null) => {
      if (!date) return 'N/A';
      return new Date(date).toLocaleDateString('fr-FR');
    };

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Contrat ${contract.numero_contrat}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; font-size: 12px; }
    .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #000; padding-bottom: 10px; }
    .header h1 { margin: 0; font-size: 20px; }
    .section { margin-bottom: 20px; border: 1px solid #ddd; padding: 15px; }
    .section h2 { margin: 0 0 10px 0; font-size: 14px; border-bottom: 1px solid #ddd; padding-bottom: 5px; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
    .info-item { margin-bottom: 8px; }
    .info-label { font-weight: bold; }
    .footer { margin-top: 30px; border-top: 2px solid #000; padding-top: 10px; text-align: center; font-size: 10px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>CONTRAT DE LOCATION</h1>
    <p>N° ${contract.numero_contrat}</p>
    ${agenceSettings?.nom ? `<p>${agenceSettings.nom}</p>` : ''}
    ${agenceSettings?.adresse ? `<p>${agenceSettings.adresse}</p>` : ''}
    ${agenceSettings?.telephone ? `<p>Tél: ${agenceSettings.telephone}</p>` : ''}
  </div>

  <div class="section">
    <h2>Client</h2>
    <div class="info-grid">
      <div class="info-item"><span class="info-label">Nom:</span> ${contract.clients?.nom || ''} ${contract.clients?.prenom || ''}</div>
      <div class="info-item"><span class="info-label">Téléphone:</span> ${contract.clients?.telephone || 'N/A'}</div>
      <div class="info-item"><span class="info-label">Email:</span> ${contract.clients?.email || 'N/A'}</div>
      <div class="info-item"><span class="info-label">CIN:</span> ${contract.clients?.cin || 'N/A'}</div>
      <div class="info-item"><span class="info-label">Permis:</span> ${contract.clients?.permis_conduire || 'N/A'}</div>
      <div class="info-item"><span class="info-label">Adresse:</span> ${contract.clients?.adresse || 'N/A'}</div>
    </div>
  </div>

  <div class="section">
    <h2>Véhicule</h2>
    <div class="info-grid">
      <div class="info-item"><span class="info-label">Immatriculation:</span> ${contract.vehicles?.immatriculation || 'N/A'}</div>
      <div class="info-item"><span class="info-label">Marque:</span> ${contract.vehicles?.marque || 'N/A'}</div>
      <div class="info-item"><span class="info-label">Modèle:</span> ${contract.vehicles?.modele || 'N/A'}</div>
      <div class="info-item"><span class="info-label">Année:</span> ${contract.vehicles?.annee || 'N/A'}</div>
      <div class="info-item"><span class="info-label">Catégorie:</span> ${contract.vehicles?.categorie || 'N/A'}</div>
    </div>
  </div>

  <div class="section">
    <h2>Période de Location</h2>
    <div class="info-grid">
      <div class="info-item"><span class="info-label">Date début:</span> ${formatDate(contract.date_debut)}</div>
      <div class="info-item"><span class="info-label">Date fin:</span> ${formatDate(contract.date_fin)}</div>
      <div class="info-item"><span class="info-label">Lieu départ:</span> ${contract.start_location || 'N/A'}</div>
      <div class="info-item"><span class="info-label">Lieu retour:</span> ${contract.end_location || 'N/A'}</div>
    </div>
  </div>

  <div class="section">
    <h2>Conditions Financières</h2>
    <div class="info-grid">
      <div class="info-item"><span class="info-label">Montant total:</span> ${contract.total_amount || 0} DH</div>
      <div class="info-item"><span class="info-label">Avance:</span> ${contract.advance_payment || 0} DH</div>
      <div class="info-item"><span class="info-label">Caution:</span> ${contract.caution_montant || 0} DH</div>
      <div class="info-item"><span class="info-label">Reste à payer:</span> ${contract.remaining_amount || 0} DH</div>
      <div class="info-item"><span class="info-label">Mode paiement:</span> ${contract.payment_method || 'N/A'}</div>
    </div>
  </div>

  ${secondaryDrivers && secondaryDrivers.length > 0 ? `
  <div class="section">
    <h2>Conducteurs Secondaires</h2>
    ${secondaryDrivers.map((driver: any, i: number) => `
      <div style="margin-bottom: 10px;">
        <strong>Conducteur ${i + 1}:</strong> ${driver.nom} ${driver.prenom} - CIN: ${driver.cin || 'N/A'} - Permis: ${driver.permis_conduire || 'N/A'}
      </div>
    `).join('')}
  </div>
  ` : ''}

  ${vehicleChanges && vehicleChanges.length > 0 ? `
  <div class="section">
    <h2>Historique des Changements de Véhicule</h2>
    ${vehicleChanges.map((change: any, i: number) => `
      <div style="margin-bottom: 10px;">
        <strong>Changement ${i + 1}</strong> - ${formatDate(change.change_date)}<br>
        De: ${change.old_vehicle?.immatriculation || 'N/A'} → À: ${change.new_vehicle?.immatriculation || 'N/A'}<br>
        Raison: ${change.reason || 'N/A'}
      </div>
    `).join('')}
  </div>
  ` : ''}

  ${contract.notes ? `
  <div class="section">
    <h2>Notes</h2>
    <p>${contract.notes}</p>
  </div>
  ` : ''}

  <div class="footer">
    <p>Document généré le ${new Date().toLocaleDateString('fr-FR')} - Contrat N° ${contract.numero_contrat}</p>
    <div style="margin-top: 30px; display: flex; justify-content: space-between;">
      <div>
        <p>Signature du client</p>
        <div style="border-top: 1px solid #000; width: 150px; margin-top: 40px;"></div>
      </div>
      <div>
        <p>Signature de l'agence</p>
        <div style="border-top: 1px solid #000; width: 150px; margin-top: 40px;"></div>
      </div>
    </div>
  </div>
</body>
</html>
    `;

    // For now, we return the template URL as before
    // In a future enhancement, we can add server-side PDF generation
    const origin = req.headers.get('origin') || req.headers.get('referer')?.split('/').slice(0, 3).join('/') || 'https://66e40113-c245-4ca2-bcfb-093ee69d0d09.lovableproject.com';
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
        htmlContent, // Include HTML content for client-side rendering
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
