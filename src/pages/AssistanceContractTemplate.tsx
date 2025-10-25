import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import html2pdf from 'html2pdf.js';
import ContractPrintable from "@/components/assistance/ContractPrintable";

export default function AssistanceContractTemplate() {
  const [searchParams] = useSearchParams();
  const assistanceId = searchParams.get("id");
  const downloadMode = searchParams.get("download") === "true";
  const blankMode = searchParams.get("blank") === "true";
  const [assistance, setAssistance] = useState<any>(null);
  const [agenceSettings, setAgenceSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (blankMode) {
      // Mode contrat vierge : charger uniquement les paramètres
      (async () => {
        setLoading(true);
        try {
          const { data, error } = await supabase
            .from('tenant_settings')
            .select('*')
            .single();
          
          if (error) throw error;
          setAgenceSettings(data);
        } catch (error) {
          console.error('Error loading settings for blank assistance contract:', error);
        } finally {
          setLoading(false);
        }
      })();
    } else if (assistanceId) {
      loadData();
    }
  }, [assistanceId, blankMode]);

  const loadData = async () => {
    if (!assistanceId) {
      const errorMsg = "ID d'assistance manquant";
      console.error(errorMsg);
      if (downloadMode && window.parent !== window) {
        window.parent.postMessage({ 
          type: 'pdf-error', 
          message: errorMsg,
          details: 'Aucun ID fourni dans l\'URL'
        }, '*');
      }
      setLoading(false);
      return;
    }

    try {
      console.log('[AssistanceContract] Chargement assistance:', assistanceId);
      
      const assistanceRes = await supabase
        .from("assistance")
        .select(`
          *,
          clients (nom, prenom, telephone, email, cin, permis_conduire, adresse),
          vehicles (immatriculation, immatriculation_provisoire, marque, modele, kilometrage, categorie, categories)
        `)
        .eq("id", assistanceId)
        .single();

      if (assistanceRes.error) {
        const errorMsg = `Erreur chargement assistance: ${assistanceRes.error.message}`;
        console.error("[AssistanceContract] Erreur Supabase:", assistanceRes.error);
        
        if (downloadMode && window.parent !== window) {
          window.parent.postMessage({ 
            type: 'pdf-error', 
            message: 'Impossible de charger le dossier d\'assistance',
            details: assistanceRes.error.message,
            code: assistanceRes.error.code,
            hint: assistanceRes.error.hint
          }, '*');
        }
        
        setLoading(false);
        return;
      } else {
        console.log('[AssistanceContract] Assistance chargée avec succès');
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
        .from('tenant_settings')
        .select('*')
        .single();
      
      if (!settingsRes.error && settingsRes.data) {
        setAgenceSettings(settingsRes.data);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
    
    setLoading(false);
  };

  useEffect(() => {
    if ((assistance || blankMode) && !loading) {
      if (downloadMode) {
        // Signaler au parent que la génération démarre
        if (window.parent !== window) {
          window.parent.postMessage({ type: 'pdf-started' }, '*');
        }

        // Mode téléchargement PDF - attendre que les images soient chargées
        setTimeout(() => {
          const element = document.getElementById('contract-content');
          if (!element) {
            if (window.parent !== window) {
              window.parent.postMessage({ type: 'pdf-error', message: 'Contenu introuvable' }, '*');
            }
            return;
          }

          const opt = {
            margin: [10, 10, 10, 10] as [number, number, number, number],
            filename: blankMode ? 'Contrat_Assistance_Vierge_CRSAPP.pdf' : `Contrat_${assistance?.num_dossier || assistanceId}.pdf`,
            image: { type: 'jpeg' as const, quality: 0.98 },
            html2canvas: { scale: 1.5, useCORS: true, allowTaint: true, logging: false },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' as const },
            pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
          };

          html2pdf()
            .set(opt)
            .from(element)
            .toPdf()
            .get('pdf')
            .then((pdf: any) => {
              const blob: Blob = pdf.output('blob');
              const filename = blankMode ? 'Contrat_Assistance_Vierge_CRSAPP.pdf' : `Contrat_${assistance?.num_dossier || assistanceId}.pdf`;
              
              if (window.parent !== window) {
                window.parent.postMessage({ type: 'pdf-ready', filename, blob }, '*');
              } else {
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = filename;
                a.click();
                setTimeout(() => URL.revokeObjectURL(url), 1000);
              }
            })
            .catch((err: any) => {
              const message = err?.message || 'Erreur génération PDF Assistance';
              if (window.parent !== window) {
                window.parent.postMessage({ type: 'pdf-error', message }, '*');
              } else {
                console.error(message, err);
              }
            });
        }, 1500);
      } else if (!blankMode) {
        // Mode impression classique (seulement si pas en mode vierge)
        setTimeout(() => window.print(), 500);
      }
    }
  }, [assistance, loading, downloadMode, blankMode, assistanceId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Chargement...</div>
      </div>
    );
  }

  if (!blankMode && !assistance) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Dossier d'assistance introuvable</div>
      </div>
    );
  }

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
        <ContractPrintable assistance={assistance} agenceSettings={agenceSettings} />
      </div>
    </>
  );
}