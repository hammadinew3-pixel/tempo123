import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import html2pdf from 'html2pdf.js';
import ContractPrintable from "@/components/assistance/ContractPrintable";

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
        .from('tenant_settings')
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