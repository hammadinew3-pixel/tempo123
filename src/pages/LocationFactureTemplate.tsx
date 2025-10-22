import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import InvoicePrintable from '@/components/locations/InvoicePrintable';
import html2pdf from 'html2pdf.js';

interface Contract {
  id: string;
  numero_contrat: string;
  date_debut: string;
  date_fin: string;
  tarif_journalier: number;
  caution: number;
  montant_total: number;
  avance: number;
  remaining_amount: number;
  clients: {
    id: string;
    nom: string;
    prenom: string;
    telephone: string;
    cin: string;
    adresse: string;
  };
  vehicles: {
    immatriculation: string;
    marque: string;
    modele: string;
  };
}

interface TenantSettings {
  nom_agence?: string;
  adresse?: string;
  telephone?: string;
  email?: string;
  logo_url?: string;
  tva_taux?: number;
}

export default function LocationFactureTemplate() {
  const [searchParams] = useSearchParams();
  const contractId = searchParams.get('id');
  const shouldPrint = searchParams.get('print') === 'true';
  const downloadMode = searchParams.get('download') === 'true';

  const [contract, setContract] = useState<Contract | null>(null);
  const [settings, setSettings] = useState<TenantSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      if (!contractId) return;

      try {
        // Charger le contrat avec toutes les relations
        const { data: fullContractData, error } = await supabase
          .from('contracts')
          .select(`
            *,
            clients (
              id,
              nom,
              prenom,
              telephone,
              cin,
              adresse
            ),
            vehicles (
              immatriculation,
              marque,
              modele,
              tarif_journalier
            )
          `)
          .eq('id', contractId)
          .single();

        if (error) throw error;

        if (fullContractData) {
          // Charger les paramètres du tenant avec le tenant_id et fusionner avec agence_settings en fallback
          const [tenantRes, agenceRes] = await Promise.all([
            supabase
              .from('tenant_settings')
              .select('*')
              .eq('tenant_id', fullContractData.tenant_id)
              .single(),
            supabase
              .from('agence_settings')
              .select('*')
              .single()
          ]);

          const tenantSettings = tenantRes.data || {};
          const agenceSettings = agenceRes.data || {};
          // Ne pas écraser les valeurs agence par des null/undefined venant du tenant
          const filteredTenant = Object.fromEntries(
            Object.entries(tenantSettings).filter(([_, v]) => v !== null && v !== undefined && v !== '')
          );
          const mergedSettings = { ...agenceSettings, ...filteredTenant };
          setSettings(mergedSettings as TenantSettings);

          // Mapper les champs de la base de données vers l'interface Contract avec fallbacks
          const mappedContract: Contract = {
            id: fullContractData.id,
            numero_contrat: fullContractData.numero_contrat,
            date_debut: fullContractData.date_debut,
            date_fin: fullContractData.date_fin,
            tarif_journalier: fullContractData.daily_rate ?? fullContractData.vehicles?.tarif_journalier ?? 0,
            caution: fullContractData.caution_montant ?? 0,
            montant_total: fullContractData.total_amount ?? 0,
            avance: fullContractData.advance_payment ?? 0,
            remaining_amount: fullContractData.remaining_amount ?? 0,
            clients: fullContractData.clients,
            vehicles: fullContractData.vehicles,
          };
          setContract(mappedContract);
        }
      } catch (error) {
        console.error('Error loading contract data:', error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [contractId]);

  useEffect(() => {
    if (!loading && contract && settings) {
      if (downloadMode) {
        const element = document.getElementById('invoice-content');
        if (element) {
          const opt = {
            margin: 10,
            filename: `facture-${contract.numero_contrat}.pdf`,
            image: { type: 'jpeg' as const, quality: 0.98 },
            html2canvas: { 
              scale: 2, 
              useCORS: true,
              allowTaint: true,
              logging: false,
              backgroundColor: '#ffffff'
            },
            jsPDF: { unit: 'mm' as const, format: 'a4' as const, orientation: 'portrait' as const },
            pagebreak: { mode: ['css', 'legacy'] }
          };
          html2pdf().set(opt).from(element).save().then(() => {
            setTimeout(() => {
              if (window.parent !== window) {
                window.parent.document.querySelector('iframe')?.remove();
              }
            }, 1000);
          });
        }
      } else if (shouldPrint) {
        setTimeout(() => {
          window.print();
        }, 500);
      }
    }
  }, [loading, contract, settings, shouldPrint, downloadMode]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">Chargement de la facture...</div>
      </div>
    );
  }

  if (!contract) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">Contrat non trouvé</div>
      </div>
    );
  }

  return (
    <div id="invoice-content" className="w-full max-w-[190mm] mx-auto bg-white">
      <InvoicePrintable contract={contract} settings={settings} />
      <style>{`
        * { box-sizing: border-box; }
        @page { 
          size: A4 portrait; 
          margin: 10mm; 
        }
        #invoice-content {
          width: 100%;
          max-width: 190mm;
          margin: auto;
          overflow: hidden;
          background: #ffffff;
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
        @media print { 
          body { 
            margin: 0; 
            padding: 0; 
          } 
        }
      `}</style>
    </div>
  );
}
