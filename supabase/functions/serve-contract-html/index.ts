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
    const url = new URL(req.url);
    const contractId = url.searchParams.get('id');
    const blankMode = url.searchParams.get('blank') === 'true';
    
    if (!contractId && !blankMode) {
      throw new Error('Contract ID required');
    }

    // Créer client Supabase avec service role key
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    let contractData: any = null;
    let settingsData: any = null;

    if (blankMode) {
      // Charger seulement les settings pour le contrat vierge
      const { data } = await supabase
        .from('tenant_settings')
        .select('*')
        .limit(1)
        .single();
      settingsData = data;
    } else {
      // Charger toutes les données du contrat
      const [contractRes, changesRes, driversRes, paymentsRes, settingsRes] = await Promise.all([
        supabase
          .from('contracts')
          .select('*, clients(*), vehicles(*)')
          .eq('id', contractId)
          .single(),
        supabase
          .from('vehicle_changes')
          .select('*, old_vehicle:vehicles!vehicle_changes_old_vehicle_id_fkey(*), new_vehicle:vehicles!vehicle_changes_new_vehicle_id_fkey(*)')
          .eq('contract_id', contractId)
          .order('change_date', { ascending: true }),
        supabase
          .from('secondary_drivers')
          .select('*')
          .eq('contract_id', contractId),
        supabase
          .from('contract_payments')
          .select('*')
          .eq('contract_id', contractId)
          .order('date_paiement', { ascending: true }),
        supabase
          .from('tenant_settings')
          .select('*')
          .eq('tenant_id', (await supabase.from('contracts').select('tenant_id').eq('id', contractId).single()).data?.tenant_id)
          .single()
      ]);

      if (contractRes.error) {
        console.error('Contract not found:', contractRes.error);
        throw new Error('Contract not found');
      }

      contractData = {
        ...contractRes.data,
        vehicle_changes: changesRes.data || [],
        secondary_drivers: driversRes.data || [],
        payments: paymentsRes.data || []
      };
      settingsData = settingsRes.data;
    }

    // Générer le HTML
    const html = generateContractHTML(contractData, settingsData, blankMode);

    return new Response(html, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/html; charset=utf-8',
      },
    });
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      `<!DOCTYPE html><html><body><h1>Erreur</h1><p>${error instanceof Error ? error.message : 'Unknown error'}</p></body></html>`,
      {
        headers: { ...corsHeaders, 'Content-Type': 'text/html' },
        status: 400,
      }
    );
  }
});

