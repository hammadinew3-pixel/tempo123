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

  const duration = contract?.duration || 0;
  const dailyRate = contract?.daily_rate || 0;
  const totalAmount = contract?.total_amount || 0;
  const paidAmount = contract?.advance_payment || 0;
  const remainingAmount = Math.max(0, totalAmount - paidAmount);

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Contrat de Location</title>
  <style>
    @page { size: A4; margin: 10mm; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, sans-serif; font-size: 11pt; line-height: 1.4; color: #000; }
    .page { width: 210mm; min-height: 297mm; padding: 15mm; background: white; }
    .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #000; padding-bottom: 10px; }
    .logo { max-width: 150px; margin-bottom: 10px; }
    .section { margin-bottom: 15px; }
    .section-title { font-weight: bold; font-size: 12pt; margin-bottom: 8px; background: #f0f0f0; padding: 5px; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
    .info-item { margin-bottom: 5px; }
    .info-label { font-weight: bold; }
    table { width: 100%; border-collapse: collapse; margin: 10px 0; }
    th, td { border: 1px solid #000; padding: 6px; text-align: left; }
    th { background: #f0f0f0; font-weight: bold; }
    .signature-section { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 30px; }
    .signature-box { text-align: center; padding-top: 60px; border-top: 1px solid #000; }
    .footer { margin-top: 30px; text-align: center; font-size: 9pt; padding-top: 10px; border-top: 1px solid #ccc; }
  </style>
</head>
<body>
  <div class="page">
    <div class="header">
      ${settings?.logo_url ? `<img src="${settings.logo_url}" class="logo" alt="Logo">` : ''}
      <h1>Contrat de Location de Véhicule</h1>
      ${!blankMode && contract ? `<p>N° ${contract.numero_contrat || ''}</p>` : ''}
    </div>

    ${!blankMode && contract ? `
    <div class="section">
      <div class="section-title">Informations du Locataire</div>
      <div class="info-grid">
        <div class="info-item"><span class="info-label">Nom:</span> ${contract.clients?.nom || ''}</div>
        <div class="info-item"><span class="info-label">CIN:</span> ${contract.clients?.cin || ''}</div>
        <div class="info-item"><span class="info-label">Téléphone:</span> ${contract.clients?.telephone || ''}</div>
        <div class="info-item"><span class="info-label">Adresse:</span> ${contract.clients?.adresse || ''}</div>
      </div>
    </div>

    <div class="section">
      <div class="section-title">Informations du Véhicule</div>
      <div class="info-grid">
        <div class="info-item"><span class="info-label">Marque/Modèle:</span> ${contract.vehicles?.marque || ''} ${contract.vehicles?.modele || ''}</div>
        <div class="info-item"><span class="info-label">Immatriculation:</span> ${contract.vehicles?.immatriculation || ''}</div>
        <div class="info-item"><span class="info-label">Couleur:</span> ${contract.vehicles?.couleur || ''}</div>
        <div class="info-item"><span class="info-label">Kilométrage:</span> ${contract.kilometrage_depart || ''} km</div>
      </div>
    </div>

    <div class="section">
      <div class="section-title">Détails de la Location</div>
      <div class="info-grid">
        <div class="info-item"><span class="info-label">Date début:</span> ${formatDate(contract.date_debut)}</div>
        <div class="info-item"><span class="info-label">Date fin:</span> ${formatDate(contract.date_fin)}</div>
        <div class="info-item"><span class="info-label">Durée:</span> ${duration} jour(s)</div>
        <div class="info-item"><span class="info-label">Tarif journalier:</span> ${dailyRate} MAD</div>
        <div class="info-item"><span class="info-label">Montant total:</span> ${totalAmount} MAD</div>
        <div class="info-item"><span class="info-label">Avance payée:</span> ${paidAmount} MAD</div>
        <div class="info-item"><span class="info-label">Reste à payer:</span> ${remainingAmount} MAD</div>
      </div>
    </div>
    ` : ''}

    <div class="signature-section">
      <div class="signature-box">
        <p><strong>Signature de l'Agence</strong></p>
        <p>${settings?.nom || ''}</p>
      </div>
      <div class="signature-box">
        <p><strong>Signature du Locataire</strong></p>
      </div>
    </div>

    <div class="footer">
      <p>${settings?.nom || ''} - ${settings?.adresse || ''}</p>
      <p>Tél: ${settings?.telephone || ''} | Email: ${settings?.email || ''}</p>
      ${settings?.ice ? `<p>ICE: ${settings.ice}</p>` : ''}
    </div>
  </div>
</body>
</html>`;
}
