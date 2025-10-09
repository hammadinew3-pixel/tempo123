import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🚀 Starting assistance PDF generation...');
    
    const { assistanceId } = await req.json();
    
    if (!assistanceId) {
      throw new Error('assistanceId is required');
    }

    console.log('📋 Assistance ID:', assistanceId);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch assistance data with related information
    console.log('📥 Fetching assistance data...');
    const { data: assistance, error: assistanceError } = await supabase
      .from('assistance')
      .select(`
        *,
        clients (nom, prenom, telephone, email, cin, permis_conduire, adresse),
        vehicles (immatriculation, marque, modele, annee, categorie),
        assurances (nom, contact_nom, contact_telephone, contact_email, adresse)
      `)
      .eq('id', assistanceId)
      .single();

    if (assistanceError) {
      console.error('❌ Error fetching assistance:', assistanceError);
      throw assistanceError;
    }

    if (!assistance) {
      throw new Error('Assistance not found');
    }

    console.log('✅ Assistance data loaded');

    // Calculate duration
    const startDate = new Date(assistance.date_debut);
    const endDate = assistance.date_fin ? new Date(assistance.date_fin) : new Date();
    const duration = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

    // Format dates
    const formatDate = (date: string | null) => {
      if (!date) return 'N/A';
      return new Date(date).toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    };

    // Generate HTML content
    console.log('📝 Generating PDF HTML...');
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Dossier Assistance ${assistance.num_dossier}</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      font-size: 12px;
      line-height: 1.4;
      margin: 0;
      padding: 20px;
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
      border-bottom: 2px solid #333;
      padding-bottom: 10px;
    }
    .header h1 {
      margin: 0;
      font-size: 24px;
      color: #333;
    }
    .header p {
      margin: 5px 0;
      color: #666;
    }
    .section {
      margin-bottom: 20px;
      border: 1px solid #ddd;
      padding: 15px;
      border-radius: 5px;
    }
    .section h2 {
      margin: 0 0 10px 0;
      font-size: 16px;
      color: #333;
      border-bottom: 1px solid #ddd;
      padding-bottom: 5px;
    }
    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
    }
    .info-item {
      margin-bottom: 8px;
    }
    .info-label {
      font-weight: bold;
      color: #555;
    }
    .info-value {
      color: #333;
    }
    .full-width {
      grid-column: 1 / -1;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 2px solid #333;
      font-size: 10px;
      color: #666;
      text-align: center;
    }
    .amount-box {
      background: #f5f5f5;
      padding: 15px;
      border-radius: 5px;
      text-align: center;
      margin: 10px 0;
    }
    .amount-box .label {
      font-size: 14px;
      color: #666;
      margin-bottom: 5px;
    }
    .amount-box .value {
      font-size: 24px;
      font-weight: bold;
      color: #333;
    }
    .status-badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: bold;
    }
    .status-ouvert { background: #e5e7eb; color: #374151; }
    .status-livre { background: #d1fae5; color: #065f46; }
    .status-retour { background: #fef3c7; color: #92400e; }
    .status-cloture { background: #dbeafe; color: #1e40af; }
  </style>
</head>
<body>
  <div class="header">
    <h1>DOSSIER D'ASSISTANCE</h1>
    <p>N° ${assistance.num_dossier}</p>
    <p>Date d'émission: ${formatDate(assistance.created_at)}</p>
  </div>

  <div class="section">
    <h2>Informations du Dossier</h2>
    <div class="info-grid">
      <div class="info-item">
        <div class="info-label">Type:</div>
        <div class="info-value">${assistance.type === 'remplacement' ? 'Véhicule de remplacement' : assistance.type === 'panne' ? 'Panne' : 'Accident'}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Statut:</div>
        <div class="info-value">
          <span class="status-badge status-${assistance.etat}">
            ${assistance.etat === 'ouvert' ? 'Réservation' :
              assistance.etat === 'contrat_valide' ? 'Contrat validé' :
              assistance.etat === 'livre' ? 'En cours' :
              assistance.etat === 'retour_effectue' ? 'Retour effectué' :
              assistance.etat === 'cloture' ? 'Clôturé' : assistance.etat}
          </span>
        </div>
      </div>
      <div class="info-item">
        <div class="info-label">Date début:</div>
        <div class="info-value">${formatDate(assistance.date_debut)}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Date fin prévue:</div>
        <div class="info-value">${formatDate(assistance.date_fin)}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Durée:</div>
        <div class="info-value">${duration} jour(s)</div>
      </div>
      <div class="info-item">
        <div class="info-label">Tarif journalier:</div>
        <div class="info-value">${assistance.tarif_journalier ? assistance.tarif_journalier.toFixed(2) : '0.00'} DH</div>
      </div>
    </div>
  </div>

  <div class="section">
    <h2>Assurance</h2>
    <div class="info-grid">
      <div class="info-item">
        <div class="info-label">Compagnie:</div>
        <div class="info-value">${assistance.assurances?.nom || assistance.assureur_nom || 'N/A'}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Contact:</div>
        <div class="info-value">${assistance.assurances?.contact_nom || 'N/A'}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Téléphone:</div>
        <div class="info-value">${assistance.assurances?.contact_telephone || 'N/A'}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Email:</div>
        <div class="info-value">${assistance.assurances?.contact_email || 'N/A'}</div>
      </div>
      ${assistance.assurances?.adresse ? `
      <div class="info-item full-width">
        <div class="info-label">Adresse:</div>
        <div class="info-value">${assistance.assurances.adresse}</div>
      </div>
      ` : ''}
    </div>
  </div>

  <div class="section">
    <h2>Client</h2>
    <div class="info-grid">
      <div class="info-item">
        <div class="info-label">Nom complet:</div>
        <div class="info-value">${assistance.clients?.nom || ''} ${assistance.clients?.prenom || ''}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Téléphone:</div>
        <div class="info-value">${assistance.clients?.telephone || 'N/A'}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Email:</div>
        <div class="info-value">${assistance.clients?.email || 'N/A'}</div>
      </div>
      <div class="info-item">
        <div class="info-label">CIN:</div>
        <div class="info-value">${assistance.clients?.cin || 'N/A'}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Permis:</div>
        <div class="info-value">${assistance.clients?.permis_conduire || 'N/A'}</div>
      </div>
      ${assistance.clients?.adresse ? `
      <div class="info-item full-width">
        <div class="info-label">Adresse:</div>
        <div class="info-value">${assistance.clients.adresse}</div>
      </div>
      ` : ''}
    </div>
  </div>

  <div class="section">
    <h2>Véhicule de Remplacement</h2>
    <div class="info-grid">
      <div class="info-item">
        <div class="info-label">Immatriculation:</div>
        <div class="info-value">${assistance.vehicles?.immatriculation || 'N/A'}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Marque/Modèle:</div>
        <div class="info-value">${assistance.vehicles?.marque || ''} ${assistance.vehicles?.modele || ''}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Année:</div>
        <div class="info-value">${assistance.vehicles?.annee || 'N/A'}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Catégorie:</div>
        <div class="info-value">${assistance.vehicles?.categorie ? 'Catégorie ' + assistance.vehicles.categorie.toUpperCase() : 'N/A'}</div>
      </div>
    </div>
  </div>

  ${assistance.kilometrage_depart || assistance.niveau_carburant_depart || assistance.etat_vehicule_depart ? `
  <div class="section">
    <h2>Livraison</h2>
    <div class="info-grid">
      ${assistance.kilometrage_depart ? `
      <div class="info-item">
        <div class="info-label">Kilométrage départ:</div>
        <div class="info-value">${assistance.kilometrage_depart} km</div>
      </div>
      ` : ''}
      ${assistance.niveau_carburant_depart ? `
      <div class="info-item">
        <div class="info-label">Niveau carburant:</div>
        <div class="info-value">${assistance.niveau_carburant_depart}</div>
      </div>
      ` : ''}
      ${assistance.etat_vehicule_depart ? `
      <div class="info-item full-width">
        <div class="info-label">État du véhicule:</div>
        <div class="info-value">${assistance.etat_vehicule_depart}</div>
      </div>
      ` : ''}
    </div>
  </div>
  ` : ''}

  ${assistance.date_retour_effective || assistance.kilometrage_retour || assistance.niveau_carburant_retour || assistance.etat_vehicule_retour ? `
  <div class="section">
    <h2>Retour</h2>
    <div class="info-grid">
      ${assistance.date_retour_effective ? `
      <div class="info-item">
        <div class="info-label">Date de retour:</div>
        <div class="info-value">${formatDate(assistance.date_retour_effective)}</div>
      </div>
      ` : ''}
      ${assistance.kilometrage_retour ? `
      <div class="info-item">
        <div class="info-label">Kilométrage retour:</div>
        <div class="info-value">${assistance.kilometrage_retour} km</div>
      </div>
      ` : ''}
      ${assistance.niveau_carburant_retour ? `
      <div class="info-item">
        <div class="info-label">Niveau carburant:</div>
        <div class="info-value">${assistance.niveau_carburant_retour}</div>
      </div>
      ` : ''}
      ${assistance.etat_vehicule_retour ? `
      <div class="info-item full-width">
        <div class="info-label">État du véhicule:</div>
        <div class="info-value">${assistance.etat_vehicule_retour}</div>
      </div>
      ` : ''}
    </div>
  </div>
  ` : ''}

  <div class="section">
    <h2>Montants</h2>
    <div class="info-grid">
      <div class="info-item">
        <div class="info-label">Franchise:</div>
        <div class="info-value">${assistance.franchise_montant ? assistance.franchise_montant.toFixed(2) : '0.00'} DH</div>
      </div>
      <div class="info-item">
        <div class="info-label">Statut franchise:</div>
        <div class="info-value">
          ${assistance.franchise_statut === 'bloquee' ? 'Bloquée' :
            assistance.franchise_statut === 'remboursee' ? 'Remboursée' :
            assistance.franchise_statut === 'utilisee' ? 'Utilisée' : 'N/A'}
        </div>
      </div>
    </div>
    <div class="amount-box">
      <div class="label">Montant Total Facturé</div>
      <div class="value">${assistance.montant_facture || assistance.montant_total || 0} DH</div>
    </div>
    ${assistance.etat_paiement && assistance.etat_paiement !== 'en_attente' ? `
    <div class="info-grid">
      <div class="info-item">
        <div class="info-label">Montant payé:</div>
        <div class="info-value">${assistance.montant_paye ? assistance.montant_paye.toFixed(2) : '0.00'} DH</div>
      </div>
      <div class="info-item">
        <div class="info-label">Date paiement:</div>
        <div class="info-value">${formatDate(assistance.date_paiement_assurance)}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Statut paiement:</div>
        <div class="info-value">
          ${assistance.etat_paiement === 'paye' ? 'Payé' :
            assistance.etat_paiement === 'partiellement_paye' ? 'Partiellement payé' : 'En attente'}
        </div>
      </div>
    </div>
    ` : ''}
  </div>

  ${assistance.prolongations && assistance.prolongations.length > 0 ? `
  <div class="section">
    <h2>Historique des Prolongations</h2>
    ${assistance.prolongations.map((p: any, i: number) => `
      <div style="margin-bottom: 15px; padding: 10px; background: #f9f9f9; border-left: 3px solid #333;">
        <div style="font-weight: bold; margin-bottom: 5px;">Prolongation #${i + 1}</div>
        <div class="info-grid">
          <div class="info-item">
            <div class="info-label">Date:</div>
            <div class="info-value">${new Date(p.date).toLocaleDateString('fr-FR', { 
              day: '2-digit', 
              month: '2-digit', 
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Ancienne date de fin:</div>
            <div class="info-value">${new Date(p.ancienne_date_fin).toLocaleDateString('fr-FR', { 
              day: '2-digit', 
              month: '2-digit', 
              year: 'numeric'
            })}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Nouvelle date de fin:</div>
            <div class="info-value" style="font-weight: bold; color: #0066cc;">${new Date(p.nouvelle_date_fin).toLocaleDateString('fr-FR', { 
              day: '2-digit', 
              month: '2-digit', 
              year: 'numeric'
            })}</div>
          </div>
          ${p.raison ? `
          <div class="info-item full-width">
            <div class="info-label">Raison:</div>
            <div class="info-value">${p.raison}</div>
          </div>
          ` : ''}
        </div>
      </div>
    `).join('')}
  </div>
  ` : ''}

  ${assistance.remarques ? `
  <div class="section">
    <h2>Remarques</h2>
    <p>${assistance.remarques}</p>
  </div>
  ` : ''}

  <div class="footer">
    <p>Document généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}</p>
    <p>Dossier d'assistance N° ${assistance.num_dossier}</p>
  </div>
</body>
</html>
    `;

    console.log('🌐 Calling PDF generation API...');
    
    // Use a PDF generation service (we'll use PDFShift as an example)
    // You can also use other services like html-pdf-node, puppeteer, etc.
    const pdfResponse = await fetch('https://api.pdfshift.io/v3/convert/pdf', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Basic ' + btoa('api:' + (Deno.env.get('PDFSHIFT_API_KEY') || 'dummy_key')),
      },
      body: JSON.stringify({
        source: htmlContent,
        landscape: false,
        use_print: false,
      }),
    });

    if (!pdfResponse.ok) {
      console.error('❌ PDF generation failed:', await pdfResponse.text());
      throw new Error('PDF generation failed');
    }

    const pdfBuffer = await pdfResponse.arrayBuffer();
    console.log('✅ PDF generated successfully');

    // Upload to Supabase Storage (optional)
    // For now, we'll just return the PDF as base64
    const base64Pdf = btoa(
      new Uint8Array(pdfBuffer)
        .reduce((data, byte) => data + String.fromCharCode(byte), '')
    );

    console.log('✅ PDF generation complete');

    return new Response(
      JSON.stringify({
        success: true,
        pdf: base64Pdf,
        filename: `assistance_${assistance.num_dossier}.pdf`,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('❌ Error:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
