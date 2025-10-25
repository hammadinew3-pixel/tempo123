import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import ContractPrintable from '@/components/assistance/ContractPrintable';
import InvoicePrintable from '@/components/assistance/InvoicePrintable';
import { generatePDFFromElement } from "@/lib/pdfUtils";

export default function AssistanceCompletTemplate() {
  const [searchParams] = useSearchParams();
  const id = searchParams.get('id');
  const [data, setData] = useState<any>(null);
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [cinSignedUrl, setCinSignedUrl] = useState<string | null>(null);
  const [permisSignedUrl, setPermisSignedUrl] = useState<string | null>(null);
  const [omSignedUrl, setOmSignedUrl] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      if (!id) return;

      try {
        const assistanceRes = await supabase
          .from('assistance')
          .select(`
            *,
            clients (nom, prenom, telephone, email, cin, permis_conduire, adresse, cin_url, permis_url),
            vehicles (marque, modele, immatriculation, categorie, categories, kilometrage)
          `)
          .eq('id', id)
          .single();

        if (assistanceRes.error) throw assistanceRes.error;

        let assistanceData: any = assistanceRes.data;
        
        // Charger l'assurance si assureur_id existe
        if (assistanceData?.assureur_id) {
          const { data: assuranceData } = await supabase
            .from('assurances')
            .select('nom, contact_nom, contact_telephone, contact_email, adresse')
            .eq('id', assistanceData.assureur_id)
            .maybeSingle();
          
          if (assuranceData) {
            assistanceData = {
              ...assistanceData,
              assurance: assuranceData
            };
          }
        }

        const settingsRes = await supabase.from('tenant_settings').select('*').maybeSingle();
        if (settingsRes.error) throw settingsRes.error;

        setData(assistanceData);
        setSettings(settingsRes.data);

        // Generate signed URLs for private bucket images
        if (assistanceData.clients?.cin_url) {
          const bucketPath = assistanceData.clients.cin_url.split('/').pop();
          if (bucketPath) {
            const { data: signedData } = await supabase.storage
              .from('client-documents')
              .createSignedUrl(bucketPath, 3600);
            if (signedData) setCinSignedUrl(signedData.signedUrl);
          }
        }

        if (assistanceData.clients?.permis_url) {
          const bucketPath = assistanceData.clients.permis_url.split('/').pop();
          if (bucketPath) {
            const { data: signedData } = await supabase.storage
              .from('client-documents')
              .createSignedUrl(bucketPath, 3600);
            if (signedData) setPermisSignedUrl(signedData.signedUrl);
          }
        }

        if (assistanceData.ordre_mission_url) {
          const bucketPath = assistanceData.ordre_mission_url.split('/').pop();
          if (bucketPath) {
            const { data: signedData } = await supabase.storage
              .from('assistance-pdfs')
              .createSignedUrl(bucketPath, 3600);
            if (signedData) setOmSignedUrl(signedData.signedUrl);
          }
        }
      } catch (error) {
        console.error('Erreur:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [id]);

  useEffect(() => {
    const downloadMode = searchParams.get('download') === 'true';
    if (!loading && data) {
      setTimeout(() => {
        if (downloadMode) {
          const element = document.getElementById('dossier-content');
          if (!element) return;
          const filename = `Dossier_Complet_${data.num_dossier || id}.pdf`;
          generatePDFFromElement(element, filename)
            .then(() => {
              setTimeout(() => {
                if (window.parent !== window) {
                  window.parent.document.querySelector('iframe')?.remove();
                }
              }, 1000);
            })
            .catch((e) => {
              console.error('PDF generation failed:', e);
            });
        } else {
          window.print();
        }
      }, 500);
    }
  }, [loading, data, searchParams]);

  if (loading || !data) {
    return <div className="p-8">Chargement...</div>;
  }

  const clientName = `${data.clients?.nom || ''} ${data.clients?.prenom || ''}`.trim();
  const displayCinUrl = cinSignedUrl || data.clients?.cin_url;
  const displayPermisUrl = permisSignedUrl || data.clients?.permis_url;
  const displayOmUrl = omSignedUrl || data.ordre_mission_url;

  return (
    <div id="dossier-content" className="bg-white text-black max-w-[210mm] mx-auto">
      <style>{`
        @page { 
          size: A4;
          margin: 10mm;
        }
        @media print {
          body { margin: 0; padding: 0; }
          .page-break { page-break-before: always; }
          .no-print { display: none; }
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
        .invoice-page {
          width: 190mm;
          height: 277mm;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          padding: 0 0 5mm 0;
          background: white;
        }
      `}</style>

      {/* PAGE 1: ORDRE DE MISSION */}
      {displayOmUrl && (
        <div className="mb-8 p-6">
          <h2 className="text-center text-2xl font-bold mb-6">ORDRE DE MISSION</h2>
          <div className="flex justify-center">
            <img 
              src={displayOmUrl} 
              alt="Ordre de mission" 
              className="max-w-full h-auto"
              style={{ maxHeight: '90vh' }}
              crossOrigin="anonymous"
            />
          </div>
        </div>
      )}

      {/* PAGE 2: CONTRAT DE LOCATION */}
      <div className={displayOmUrl ? "page-break" : ""} style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}>
        <ContractPrintable assistance={data} agenceSettings={settings} />
      </div>

      {/* PAGE 3: CIN DU CLIENT */}
      {displayCinUrl && (
        <div className="page-break p-6">
          <h2 className="text-center text-2xl font-bold mb-6">COPIE CIN DU CLIENT</h2>
          <div className="mb-4">
            <p className="mb-2"><strong>Client:</strong> {clientName}</p>
            <p className="mb-4"><strong>N° CIN:</strong> {data.clients?.cin || ''}</p>
          </div>
          <div className="flex justify-center">
            <img 
              src={displayCinUrl} 
              alt="CIN du client" 
              className="max-w-full h-auto"
              style={{ maxHeight: '85vh' }}
              crossOrigin="anonymous"
            />
          </div>
        </div>
      )}

      {/* PAGE 4: PERMIS DU CLIENT */}
      {displayPermisUrl && (
        <div className="page-break p-6">
          <h2 className="text-center text-2xl font-bold mb-6">COPIE PERMIS DU CLIENT</h2>
          <div className="mb-4">
            <p className="mb-2"><strong>Client:</strong> {clientName}</p>
            <p className="mb-4"><strong>N° Permis:</strong> {data.clients?.permis_conduire || ''}</p>
          </div>
          <div className="flex justify-center">
            <img 
              src={displayPermisUrl} 
              alt="Permis de conduire du client" 
              className="max-w-full h-auto"
              style={{ maxHeight: '85vh' }}
              crossOrigin="anonymous"
            />
          </div>
        </div>
      )}

      {/* PAGE 5: FACTURE */}
      <div className="page-break">
        <InvoicePrintable assistances={[data]} settings={settings} isGrouped={false} />
      </div>
    </div>
  );
}
