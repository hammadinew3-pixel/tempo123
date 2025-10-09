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
      .select(`
        *,
        old_vehicle:vehicles!vehicle_changes_old_vehicle_id_fkey(marque, modele, immatriculation),
        new_vehicle:vehicles!vehicle_changes_new_vehicle_id_fkey(marque, modele, immatriculation)
      `)
      .eq('contract_id', contractId)
      .order('change_date', { ascending: true });

    if (changesError) {
      console.error('Error fetching vehicle changes:', changesError);
    }

    console.log('📋 Vehicle changes found:', vehicleChanges?.length || 0);

    // Generate HTML for the PDF
    const html = generateContractHTML(contract, vehicleChanges || []);

    // Get the origin from the request headers
    const origin = req.headers.get('origin') || 'https://66e40113-c245-4ca2-bcfb-093ee69d0d09.lovableproject.com';
    
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

function generateContractHTML(contract: any, vehicleChanges: any[]): string {
  const client = contract.clients;
  const vehicle = contract.vehicles;

  // Generate vehicle changes section if any exist
  let vehicleChangesHTML = '';
  if (vehicleChanges && vehicleChanges.length > 0) {
    vehicleChangesHTML = `
    <div class="section" style="background-color: #fff8e6; border-color: #ffcc00;">
      <h2 style="color: #ff6600;">⚠️ CHANGEMENT(S) DE VÉHICULE</h2>
      ${vehicleChanges.map((change: any, index: number) => `
        <div style="margin-bottom: 15px; padding: 10px; border-left: 3px solid #ff6600;">
          <p style="font-weight: bold; color: #ff6600;">Changement #${index + 1} - ${new Date(change.change_date).toLocaleDateString('fr-FR')}</p>
          <p><span class="label">Ancien véhicule :</span><span class="value">${change.old_vehicle?.marque} ${change.old_vehicle?.modele} (${change.old_vehicle?.immatriculation})</span></p>
          <p><span class="label">Nouveau véhicule :</span><span class="value">${change.new_vehicle?.marque} ${change.new_vehicle?.modele} (${change.new_vehicle?.immatriculation})</span></p>
          <p><span class="label">Raison :</span><span class="value">${formatReason(change.reason)}</span></p>
          ${change.notes ? `<p><span class="label">Détails :</span><span class="value" style="font-size: 0.9em;">${change.notes}</span></p>` : ''}
        </div>
      `).join('')}
      <p style="margin-top: 15px; padding: 10px; background-color: #e6f7ff; border-radius: 4px;">
        <strong>Note :</strong> Le montant total ci-dessous inclut le calcul au prorata des changements de véhicule effectués.
      </p>
    </div>
    `;
  }

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Contrat ${contract.numero_contrat}</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 40px; line-height: 1.6; }
    h1 { text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; }
    .section { margin: 20px 0; padding: 15px; border: 1px solid #ddd; }
    .label { font-weight: bold; }
    .value { margin-left: 10px; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
    .signature { margin-top: 50px; border-top: 1px solid #000; padding-top: 10px; }
  </style>
</head>
<body>
  <h1>CONTRAT DE LOCATION DE VÉHICULE</h1>
  <p style="text-align: center;"><strong>Contrat N° :</strong> ${contract.numero_contrat}</p>
  
  <div class="section">
    <h2>CLIENT</h2>
    <p><span class="label">Nom :</span><span class="value">${client?.nom} ${client?.prenom || ''}</span></p>
    <p><span class="label">Téléphone :</span><span class="value">${client?.telephone}</span></p>
    ${client?.email ? `<p><span class="label">Email :</span><span class="value">${client?.email}</span></p>` : ''}
  </div>

  <div class="section">
    <h2>VÉHICULE ${vehicleChanges.length > 0 ? '(ACTUEL)' : ''}</h2>
    <p><span class="label">Marque/Modèle :</span><span class="value">${vehicle?.marque} ${vehicle?.modele}</span></p>
    <p><span class="label">Immatriculation :</span><span class="value">${vehicle?.immatriculation}</span></p>
  </div>

  <div class="section">
    <h2>PÉRIODE DE LOCATION</h2>
    <div class="grid">
      <p><span class="label">Date début :</span><span class="value">${new Date(contract.date_debut).toLocaleDateString('fr-FR')}</span></p>
      <p><span class="label">Date fin :</span><span class="value">${new Date(contract.date_fin).toLocaleDateString('fr-FR')}</span></p>
    </div>
    <p><span class="label">Durée :</span><span class="value">${contract.duration} jour(s)</span></p>
  </div>

  ${vehicleChangesHTML}

  <div class="section">
    <h2>DÉTAILS FINANCIERS</h2>
    <p><span class="label">Tarif journalier (actuel) :</span><span class="value">${contract.daily_rate?.toFixed(2)} MAD</span></p>
    <p><span class="label">Montant total :</span><span class="value">${contract.total_amount?.toFixed(2)} MAD</span></p>
    <p><span class="label">Acompte :</span><span class="value">${contract.advance_payment?.toFixed(2)} MAD</span></p>
    <p style="font-size: 1.2em;"><span class="label">Reste à payer :</span><span class="value" style="color: #ff6600;">${contract.remaining_amount?.toFixed(2)} MAD</span></p>
    ${contract.caution_montant ? `<p><span class="label">Caution :</span><span class="value">${contract.caution_montant?.toFixed(2)} MAD</span></p>` : ''}
  </div>

  ${contract.start_location ? `
  <div class="section">
    <h2>LIEUX</h2>
    <p><span class="label">Lieu de départ :</span><span class="value">${contract.start_location}</span></p>
    <p><span class="label">Lieu de retour :</span><span class="value">${contract.end_location || contract.start_location}</span></p>
  </div>` : ''}

  <p style="text-align: center; margin-top: 40px;">
    Fait à ${contract.start_location || 'Casablanca'} le ${new Date().toLocaleDateString('fr-FR')}
  </p>

  <div class="grid" style="margin-top: 60px;">
    <div class="signature">
      <p style="text-align: center;">Signature client</p>
    </div>
    <div class="signature">
      <p style="text-align: center;">Signature agence</p>
    </div>
  </div>
</body>
</html>
  `;
}

function formatReason(reason: string): string {
  const reasons: Record<string, string> = {
    'panne': 'Panne technique',
    'accident': 'Accident',
    'demande_client': 'Demande du client',
    'maintenance': 'Maintenance urgente',
    'autre': 'Autre'
  };
  return reasons[reason] || reason;
}
