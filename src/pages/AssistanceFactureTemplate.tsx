import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import html2pdf from 'html2pdf.js';

export default function AssistanceFactureTemplate() {
  const [searchParams] = useSearchParams();
  const assistanceId = searchParams.get("id");
  const assistanceIds = searchParams.get("ids");
  const downloadMode = searchParams.get("download") === "true";
  const shouldPrint = searchParams.get("print") === "true";
  const [assistances, setAssistances] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isGrouped, setIsGrouped] = useState(false);
  const [settings, setSettings] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, [assistanceId, assistanceIds]);

  const loadData = async () => {
    try {
      // Load settings
      const { data: settingsData } = await supabase
        .from("agence_settings")
        .select("*")
        .single();
      setSettings(settingsData);

      if (assistanceIds) {
        // Multiple IDs for grouped invoice
        const ids = assistanceIds.split(',');
        const { data, error } = await supabase
          .from("assistance")
          .select(`
            *,
            clients (nom, prenom, telephone, email, cin, adresse),
            vehicles (immatriculation, marque, modele)
          `)
          .in("id", ids);

        if (error) {
          console.error("Error loading assistances:", error);
        } else {
          // Charger les assurances pour chaque assistance
          const assistancesWithAssurance = await Promise.all(
            (data || []).map(async (assistance: any) => {
              if (assistance.assureur_id) {
                const { data: assuranceData } = await supabase
                  .from('assurances')
                  .select('nom, adresse, contact_telephone')
                  .eq('id', assistance.assureur_id)
                  .maybeSingle();
                
                return {
                  ...assistance,
                  assurance: assuranceData
                };
              }
              return assistance;
            })
          );
          
          setAssistances(assistancesWithAssurance);
          setIsGrouped(true);
        }
      } else if (assistanceId) {
        // Single ID
        const { data, error } = await supabase
          .from("assistance")
          .select(`
            *,
            clients (nom, prenom, telephone, email, cin, adresse),
            vehicles (immatriculation, marque, modele)
          `)
          .eq("id", assistanceId)
          .single();

        if (error) {
          console.error("Error loading assistance:", error);
        } else {
          let assistanceData: any = data;
          
          // Charger l'assurance si assureur_id existe
          if (data?.assureur_id) {
            const { data: assuranceData } = await supabase
              .from('assurances')
              .select('nom, adresse, contact_telephone')
              .eq('id', data.assureur_id)
              .maybeSingle();
            
            if (assuranceData) {
              assistanceData = {
                ...data,
                assurance: assuranceData
              };
            }
          }
          
          setAssistances([assistanceData]);
          setIsGrouped(false);
        }
      }
    } catch (error) {
      console.error("Error in loadData:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (assistances.length > 0 && !loading) {
      if (downloadMode) {
        setTimeout(() => {
          const element = document.getElementById('facture-content');
          if (!element) return;
          
          const invoiceNumber = isGrouped 
            ? `Facture_Groupee_${assistanceIds?.replace(/,/g, '_')}` 
            : `Facture_${assistances[0]?.num_dossier || assistanceId}`;
          
          const opt = {
            margin: 10,
            filename: `${invoiceNumber}.pdf`,
            image: { type: 'jpeg' as const, quality: 0.98 },
            html2canvas: { 
              scale: 2, 
              useCORS: true,
              allowTaint: true,
              logging: false,
              backgroundColor: '#ffffff'
            },
            jsPDF: { 
              unit: 'mm' as const, 
              format: 'a4' as const, 
              orientation: 'portrait' as const
            },
            pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
          };
          
          html2pdf().set(opt).from(element).save().then(() => {
            setTimeout(() => {
              if (window.parent !== window) {
                window.parent.document.querySelector('iframe')?.remove();
              }
            }, 1000);
          });
        }, 500);
      } else if (shouldPrint) {
        setTimeout(() => window.print(), 500);
      }
    }
  }, [assistances, loading, downloadMode, shouldPrint, assistanceId, assistanceIds, isGrouped]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Chargement...</div>
      </div>
    );
  }

  if (assistances.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Aucun dossier d'assistance trouvé</div>
      </div>
    );
  }

  // Calculate totals for grouped invoice
  const calculateTotals = () => {
    let totalHT = 0;
    assistances.forEach(assistance => {
      const montant = assistance.montant_facture || assistance.montant_total || 0;
      totalHT += montant / 1.2;
    });
    const totalTVA = totalHT * 0.2;
    const totalTTC = totalHT + totalTVA;
    return { totalHT, totalTVA, totalTTC };
  };

  const { totalHT, totalTVA, totalTTC } = calculateTotals();
  
  // For single invoice, get the first assistance
  const firstAssistance = assistances[0];
  const invoiceNumber = isGrouped 
    ? `FAC-GROUP-${format(new Date(), 'yyyyMMdd-HHmmss')}` 
    : `FAC-${firstAssistance.num_dossier}`;
  
  // Get assurance info from first assistance (should be same for grouped)
  const assuranceInfo = firstAssistance.assurances || { nom: firstAssistance.assureur_nom };

  return (
    <div id="facture-content" className="flex flex-col min-h-[297mm] w-[210mm] mx-auto p-8 bg-white print:p-0">
      <style>{`
        * {
          box-sizing: border-box;
        }
        #facture-content {
          width: 210mm;
          min-height: 297mm;
          margin: auto;
          overflow: hidden;
        }
        @media print {
          body { margin: 0; padding: 0; }
          @page { size: A4 portrait; margin: 15mm; }
        }
        table {
          page-break-inside: avoid;
        }
        .footer {
          page-break-inside: avoid;
        }
      `}</style>

      <div className="flex-1">

      {/* Header */}
      {!settings?.masquer_entete && (
        <div className="mb-8">
          {!settings?.masquer_logo && settings?.logo_url && (
            <div className="flex justify-center mb-4">
              <img 
                src={settings.logo_url} 
                alt="Logo" 
                className="h-16 w-auto object-contain"
              />
            </div>
          )}
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">FACTURE</h1>
              <p className="text-sm text-gray-600">N° {invoiceNumber}</p>
              <p className="text-sm text-gray-600">
                Date : {format(new Date(), 'dd/MM/yyyy', { locale: fr })}
              </p>
            </div>
          </div>

          <div className="border-t-2 border-gray-300 pt-4">
            <div className="grid grid-cols-2 gap-8">
              <div>
                <h3 className="font-bold mb-2">FACTURÉ À :</h3>
                <p className="font-semibold">{assuranceInfo.nom}</p>
                {assuranceInfo.adresse && (
                  <p className="text-sm">{assuranceInfo.adresse}</p>
                )}
                {assuranceInfo.contact_telephone && (
                  <p className="text-sm">Tél : {assuranceInfo.contact_telephone}</p>
                )}
              </div>
              <div>
                <h3 className="font-bold mb-2">{isGrouped ? 'FACTURE GROUPÉE' : 'CLIENT BÉNÉFICIAIRE'} :</h3>
                {isGrouped ? (
                  <p className="text-sm">{assistances.length} dossier(s) d'assistance</p>
                ) : (
                  <>
                    <p className="font-semibold">
                      {firstAssistance.clients?.nom} {firstAssistance.clients?.prenom}
                    </p>
                    {firstAssistance.clients?.cin && (
                      <p className="text-sm">CIN : {firstAssistance.clients.cin}</p>
                    )}
                    {firstAssistance.clients?.telephone && (
                      <p className="text-sm">Tél : {firstAssistance.clients.telephone}</p>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}


      {/* Items table */}
      <table className="w-full mb-6">
        <thead>
          <tr className="border-b-2 border-gray-400">
            <th className="text-left py-3 px-2">DÉSIGNATION</th>
            <th className="text-center py-3 px-2">QTÉ</th>
            <th className="text-right py-3 px-2">PRIX UNIT. HT</th>
            <th className="text-right py-3 px-2">TOTAL HT</th>
          </tr>
        </thead>
        <tbody>
          {assistances.map((assistance, index) => {
            const startDate = new Date(assistance.date_debut);
            const endDate = assistance.date_fin ? new Date(assistance.date_fin) : new Date();
            const duration = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
            const montant = assistance.montant_facture || assistance.montant_total || 0;
            const tarifJournalier = assistance.tarif_journalier || 0;
            const montantHT = montant / 1.2;
            const vehicleName = `${assistance.vehicles?.marque || ''} ${assistance.vehicles?.modele || ''}`.trim();
            
            return (
              <tr key={index} className="border-b border-gray-200">
                <td className="py-4 px-2">
                  <p className="font-semibold">
                    {isGrouped ? `Dossier ${assistance.num_dossier}` : `Dossier ${assistance.num_dossier}`}
                  </p>
                  <p className="text-sm text-gray-600">
                    Période : {format(startDate, 'dd/MM/yyyy', { locale: fr })} au {format(endDate, 'dd/MM/yyyy', { locale: fr })}
                  </p>
                  {isGrouped && (
                    <p className="text-sm text-gray-600">
                      Client : {assistance.clients?.nom} {assistance.clients?.prenom}
                    </p>
                  )}
                </td>
                <td className="text-center py-4 px-2">{duration}</td>
                <td className="text-right py-4 px-2">{(tarifJournalier / 1.2).toFixed(2)} DH</td>
                <td className="text-right py-4 px-2 font-semibold">{montantHT.toFixed(2)} DH</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Totals */}
      <div className="flex justify-end mb-8">
        <div className="w-80">
          <div className="flex justify-between py-2 border-b">
            <span className="font-semibold">Sous-total HT :</span>
            <span>{totalHT.toFixed(2)} DH</span>
          </div>
          <div className="flex justify-between py-2 border-b">
            <span className="font-semibold">TVA (20%) :</span>
            <span>{totalTVA.toFixed(2)} DH</span>
          </div>
          <div className="flex justify-between py-3 border-t-2 border-gray-400">
            <span className="font-bold text-lg">TOTAL TTC :</span>
            <span className="font-bold text-lg">{totalTTC.toFixed(2)} DH</span>
          </div>
        </div>
      </div>


      </div>

      {/* Footer */}
      {!settings?.masquer_pied_page && (
        <div className="footer mt-auto border-t-2 border-gray-300 pt-4 text-center text-xs text-gray-500">
          <p>
            {settings?.raison_sociale || "Nom de l'entreprise"}
            {settings?.rc && ` - RC: ${settings.rc}`}
            {settings?.if_number && ` - IF: ${settings.if_number}`}
            {settings?.ice && ` - ICE: ${settings.ice}`}
            {settings?.cnss && ` - CNSS: ${settings.cnss}`}
            {settings?.patente && ` - Patente: ${settings.patente}`}
          </p>
          {settings?.adresse && <p>Siège social : {settings.adresse}</p>}
          <p className="mt-2">Document généré le {format(new Date(), 'dd/MM/yyyy à HH:mm', { locale: fr })}</p>
        </div>
      )}
    </div>
  );
}