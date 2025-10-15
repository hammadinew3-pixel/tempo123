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

    // Get agence settings
    const { data: agenceSettings, error: settingsError } = await supabase
      .from('agence_settings')
      .select('*')
      .single();

    if (settingsError) {
      console.error('Error fetching agence settings:', settingsError);
    }

    console.log('📋 Vehicle changes found:', vehicleChanges?.length || 0);
    console.log('👥 Secondary drivers found:', secondaryDrivers?.length || 0);

    // Generate HTML for the PDF
    const html = generateContractHTML(contract, vehicleChanges || [], secondaryDrivers || [], agenceSettings);

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

function generateContractHTML(contract: any, vehicleChanges: any[], secondaryDrivers: any[], agenceSettings: any): string {
  const client = contract.clients;
  const vehicle = contract.vehicles;
  const prolongations = contract.prolongations || [];

  // Format date helper
  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('fr-FR');
  };

  // Prolongations HTML
  let prolongationsHTML = '';
  if (prolongations.length > 0) {
    prolongationsHTML = `
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 12px;">
        <thead>
          <tr>
            <th colspan="4" style="background-color: #e0e0e0; border: 2px solid #000; padding: 6px; text-align: center; font-weight: bold; font-size: 11pt;">
              PROLONGATION
            </th>
          </tr>
        </thead>
        <tbody>
          ${prolongations.map((p: any, idx: number) => `
            <tr>
              <td colspan="4" style="border: 2px solid #000; padding: 6px;">
                <div style="margin-bottom: 4px; font-size: 9pt;">
                  <strong>Prolongation ${idx + 1}:</strong> Du ${formatDate(p.date_debut)} au ${formatDate(p.date_fin)} - ${p.duree || 0} jour(s) - ${p.montant?.toFixed(0) || 0} DH
                </div>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  }

  // Vehicle changes HTML
  let vehicleChangesHTML = '';
  if (vehicleChanges.length > 0) {
    vehicleChangesHTML = `
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 12px;">
        <thead>
          <tr>
            <th colspan="4" style="background-color: #e0e0e0; border: 2px solid #000; padding: 6px; text-align: center; font-weight: bold; font-size: 11pt;">
              CHANGEMENT DE VÉHICULE
            </th>
          </tr>
        </thead>
        <tbody>
          ${vehicleChanges.map((change: any, idx: number) => `
            <tr>
              <td colspan="4" style="border: 2px solid #000; padding: 6px;">
                <div style="margin-bottom: 4px; font-size: 9pt;">
                  <strong>Changement ${idx + 1}:</strong> ${change.old_vehicle?.immatriculation} → ${change.new_vehicle?.immatriculation} (${formatReason(change.reason)}) - ${formatDate(change.change_date)}
                </div>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  }

  // Secondary drivers HTML
  let secondaryDriversHTML = '';
  if (secondaryDrivers.length > 0) {
    secondaryDriversHTML = secondaryDrivers.map((driver: any) => `
      <tr>
        <td style="border: 2px solid #000; padding: 6px; width: 33%;">
          <div style="margin-bottom: 4px; font-size: 9pt;"><strong>Nom & Prénom:</strong> ${driver.nom} ${driver.prenom || ''}</div>
        </td>
        <td style="border: 2px solid #000; padding: 6px; width: 33%;">
          <div style="margin-bottom: 4px; font-size: 9pt;"><strong>CIN/Passeport:</strong> ${driver.cin || ''}</div>
        </td>
        <td style="border: 2px solid #000; padding: 6px; width: 34%;">
          <div style="margin-bottom: 4px; font-size: 9pt;"><strong>N° Permis:</strong> ${driver.permis_conduire || ''}</div>
        </td>
      </tr>
    `).join('');
  } else {
    secondaryDriversHTML = `
      <tr>
        <td colspan="4" style="border: 2px solid #000; padding: 6px;">
          <div style="margin-bottom: 4px; font-size: 9pt; text-align: center; color: #666;">CIN/Passeport renseigné: _________________</div>
        </td>
      </tr>
    `;
  }

  // Logo HTML
  let logoHTML = '';
  if (!agenceSettings?.masquer_logo && agenceSettings?.logo_url) {
    logoHTML = `<img src="${agenceSettings.logo_url}" alt="Logo" style="height: 56px; width: auto; object-fit: contain;" />`;
  }

  // Header HTML
  let headerHTML = '';
  if (!agenceSettings?.masquer_entete) {
    headerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; padding-bottom: 8px; border-bottom: 2px solid #000;">
        ${logoHTML}
        <div style="flex: 1; text-align: center;">
          <h1 style="font-size: 16pt; font-weight: bold; text-transform: uppercase; margin: 0;">Contrat de Location</h1>
          <div style="font-size: 10pt; font-weight: 600; margin-top: 4px;">N° ${contract.numero_contrat}</div>
        </div>
        <div style="font-size: 8pt; text-align: right; line-height: 1.3; max-width: 140px;">
          ${agenceSettings?.raison_sociale ? `<div style="font-weight: 600;">${agenceSettings.raison_sociale}</div>` : ''}
          ${agenceSettings?.adresse ? `<div>${agenceSettings.adresse}</div>` : ''}
          ${agenceSettings?.telephone ? `<div>Tél: ${agenceSettings.telephone}</div>` : ''}
          ${agenceSettings?.ice ? `<div>ICE: ${agenceSettings.ice}</div>` : ''}
        </div>
      </div>
    `;
  }

  // Footer HTML
  let footerHTML = '';
  if (!agenceSettings?.masquer_pied_page) {
    footerHTML = `
      <div style="text-align: center; font-size: 7pt; color: #666; margin-top: 8px; border-top: 1px solid #ccc; padding-top: 8px;">
        ${agenceSettings?.raison_sociale || ''}
        ${agenceSettings?.ice ? ` | ICE: ${agenceSettings.ice}` : ''}
        ${agenceSettings?.rc ? ` | RC: ${agenceSettings.rc}` : ''}
        ${agenceSettings?.cnss ? ` | CNSS: ${agenceSettings.cnss}` : ''}
        ${agenceSettings?.patente ? ` | Patente: ${agenceSettings.patente}` : ''}
        ${agenceSettings?.if_number ? ` | IF: ${agenceSettings.if_number}` : ''}
        <br/>
        ${agenceSettings?.adresse ? `Adresse: ${agenceSettings.adresse}` : ''}
        ${agenceSettings?.telephone ? ` | Tél: ${agenceSettings.telephone}` : ''}
        ${agenceSettings?.email ? ` | Email: ${agenceSettings.email}` : ''}
      </div>
    `;
  }

  // CGV Page HTML
  let cgvHTML = '';
  if (agenceSettings?.inclure_cgv && agenceSettings?.cgv_texte) {
    cgvHTML = `
      <div style="page-break-before: always; padding: 32px; font-family: Arial, sans-serif; font-size: 10pt; line-height: 1.6;">
        <div style="text-align: center; margin-bottom: 24px; padding-top: 32px;">
          <h2 style="font-size: 16pt; font-weight: bold; text-transform: uppercase; margin: 0;">Conditions Générales de Vente</h2>
        </div>
        <div style="font-size: 9pt; line-height: 1.6; white-space: pre-wrap; text-align: justify;">
          ${agenceSettings.cgv_texte}
        </div>
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
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: Arial, sans-serif; 
      font-size: 9pt;
      line-height: 1.3;
    }
    @page { 
      size: A4 portrait;
      margin: 10mm;
    }
    .field { margin-bottom: 4px; font-size: 9pt; }
    .field strong { font-weight: 600; }
  </style>