function generateContractHTML(contract: any, settings: any, blankMode: boolean): string {
  const formatDate = (date: string | null) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString('fr-FR');
  };

  const formatReason = (reason: string) => {
    const reasons: Record<string, string> = {
      'panne': 'Panne technique',
      'accident': 'Accident',
      'demande_client': 'Demande du client',
      'maintenance': 'Maintenance urgente',
      'autre': 'Autre'
    };
    return reasons[reason] || reason;
  };

  const ph = (text = '') => blankMode ? '' : text;
  const client = contract?.clients;
  const vehicle = contract?.vehicles;
  const secondaryDriver = contract?.secondary_drivers?.[0];
  const vehicleChanges = contract?.vehicle_changes || [];
  const payments = contract?.payments || [];
  
  // Calcul durée
  const calculateDuration = (start: string, end: string) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    return Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  };
  
  const duration = contract?.duration || (contract ? calculateDuration(contract.date_debut, contract.date_fin) : 0);
  const dailyRate = contract?.daily_rate || vehicle?.tarif_journalier || 0;
  const totalAmount = contract?.total_amount || (duration * dailyRate);
  const paidAmount = payments.reduce((sum: number, p: any) => sum + parseFloat(p.montant || 0), 0);
  const remainingAmount = Math.max(0, totalAmount - paidAmount);
  
  const hasCgvPage = Boolean(
    settings?.inclure_cgv &&
    settings?.cgv_texte &&
    settings.cgv_texte.trim().length > 0
  );

  // URL du diagramme d'inspection (image statique)
  const inspectionDiagramUrl = `${Deno.env.get('SUPABASE_URL')}/storage/v1/object/public/documents_vehicules/default-inspection-diagram.png`;


  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Contrat de Location</title>
  <style>
    @page { 
      size: A4 portrait;
      margin: 10mm;
    }
    @media print {
      body { margin: 0; padding: 0; }
      .page-break-before { 
        page-break-before: always;
      }
    }
    * { 
      margin: 0; 
      padding: 0; 
      box-sizing: border-box; 
    }
    body { 
      font-family: Arial, Helvetica, sans-serif; 
      font-size: 11pt; 
      line-height: 1.4; 
      color: #000; 
    }
    #contract-content {
      width: 100%;
      max-width: 190mm;
      margin: auto;
      overflow: hidden;
    }
    .contract-page {
      width: 190mm;
      min-height: 277mm;
      overflow: visible;
      padding: 1.5cm 2cm 0.7cm 2cm;
      background: white;
      display: flex;
      flex-direction: column;
    }
    .cgv-page {
      width: 190mm;
      min-height: 277mm;
      padding: 10mm;
    }
    .header {
      margin-bottom: 8px;
      padding-bottom: 5px;
      border-bottom: 2px solid #000;
      margin-top: -35px;
    }
    .header-flex {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }
    .header-left {
      width: 30%;
      font-size: 10pt;
      font-weight: bold;
    }
    .logo-container {
      width: 100%;
      margin-top: -20px;
    }
    .logo {
      height: 70px;
      width: auto;
      object-fit: contain;
    }
    .header-center {
      flex: 1;
      text-align: center;
      padding-top: 5px;
    }
    .header-right {
      width: 20%;
      text-align: right;
      font-size: 9pt;
      padding-top: 5px;
    }
    .grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
      margin-bottom: 8px;
    }
    .box {
      border: 2px solid #000;
    }
    .box-header {
      background: #e0e0e0;
      border-bottom: 2px solid #000;
      padding: 5px;
      text-align: center;
      font-weight: bold;
      font-size: 11pt;
    }
    .box-content {
      padding: 8px;
    }
    .info-line {
      font-size: 9pt;
      margin-bottom: 4px;
    }
    .info-label {
      font-weight: bold;
    }
    .info-grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }
    .alert-box {
      border: 2px solid #d97706;
      background: #fef3c7;
      margin-bottom: 12px;
    }
    .alert-header {
      background: #fde68a;
      border-bottom: 2px solid #d97706;
      padding: 6px;
      text-align: center;
      font-weight: bold;
      font-size: 10pt;
    }
    .vehicle-change-box {
      border: 2px solid #ea580c;
      background: #ffedd5;
      margin-bottom: 12px;
    }
    .vehicle-change-header {
      background: #fed7aa;
      border-bottom: 2px solid #ea580c;
      padding: 6px;
      text-align: center;
      font-weight: bold;
      font-size: 10pt;
    }
    .inspection-img {
      width: 100%;
      height: auto;
      max-height: 125px;
      object-fit: contain;
    }
    .observations-box {
      min-height: 125px;
      font-size: 9pt;
    }
    .cgv-note {
      text-align: center;
      font-size: 8pt;
      font-style: italic;
      margin: 8px 0;
    }
    .signatures {
      margin-top: 25px;
      margin-bottom: 8px;
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 16px;
    }
    .signature-box {
      text-align: center;
    }
    .signature-area {
      height: 64px;
      margin-bottom: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .signature-img {
      max-height: 64px;
      width: auto;
      object-fit: contain;
      transform: scale(1.2);
    }
    .signature-line {
      border-top: 2px solid #000;
      padding-top: 4px;
      font-weight: bold;
      font-size: 9pt;
    }
    .footer {
      text-align: center;
      font-size: 9pt;
      color: #666;
      margin-top: auto;
      padding-top: 60px;
      padding-bottom: 20px;
      border-top: 1px solid #999;
    }
    .cgv-title {
      text-align: center;
      margin-bottom: 12px;
      font-size: 13pt;
      font-weight: bold;
      text-transform: uppercase;
    }
    .cgv-text {
      white-space: pre-wrap;
      text-align: justify;
      font-size: 8.5pt;
      line-height: 1.4;
    }
  </style>
</head>
<body>
  <div id="contract-content">
    
    <!-- Page 1 - Contrat -->
    <div class="contract-page">
      ${!settings?.masquer_entete ? `
      <div class="header">
        <div class="header-flex">
          <div class="header-left">
            ${!settings?.masquer_logo && settings?.logo_url ? `
            <div class="logo-container">
              <img src="${settings.logo_url}" alt="Logo" class="logo" crossorigin="anonymous">
            </div>
            ` : settings?.raison_sociale ? `${settings.raison_sociale}` : ''}
          </div>
          <div class="header-center">
            <h1 style="font-size: 14pt; font-weight: bold; margin: 0;">CONTRAT DE LOCATION</h1>
            <p style="font-size: 10pt; font-weight: 600; margin: 2px 0 0 0;">N° ${ph(contract?.numero_contrat || '')}</p>
          </div>
          <div class="header-right">
            Date: ${new Date().toLocaleDateString('fr-FR')}
          </div>
        </div>
      </div>
      ` : ''}

      <!-- Informations principales -->
      <div class="grid-2">
        <!-- Locataire -->
        <div class="box">
          <div class="box-header">LOCATAIRE</div>
          <div class="box-content">
            <div class="info-line"><span class="info-label">Nom & Prénom:</span> ${ph(`${client?.nom || ''} ${client?.prenom || ''}`)}</div>
            <div class="info-grid-2">
              <div class="info-line"><span class="info-label">CIN:</span> ${ph(client?.cin || '')}</div>
              <div class="info-line"><span class="info-label">Permis:</span> ${ph(client?.permis_conduire || '')}</div>
            </div>
            <div class="info-line"><span class="info-label">Téléphone:</span> ${ph(client?.telephone || '')}</div>
            <div class="info-line"><span class="info-label">Adresse:</span> ${ph(client?.adresse || '')}</div>
          </div>
        </div>

        <!-- 2ème conducteur -->
        <div class="box">
          <div class="box-header">2ÈME CONDUCTEUR</div>
          <div class="box-content">
            <div class="info-line"><span class="info-label">Nom & Prénom:</span> ${ph(`${secondaryDriver?.nom || ''} ${secondaryDriver?.prenom || ''}`)}</div>
            <div class="info-line"><span class="info-label">CIN:</span> ${ph(secondaryDriver?.cin || '')}</div>
            <div class="info-line"><span class="info-label">Permis:</span> ${ph(secondaryDriver?.permis_conduire || '')}</div>
          </div>
        </div>
      </div>

      <!-- Véhicule et Location -->
      <div class="grid-2">
        <!-- Véhicule -->
        <div class="box">
          <div class="box-header">VÉHICULE</div>
          <div class="box-content">
            <div class="info-line"><span class="info-label">Marque/Modèle:</span> ${ph(`${vehicle?.marque || ''} ${vehicle?.modele || ''}`)}</div>
            <div class="info-line"><span class="info-label">Immatriculation:</span> ${ph(vehicle?.immatriculation || vehicle?.immatriculation_provisoire || 'N/A')}</div>
            <div class="info-line"><span class="info-label">Km départ:</span> ${ph(contract?.delivery_km || vehicle?.kilometrage || '')}</div>
          </div>
        </div>

        <!-- Location -->
        <div class="box">
          <div class="box-header">LOCATION</div>
          <div class="box-content">
            <div class="info-line"><span class="info-label">Départ:</span> ${ph(contract?.date_debut ? formatDate(contract.date_debut) : '')} - <span class="info-label">Retour:</span> ${ph(contract?.date_fin ? formatDate(contract.date_fin) : '')}</div>
            <div class="info-line"><span class="info-label">Durée:</span> ${ph(`${duration} jour(s)`)} - <span class="info-label">Prix/Jr:</span> ${ph(`${dailyRate.toFixed(2)} DH`)}</div>
            <div class="info-line"><span class="info-label">Prix total:</span> ${ph(`${totalAmount.toFixed(2)} DH`)} - <span class="info-label">Caution:</span> ${ph(`${(contract?.caution_montant || 0).toFixed(2)} DH`)}</div>
          </div>
        </div>
      </div>

      <!-- Prolongations -->
      ${!blankMode && contract?.prolongations && contract.prolongations.length > 0 ? `
      <div class="alert-box">
        <div class="alert-header">⚠️ PROLONGATION(S)</div>
        <div class="box-content">
          ${contract.prolongations.map((p: any, i: number) => {
            const ancienneDate = p.ancienne_date_fin ? new Date(p.ancienne_date_fin) : null;
            const nouvelleDate = p.nouvelle_date_fin ? new Date(p.nouvelle_date_fin) : null;
            const duree = ancienneDate && nouvelleDate 
              ? Math.ceil((nouvelleDate.getTime() - ancienneDate.getTime()) / (1000 * 60 * 60 * 24))
              : 0;
            const montant = duree * (contract.daily_rate || 0);
            
            return ancienneDate && nouvelleDate ? `
              <div class="info-line">
                <strong>Prolongation #${i + 1}:</strong> Du ${formatDate(p.ancienne_date_fin)} au ${formatDate(p.nouvelle_date_fin)} - ${duree} jour(s) - ${montant.toFixed(2)} DH
                ${p.raison ? `<span style="color: #666;"> (${p.raison})</span>` : ''}
              </div>
            ` : '';
          }).join('')}
        </div>
      </div>
      ` : ''}

      <!-- Changements de véhicule -->
      ${!blankMode && vehicleChanges && vehicleChanges.length > 0 ? `
      <div class="vehicle-change-box">
        <div class="vehicle-change-header">CHANGEMENT(S) DE VÉHICULE</div>
        <div class="box-content">
          ${vehicleChanges.map((change: any, idx: number) => `
            <div class="info-line">
              <strong>#${idx + 1}:</strong> ${change.old_vehicle?.immatriculation || 'N/A'} → ${change.new_vehicle?.immatriculation || 'N/A'} - ${formatReason(change.reason)}
            </div>
          `).join('')}
        </div>
      </div>
      ` : ''}

      <div class="grid-2">
        <div class="box">
          <div class="box-header">ÉTAT DU VÉHICULE</div>
          <div class="box-content" style="padding: 8px; display: flex; align-items: center; justify-content: center;">
            <img src="${inspectionDiagramUrl}" alt="Schéma inspection" class="inspection-img" crossorigin="anonymous">
          </div>
        </div>

        <div class="box">
          <div class="box-header">OBSERVATIONS</div>
          <div class="box-content observations-box">
            ${blankMode ? '' : (contract?.delivery_notes || contract?.notes || '')}
          </div>
        </div>
      </div>

      <!-- Note CGV -->
      <div class="cgv-note">
        * En signant le contrat, le client accepte les conditions générales de location.
      </div>

      <!-- Signatures -->
      <div class="signatures">
        <div class="signature-box">
          <div class="signature-area">
            ${settings?.signature_agence_url ? `
            <img src="${settings.signature_agence_url}" alt="Signature agence" class="signature-img" crossorigin="anonymous">
            ` : ''}
          </div>
          <div class="signature-line">Signature Agence</div>
        </div>
        
        <div class="signature-box">
          <div class="signature-area"></div>
          <div class="signature-line">Signature Locataire</div>
        </div>
        
        <div class="signature-box">
          <div class="signature-area"></div>
          <div class="signature-line">Signature 2ème Conducteur</div>
        </div>
      </div>

      <!-- Footer -->
      ${!settings?.masquer_pied_page ? `
      <div class="footer">
        ${settings?.raison_sociale ? `<strong>${settings.raison_sociale}</strong>` : ''}
        ${settings?.ice ? ` | ICE: ${settings.ice}` : ''}
        ${settings?.if_number ? ` | IF: ${settings.if_number}` : ''}
        ${settings?.rc ? ` | RC: ${settings.rc}` : ''}
        ${settings?.cnss ? ` | CNSS: ${settings.cnss}` : ''}
        ${settings?.patente ? ` | Patente: ${settings.patente}` : ''}
        <br/>
        ${settings?.adresse ? `Adresse: ${settings.adresse}` : ''}
        ${settings?.telephone ? ` | Tél: ${settings.telephone}` : ''}
        ${settings?.email ? ` | Email: ${settings.email}` : ''}
      </div>
      ` : ''}
    </div>

    <!-- Page 2 - CGV -->
    ${hasCgvPage ? `
    <div class="page-break-before cgv-page">
      <div class="cgv-title">CONDITIONS GÉNÉRALES DE LOCATION</div>
      <div class="cgv-text">${settings.cgv_texte}</div>
    </div>
    ` : ''}

  </div>
</body>
</html>`;
}
