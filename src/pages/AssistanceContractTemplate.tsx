import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import vehicleInspectionDiagram from '@/assets/vehicle-inspection-diagram.png';
import html2pdf from 'html2pdf.js';

export default function AssistanceContractTemplate() {
  const [searchParams] = useSearchParams();
  const assistanceId = searchParams.get("id");
  const downloadMode = searchParams.get("download") === "true";
  const [assistance, setAssistance] = useState<any>(null);
  const [agenceSettings, setAgenceSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [assistanceId]);

  const loadData = async () => {
    if (!assistanceId) return;

    try {
      const assistanceRes = await supabase
        .from("assistance")
        .select(`
          *,
          clients (nom, prenom, telephone, email, cin, permis_conduire, adresse),
          vehicles (immatriculation, marque, modele, kilometrage, categorie, categories)
        `)
        .eq("id", assistanceId)
        .single();

      if (assistanceRes.error) {
        console.error("Error loading assistance:", assistanceRes.error);
      } else {
        let assistanceData: any = assistanceRes.data;
        
        // Charger les données de l'assurance si assureur_id existe
        if (assistanceData?.assureur_id) {
          const { data: assuranceData } = await supabase
            .from('assurances')
            .select('nom')
            .eq('id', assistanceData.assureur_id)
            .maybeSingle();
          
          if (assuranceData) {
            assistanceData = {
              ...assistanceData,
              assurance: assuranceData
            };
          }
        }
        
        setAssistance(assistanceData);
      }
      
      const settingsRes = await supabase
        .from('agence_settings')
        .select('*')
        .maybeSingle();
      
      if (!settingsRes.error && settingsRes.data) {
        setAgenceSettings(settingsRes.data);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
    
    setLoading(false);
  };

  useEffect(() => {
    if (assistance && !loading) {
      if (downloadMode) {
        // Mode téléchargement PDF
        setTimeout(() => {
          const element = document.getElementById('contract-content');
          if (!element) return;

          const opt = {
            margin: [10, 10, 10, 10] as [number, number, number, number],
            filename: `Contrat_${assistance.num_dossier}.pdf`,
            image: { type: 'jpeg' as const, quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true, allowTaint: true, logging: false },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' as const },
            pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
          };

          html2pdf().set(opt).from(element).save().then(() => {
            // Fermer l'iframe après le téléchargement
            setTimeout(() => {
              if (window.parent !== window) {
                window.parent.document.querySelector('iframe')?.remove();
              }
            }, 1000);
          });
        }, 500);
      } else {
        // Mode impression classique
        setTimeout(() => window.print(), 500);
      }
    }
  }, [assistance, loading, downloadMode]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Chargement...</div>
      </div>
    );
  }

  if (!assistance) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Dossier d'assistance introuvable</div>
      </div>
    );
  }

  const client = assistance.clients;
  const vehicle = assistance.vehicles;
  const hasCgvPage = Boolean(
    agenceSettings?.inclure_cgv &&
    agenceSettings?.cgv_texte &&
    agenceSettings.cgv_texte.trim().length > 0
  );

  return (
    <>
      <style>{`
        @page { 
          size: A4 portrait;
          margin: 10mm;
        }
        @media print {
          body { margin: 0; padding: 0; }
          .no-print { display: none !important; }
          .page-break-before { 
            page-break-before: always;
          }
        }
        #contract-content {
          width: 100%;
          max-width: 190mm;
          margin: auto;
          overflow: hidden;
        }
        .contract-page {
          width: 190mm;
          height: 277mm;
          overflow: hidden;
        }
        .cgv-page {
          width: 190mm;
          min-height: 277mm;
        }
      `}</style>
      
      <div id="contract-content" className="bg-white w-[190mm] mx-auto print:p-0"
           style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}>
        
        {/* Page 1 - Contrat */}
        <div className="contract-page flex flex-col p-6"
             style={{ height: '277mm', overflow: 'hidden' }}>
          {!agenceSettings?.masquer_entete && (
            <div className="mb-4 pb-2 border-b-2 border-black">
              <div className="flex justify-between items-start">
                {!agenceSettings?.masquer_logo && agenceSettings?.logo_url && (
                  <div className="w-1/4">
                    <img 
                      src={agenceSettings.logo_url} 
                      alt="Logo" 
                      className="h-16 w-auto object-contain" 
                      crossOrigin="anonymous"
                    />
                  </div>
                )}
                <div className={`flex-1 text-center ${!agenceSettings?.masquer_logo && agenceSettings?.logo_url ? '' : 'w-full'}`}>
                  <h1 className="text-[14pt] font-bold mb-1">CONTRAT DE LOCATION</h1>
                  <p className="text-[11pt] font-semibold">N° {assistance.num_dossier}</p>
                </div>
                {!agenceSettings?.masquer_logo && agenceSettings?.logo_url && (
                  <div className="w-1/4 text-right text-[8pt] text-gray-600">
                    {format(new Date(), 'dd/MM/yyyy')}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Informations principales */}
          <div className="grid grid-cols-2 gap-3 mb-3">
            {/* Bénéficiaire (Client) */}
            <div className="border-2 border-black">
              <div className="bg-gray-200 border-b-2 border-black p-2 text-center">
                <strong className="text-[11pt]">BÉNÉFICIAIRE</strong>
              </div>
              <div className="p-3 space-y-1 text-[9pt]">
                <div><strong>Nom & Prénom:</strong> {client?.nom} {client?.prenom}</div>
                <div><strong>CIN:</strong> {client?.cin}</div>
                <div><strong>Permis:</strong> {client?.permis_conduire}</div>
                <div><strong>Adresse:</strong> {client?.adresse}</div>
                <div><strong>Téléphone:</strong> {client?.telephone}</div>
              </div>
            </div>

            {/* Assurance */}
            <div className="border-2 border-black">
              <div className="bg-gray-200 border-b-2 border-black p-2 text-center">
                <strong className="text-[11pt]">ASSURANCE</strong>
              </div>
              <div className="p-3 space-y-1 text-[9pt]">
                <div><strong>Compagnie:</strong> {assistance.assurance?.nom || assistance.assureur_nom || ''}</div>
                <div><strong>Ordre de mission:</strong> {assistance.ordre_mission || 'N/A'}</div>
              </div>
            </div>
          </div>

          {/* Véhicule et Location */}
          <div className="grid grid-cols-2 gap-3 mb-3">
            {/* Véhicule */}
            <div className="border-2 border-black">
              <div className="bg-gray-200 border-b-2 border-black p-2 text-center">
                <strong className="text-[11pt]">VÉHICULE</strong>
              </div>
              <div className="p-3 space-y-1 text-[9pt]">
                <div><strong>Marque/Modèle:</strong> {vehicle?.marque} {vehicle?.modele}</div>
                <div><strong>Immatriculation:</strong> {vehicle?.immatriculation}</div>
                <div><strong>Catégorie:</strong> {vehicle?.categorie || vehicle?.categories?.[0] || ''}</div>
                <div><strong>Km départ:</strong> {assistance.kilometrage_depart || vehicle?.kilometrage}</div>
              </div>
            </div>

            {/* Location */}
            <div className="border-2 border-black">
              <div className="bg-gray-200 border-b-2 border-black p-2 text-center">
                <strong className="text-[11pt]">LOCATION</strong>
              </div>
              <div className="p-3 space-y-1 text-[9pt]">
                <div><strong>Départ:</strong> {assistance.date_debut ? format(new Date(assistance.date_debut), 'dd/MM/yyyy') : ''}</div>
                <div><strong>Retour:</strong> {assistance.date_fin ? format(new Date(assistance.date_fin), 'dd/MM/yyyy') : ''}</div>
                <div><strong>Durée:</strong> {Math.ceil((new Date(assistance.date_fin || new Date()).getTime() - new Date(assistance.date_debut).getTime()) / (1000 * 60 * 60 * 24))} jour(s)</div>
              </div>
            </div>
          </div>

          {/* Prolongations */}
          {assistance.prolongations && assistance.prolongations.length > 0 && (
            <div className="border-2 border-yellow-500 bg-yellow-50 mb-3">
              <div className="bg-yellow-200 border-b-2 border-yellow-500 p-2 text-center">
                <strong className="text-[10pt]">⚠️ PROLONGATION(S)</strong>
              </div>
              <div className="p-3">
                {assistance.prolongations.map((p: any, i: number) => {
                  const ancienneDate = p.ancienne_date_fin ? new Date(p.ancienne_date_fin) : null;
                  const nouvelleDate = p.nouvelle_date_fin ? new Date(p.nouvelle_date_fin) : null;
                  const duree = ancienneDate && nouvelleDate 
                    ? Math.ceil((nouvelleDate.getTime() - ancienneDate.getTime()) / (1000 * 60 * 60 * 24))
                    : 0;
                  
                  return (
                    <div key={i} className="text-[9pt] mb-1">
                      {ancienneDate && nouvelleDate && (
                        <>
                          <strong>Prolongation #{i + 1}:</strong> Du {format(ancienneDate, 'dd/MM/yyyy')} au {format(nouvelleDate, 'dd/MM/yyyy')} - {duree} jour(s)
                          {p.raison && <span className="text-gray-700"> ({p.raison})</span>}
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* État du véhicule */}
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div className="border-2 border-black">
              <div className="bg-gray-200 border-b-2 border-black p-2 text-center">
                <strong className="text-[10pt]">ÉTAT DU VÉHICULE</strong>
              </div>
              <div className="p-2 flex items-center justify-center">
                <img src={vehicleInspectionDiagram} alt="Schéma inspection" className="w-full h-auto max-h-24 object-contain" />
              </div>
            </div>

            <div className="border-2 border-black">
              <div className="bg-gray-200 border-b-2 border-black p-2 text-center">
                <strong className="text-[10pt]">OBSERVATIONS</strong>
              </div>
              <div className="p-2 text-[9pt] min-h-24">
                {assistance.etat_vehicule_depart || assistance.remarques || ''}
              </div>
            </div>
          </div>

          {/* Note CGV */}
          <div className="text-center text-[8pt] italic my-2">
            * En signant le contrat, le client accepte les conditions générales de location.
          </div>

          {/* Signatures */}
          <div className="mt-auto mb-3">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="h-12 mb-1 flex items-center justify-center">
                  {agenceSettings?.signature_agence_url && (
                    <img 
                      src={agenceSettings.signature_agence_url} 
                      alt="Signature agence" 
                      className="max-h-12 w-auto object-contain"
                      crossOrigin="anonymous"
                    />
                  )}
                </div>
                <div className="border-t-2 border-black pt-1">
                  <strong className="text-[9pt]">Signature Agence</strong>
                </div>
              </div>
              
              <div className="text-center">
                <div className="h-12 mb-1"></div>
                <div className="border-t-2 border-black pt-1">
                  <strong className="text-[9pt]">Signature Locataire</strong>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          {!agenceSettings?.masquer_pied_page && (
            <div className="text-center text-[10pt] text-gray-600 mt-2 pt-2 border-t border-gray-400">
              {agenceSettings?.raison_sociale && <><strong>{agenceSettings.raison_sociale}</strong></>}
              {agenceSettings?.ice && <> | ICE: {agenceSettings.ice}</>}
              {agenceSettings?.if_number && <> | IF: {agenceSettings.if_number}</>}
              {agenceSettings?.rc && <> | RC: {agenceSettings.rc}</>}
              {agenceSettings?.cnss && <> | CNSS: {agenceSettings.cnss}</>}
              {agenceSettings?.patente && <> | Patente: {agenceSettings.patente}</>}
              <br/>
              {agenceSettings?.adresse && <>Adresse: {agenceSettings.adresse}</>}
              {agenceSettings?.telephone && <> | Tél: {agenceSettings.telephone}</>}
              {agenceSettings?.email && <> | Email: {agenceSettings.email}</>}
            </div>
          )}
        </div>

        {/* Page 2 - CGV */}
        {hasCgvPage && (
          <div className="page-break-before cgv-page p-4"
               style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}>
            <div className="text-center mb-3">
              <h2 className="text-[13pt] font-bold uppercase">CONDITIONS GÉNÉRALES DE LOCATION</h2>
            </div>
            <div className="whitespace-pre-wrap text-justify"
                 style={{ fontSize: '9.5pt', lineHeight: '1.4' }}>
              {agenceSettings.cgv_texte}
            </div>
          </div>
        )}

      </div>
    </>
  );
}