</head>
<body>
  <div style="padding: 24px;">
    ${headerHTML}

    <!-- Section CLIENT -->
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 12px;">
      <thead>
        <tr>
          <th colspan="4" style="background-color: #e0e0e0; border: 2px solid #000; padding: 6px; text-align: center; font-weight: bold; font-size: 11pt;">CLIENT</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td style="border: 2px solid #000; padding: 6px; width: 25%;">
            <div class="field"><strong>Compagnie:</strong> ${client?.type === 'entreprise' ? client?.nom : ''}</div>
          </td>
          <td style="border: 2px solid #000; padding: 6px; width: 25%;">
            <div class="field"><strong>Nom:</strong> ${client?.nom || ''}</div>
          </td>
          <td style="border: 2px solid #000; padding: 6px; width: 25%;">
            <div class="field"><strong>Prénom:</strong> ${client?.prenom || ''}</div>
          </td>
          <td style="border: 2px solid #000; padding: 6px; width: 25%;">
            <div class="field"><strong>Adresse:</strong> ${client?.adresse || ''}</div>
          </td>
        </tr>
        <tr>
          <td style="border: 2px solid #000; padding: 6px;">
            <div class="field"><strong>CIN N°:</strong> ${client?.cin || ''}</div>
          </td>
          <td style="border: 2px solid #000; padding: 6px;">
            <div class="field"><strong>N° Permis:</strong> ${client?.permis_conduire || ''}</div>
          </td>
          <td style="border: 2px solid #000; padding: 6px;">
            <div class="field"><strong>N° Passeport:</strong></div>
          </td>
          <td style="border: 2px solid #000; padding: 6px;">
            <div class="field"><strong>Réf dossier:</strong> ${contract.numero_contrat}</div>
          </td>
        </tr>
        <tr>
          <td colspan="4" style="border: 2px solid #000; padding: 6px;">
            <div class="field"><strong>GSM:</strong> ${client?.telephone || ''}</div>
          </td>
        </tr>
      </tbody>
    </table>

    <!-- Section VOITURE -->
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 12px;">
      <thead>
        <tr>
          <th colspan="4" style="background-color: #e0e0e0; border: 2px solid #000; padding: 6px; text-align: center; font-weight: bold; font-size: 11pt;">VOITURE</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td style="border: 2px solid #000; padding: 6px; width: 25%;">
            <div class="field"><strong>Marque:</strong> ${vehicle?.marque || ''}</div>
          </td>
          <td style="border: 2px solid #000; padding: 6px; width: 25%;">
            <div class="field"><strong>Immatriculation:</strong> ${vehicle?.immatriculation || ''}</div>
          </td>
          <td style="border: 2px solid #000; padding: 6px; width: 25%;">
            <div class="field"><strong>Km Départ:</strong> ${contract.delivery_km || vehicle?.kilometrage || ''}</div>
          </td>
          <td style="border: 2px solid #000; padding: 6px; width: 25%;">
            <div class="field"><strong>Carburant:</strong> ${contract.delivery_fuel_level || ''}</div>
          </td>
        </tr>
        <tr>
          <td colspan="2" style="border: 2px solid #000; padding: 6px;">
            <div class="field"><strong>Lieu Départ:</strong> ${contract.start_location || ''}</div>
          </td>
          <td colspan="2" style="border: 2px solid #000; padding: 6px;">
            <div class="field"><strong>Lieu Retour:</strong> ${contract.end_location || contract.start_location || ''}</div>
          </td>
        </tr>
        <tr>
          <td style="border: 2px solid #000; padding: 6px;">
            <div class="field"><strong>Date:</strong> ${formatDate(contract.date_debut)}</div>
          </td>
          <td style="border: 2px solid #000; padding: 6px;">
            <div class="field"><strong>Heure:</strong> ${contract.start_time || ''}</div>
          </td>
          <td style="border: 2px solid #000; padding: 6px;">
            <div class="field"><strong>Lieu:</strong> ${contract.start_location || ''}</div>
          </td>
          <td style="border: 2px solid #000; padding: 6px;">
            <div class="field"><strong>Durée:</strong> ${contract.daily_rate?.toFixed(0) || 0} DH x ${contract.duration || 0}j = ${contract.total_amount?.toFixed(0) || 0} DH</div>
          </td>
        </tr>
      </tbody>
    </table>

    ${prolongationsHTML}
    ${vehicleChangesHTML}

    <!-- Section AUTRES CONDUCTEURS -->
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 12px;">
      <thead>
        <tr>
          <th colspan="4" style="background-color: #e0e0e0; border: 2px solid #000; padding: 6px; text-align: center; font-weight: bold; font-size: 11pt;">AUTRES CONDUCTEURS</th>
        </tr>
      </thead>
      <tbody>
        ${secondaryDriversHTML}
      </tbody>
    </table>

    <!-- Section AGENCES -->
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 12px;">
      <thead>
        <tr>
          <th style="background-color: #e0e0e0; border: 2px solid #000; padding: 6px; text-align: center; font-weight: bold; font-size: 11pt; width: 50%;">Agence Départ</th>
          <th style="background-color: #e0e0e0; border: 2px solid #000; padding: 6px; text-align: center; font-weight: bold; font-size: 11pt; width: 50%;">Agence Retour</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td style="border: 2px solid #000; padding: 6px;">
            <div class="field">${contract.start_location || agenceSettings?.raison_sociale || ''}</div>
          </td>
          <td style="border: 2px solid #000; padding: 6px;">
            <div class="field">${contract.end_location || contract.start_location || agenceSettings?.raison_sociale || ''}</div>
          </td>
        </tr>
      </tbody>
    </table>

    <!-- Section MODE DE RÈGLEMENT -->
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 12px;">
      <thead>
        <tr>
          <th colspan="3" style="background-color: #e0e0e0; border: 2px solid #000; padding: 6px; text-align: center; font-weight: bold; font-size: 11pt;">MODE DE RÈGLEMENT</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td style="border: 2px solid #000; padding: 6px; width: 33%; text-align: center;">
            <div class="field">
              <input type="checkbox" ${contract.payment_method === 'especes' ? 'checked' : ''} /> Espèces
            </div>
          </td>
          <td style="border: 2px solid #000; padding: 6px; width: 33%; text-align: center;">
            <div class="field">
              <input type="checkbox" ${contract.payment_method === 'cheque' ? 'checked' : ''} /> Chèque
            </div>
          </td>
          <td style="border: 2px solid #000; padding: 6px; width: 34%; text-align: center;">
            <div class="field">
              <input type="checkbox" ${contract.payment_method && !['especes', 'cheque'].includes(contract.payment_method) ? 'checked' : ''} /> Autres
            </div>
          </td>
        </tr>
      </tbody>
    </table>

    <!-- Diagramme véhicule + Observations -->
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 12px;">
      <thead>
        <tr>
          <th style="background-color: #e0e0e0; border: 2px solid #000; padding: 6px; text-align: center; font-weight: bold; font-size: 11pt; width: 50%;">DIAGRAMME DU VÉHICULE</th>
          <th style="background-color: #e0e0e0; border: 2px solid #000; padding: 6px; text-align: center; font-weight: bold; font-size: 11pt; width: 50%;">OBSERVATIONS</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td style="border: 2px solid #000; padding: 6px; height: 180px; vertical-align: top;">
            <svg viewBox="0 0 200 120" style="width: 100%; height: 100%;">
              <rect x="40" y="20" width="120" height="80" fill="none" stroke="#000" stroke-width="2" rx="8"/>
              <rect x="50" y="10" width="100" height="15" fill="none" stroke="#000" stroke-width="1.5"/>
              <rect x="50" y="95" width="100" height="15" fill="none" stroke="#000" stroke-width="1.5"/>
              <circle cx="60" cy="30" r="8" fill="none" stroke="#000" stroke-width="1.5"/>
              <circle cx="140" cy="30" r="8" fill="none" stroke="#000" stroke-width="1.5"/>
              <circle cx="60" cy="90" r="8" fill="none" stroke="#000" stroke-width="1.5"/>
              <circle cx="140" cy="90" r="8" fill="none" stroke="#000" stroke-width="1.5"/>
              <text x="100" y="65" text-anchor="middle" font-size="10" fill="#666">Vue dessus</text>
            </svg>
          </td>
          <td style="border: 2px solid #000; padding: 6px; height: 180px; vertical-align: top;">
            <div style="font-size: 8pt; white-space: pre-wrap; height: 100%; overflow: hidden;">
              ${contract.delivery_notes || contract.notes || 'Aucune observation'}
            </div>
          </td>
        </tr>
      </tbody>
    </table>

    <!-- Signatures -->
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 12px;">
      <thead>
        <tr>
          <th style="background-color: #e0e0e0; border: 2px solid #000; padding: 6px; text-align: center; font-weight: bold; font-size: 11pt; width: 33%;">Signature Agence</th>
          <th style="background-color: #e0e0e0; border: 2px solid #000; padding: 6px; text-align: center; font-weight: bold; font-size: 11pt; width: 33%;">Signature Client</th>
          <th style="background-color: #e0e0e0; border: 2px solid #000; padding: 6px; text-align: center; font-weight: bold; font-size: 11pt; width: 34%;">Signature 2ème Conducteur</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td style="border: 2px solid #000; padding: 6px; height: 60px; vertical-align: bottom; text-align: center;">
            ${contract.signed_at ? `<div style="font-size: 7pt; color: #666;">Signé le ${formatDate(contract.signed_at)}</div>` : ''}
          </td>
          <td style="border: 2px solid #000; padding: 6px; height: 60px; vertical-align: bottom; text-align: center;"></td>
          <td style="border: 2px solid #000; padding: 6px; height: 60px; vertical-align: bottom; text-align: center;"></td>
        </tr>
      </tbody>
    </table>

    ${footerHTML}
  </div>

  ${cgvHTML}
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
