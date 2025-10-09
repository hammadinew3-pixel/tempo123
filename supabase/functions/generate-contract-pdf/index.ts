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
      <tr>
        <td colspan="2" style="background-color: #fff8e6; border: 2px solid #ffcc00; padding: 15px;">
          <div style="color: #ff6600; font-weight: bold; margin-bottom: 10px;">⚠️ CHANGEMENT(S) DE VÉHICULE</div>
          ${vehicleChanges.map((change: any, index: number) => `
            <div style="margin-bottom: 10px; padding: 8px; border-left: 3px solid #ff6600; background-color: #fff;">
              <div style="font-weight: bold; color: #ff6600; margin-bottom: 5px;">Changement #${index + 1} - ${new Date(change.change_date).toLocaleDateString('fr-FR')}</div>
              <div style="font-size: 0.9em;">
                <strong>Ancien véhicule:</strong> ${change.old_vehicle?.marque} ${change.old_vehicle?.modele} (${change.old_vehicle?.immatriculation})<br/>
                <strong>Nouveau véhicule:</strong> ${change.new_vehicle?.marque} ${change.new_vehicle?.modele} (${change.new_vehicle?.immatriculation})<br/>
                <strong>Raison:</strong> ${formatReason(change.reason)}<br/>
                ${change.notes ? `<strong>Détails:</strong> <span style="font-size: 0.85em;">${change.notes}</span>` : ''}
              </div>
            </div>
          `).join('')}
          <div style="margin-top: 10px; padding: 8px; background-color: #e6f7ff; border-radius: 4px; font-size: 0.9em;">
            <strong>Note:</strong> Le montant total ci-dessous inclut le calcul au prorata des changements de véhicule effectués.
          </div>
        </td>
      </tr>
    `;
  }

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Contrat ${contract.numero_contrat}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: Arial, sans-serif; 
      padding: 30px; 
      line-height: 1.4;
      font-size: 11pt;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
      padding-bottom: 10px;
      border-bottom: 2px solid #000;
    }
    .header h1 {
      font-size: 18pt;
      font-weight: bold;
    }
    .header .date {
      font-size: 10pt;
      color: #666;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
    }
    th {
      background-color: #d9d9d9;
      border: 1px solid #000;
      padding: 8px;
      text-align: center;
      font-weight: bold;
      font-size: 12pt;
    }
    td {
      border: 1px solid #000;
      padding: 12px;
      vertical-align: top;
    }
    .field {
      margin-bottom: 6px;
      font-size: 10pt;
    }
    .field strong {
      font-weight: bold;
    }
    .footer {
      margin-top: 30px;
      font-size: 9pt;
      text-align: center;
      font-style: italic;
      margin-bottom: 30px;
    }
    .signatures {
      display: flex;
      justify-content: space-between;
      margin-top: 40px;
      margin-bottom: 30px;
    }
    .signature-box {
      width: 45%;
      text-align: center;
      padding-top: 60px;
      border-bottom: 1px solid #000;
    }
    .company-info {
      text-align: center;
      font-size: 9pt;
      margin-top: 20px;
      color: #666;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>CONTRAT DE LOCATION N° ${contract.numero_contrat}</h1>
    <div class="date">Édité le ${new Date().toLocaleDateString('fr-FR')}</div>
  </div>

  <table>
    <tr>
      <th>LOCATAIRE</th>
      <th>DEUXIÈME CONDUCTEUR</th>
    </tr>
    <tr>
      <td>
        <div class="field"><strong>Nom & Prénom:</strong> ${client?.nom || ''} ${client?.prenom || ''}</div>
        <div class="field"><strong>CIN N°:</strong> ${client?.cin || ''}</div>
        <div class="field"><strong>Permis de conduire N°:</strong> ${client?.permis_conduire || ''}</div>
        <div class="field"><strong>Délivré le:</strong> ${contract.date_debut ? new Date(contract.date_debut).toLocaleDateString('fr-FR') : ''}</div>
        <div class="field"><strong>Passeport N°:</strong></div>
        <div class="field"><strong>Adresse:</strong> ${client?.adresse || ''}</div>
        <div class="field"><strong>Tél:</strong> ${client?.telephone || ''}</div>
      </td>
      <td>
        <div class="field"><strong>Nom & Prénom:</strong></div>
        <div class="field"><strong>CIN N°:</strong></div>
        <div class="field"><strong>Permis de conduire N°:</strong></div>
        <div class="field"><strong>Délivré le:</strong></div>
        <div class="field"><strong>Passeport N°:</strong></div>
        <div class="field"><strong>Adresse:</strong></div>
        <div class="field"><strong>Tél:</strong></div>
      </td>
    </tr>
  </table>

  <table>
    <tr>
      <th>VÉHICULE</th>
      <th>LOCATION</th>
    </tr>
    <tr>
      <td>
        <div class="field"><strong>Marque/Modèle:</strong> ${vehicle?.marque || ''} - ${vehicle?.modele || ''}</div>
        <div class="field"><strong>Immatriculation:</strong> ${vehicle?.immatriculation || ''}</div>
        <div class="field"><strong>Carburant:</strong> Diesel</div>
        <div class="field"><strong>Km départ:</strong> ${contract.delivery_km || vehicle?.kilometrage || ''} KMs</div>
      </td>
      <td>
        <div class="field"><strong>Date de départ:</strong> ${contract.date_debut ? new Date(contract.date_debut).toLocaleDateString('fr-FR') : ''} ${contract.start_time || ''}</div>
        <div class="field"><strong>Date de retour:</strong> ${contract.date_fin ? new Date(contract.date_fin).toLocaleDateString('fr-FR') : ''} ${contract.end_time || ''}</div>
        <div class="field"><strong>Durée de location:</strong> ${contract.duration || 0} jour(s)</div>
        <div class="field"><strong>Prix total (TTC):</strong> ${contract.total_amount?.toFixed(2) || '0.00'} Dh</div>
        <div class="field"><strong>Lieu de départ:</strong> ${contract.start_location || ''}</div>
        <div class="field"><strong>Lieu de retour:</strong> ${contract.end_location || contract.start_location || ''}</div>
      </td>
    </tr>
  </table>

  ${vehicleChangesHTML ? `<table>${vehicleChangesHTML}</table>` : ''}

  <table>
    <tr>
      <th>ÉTAT DE VÉHICULE</th>
      <th>OBSERVATIONS</th>
    </tr>
    <tr>
      <td style="height: 200px; text-align: center; vertical-align: middle;">
        <div style="font-size: 9pt; color: #666;">
          Schéma d'inspection du véhicule<br/>
          (À compléter lors de la remise des clés)
        </div>
      </td>
      <td style="height: 200px;">
        <div class="field" style="height: 100%;">
          ${contract.delivery_notes || contract.notes || ''}
        </div>
      </td>
    </tr>
  </table>

  <div class="footer">
    * En signant le contrat de location, le client accepte les conditions générales de location fournies par le loueur professionnel.
  </div>

  <div class="signatures">
    <div class="signature-box">
      <strong>Signature agence :</strong>
    </div>
    <div class="signature-box">
      <strong>Signature locataire :</strong>
    </div>
  </div>

  <div class="company-info">
    Luxeauto | ICE: 344569385000157<br/>
    Adresse: Casablanca, Maroc
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
