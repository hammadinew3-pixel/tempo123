import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import InvoicePrintable from '@/components/locations/InvoicePrintable';
import { generatePDFFromElement } from '@/lib/pdfUtils';

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
        // Charger les paramètres du tenant
        const { data: tenantSettings } = await supabase
          .from('tenant_settings')
          .select('*')
          .single();

        if (tenantSettings) {
          setSettings(tenantSettings);
        }

        // Charger le contrat avec toutes les relations
        const { data: contractData, error } = await supabase
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

        if (contractData) {
          // Mapper les champs de la base de données vers l'interface Contract avec fallbacks
          const mappedContract: Contract = {
            id: contractData.id,
            numero_contrat: contractData.numero_contrat,
            date_debut: contractData.date_debut,
            date_fin: contractData.date_fin,
            tarif_journalier: contractData.daily_rate ?? contractData.vehicles?.tarif_journalier ?? 0,
            caution: contractData.caution_montant ?? 0,
            montant_total: contractData.total_amount ?? 0,
            avance: contractData.advance_payment ?? 0,
            remaining_amount: contractData.remaining_amount ?? 0,
            clients: contractData.clients,
            vehicles: contractData.vehicles,
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
          generatePDFFromElement(element, `facture-${contract.numero_contrat}.pdf`)
            .then(() => {
              setTimeout(() => {
                if (window.parent !== window) {
                  window.parent.document.querySelector('iframe')?.remove();
                }
              }, 1000);
            })
            .catch((error) => {
              console.error('Erreur génération PDF:', error);
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
