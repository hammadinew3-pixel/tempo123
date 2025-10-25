import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';
import InvoicePrintable from '@/components/locations/InvoicePrintable';


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
        // Créer un client Supabase avec service_role_key pour bypasser RLS
        // Ce client est uniquement utilisé côté serveur (Gotenberg) lors du rendu
        const supabaseUrl = 'https://vqlusbhqoalhbfiotdhi.supabase.co';
        const serviceRoleKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
        
        // Si la clé n'est pas disponible, fallback sur le client standard
        // (utile en dev local où on est authentifié)
        const supabaseClient = serviceRoleKey 
          ? createClient<Database>(supabaseUrl, serviceRoleKey, {
              auth: {
                autoRefreshToken: false,
                persistSession: false
              }
            })
          : (await import('@/integrations/supabase/client')).supabase;

        // Charger les paramètres du tenant
        const { data: tenantSettings } = await supabaseClient
          .from('agence_settings')
          .select('*')
          .single();

        if (tenantSettings) {
          setSettings({
            nom_agence: tenantSettings.nom,
            adresse: tenantSettings.adresse,
            telephone: tenantSettings.telephone,
            email: tenantSettings.email,
            logo_url: tenantSettings.logo_url,
            tva_taux: tenantSettings.taux_tva
          });
        }

        // Charger le contrat avec toutes les relations
        const { data: contractData, error } = await supabaseClient
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

        if (error) {
          console.error('Error loading contract:', error);
          throw error;
        }

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
    if (!loading && contract && settings && shouldPrint) {
      setTimeout(() => window.print(), 500);
    }
  }, [loading, contract, settings, shouldPrint]);

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
          margin: 8mm; 
        }
        #invoice-content {
          width: 100%;
          max-width: 210mm;
          margin: auto;
          overflow: hidden;
          background: #ffffff;
        }
        .invoice-page {
          width: 210mm;
          height: 297mm;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          padding: 0 0 3mm 0;
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
