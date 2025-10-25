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
  taux_tva?: number;
  raison_sociale?: string;
  ice?: string;
  if_number?: string;
  rc?: string;
  cnss?: string;
  patente?: string;
  masquer_entete?: boolean;
  masquer_logo?: boolean;
  masquer_pied_page?: boolean;
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

        // Charger le contrat pour récupérer le tenant_id
        const { data: contractTemp } = await supabaseClient
          .from('contracts')
          .select('tenant_id')
          .eq('id', contractId)
          .single();

        if (!contractTemp) {
          throw new Error('Contract not found');
        }

        // Charger les paramètres du tenant
        const { data: tenantSettings } = await supabaseClient
          .from('tenant_settings')
          .select('*')
          .eq('tenant_id', contractTemp.tenant_id)
          .single();

        if (tenantSettings) {
          console.log('=== DEBUG SETTINGS ===');
          console.log('Logo URL:', tenantSettings.logo_url);
          console.log('Masquer logo?', tenantSettings.masquer_logo);
          console.log('Masquer entête?', tenantSettings.masquer_entete);
          console.log('Masquer pied de page?', tenantSettings.masquer_pied_page);
          console.log('Raison sociale:', tenantSettings.raison_sociale);
          console.log('ICE:', tenantSettings.ice);
          console.log('======================');
          
          // Générer une URL signée pour le logo si nécessaire
          let logoUrl = tenantSettings.logo_url;
          if (logoUrl && logoUrl.includes('supabase.co/storage/v1/object/public/')) {
            try {
              // Extraire le bucket et le chemin
              const urlParts = logoUrl.split('/storage/v1/object/public/');
              if (urlParts[1]) {
                const [bucket, ...pathParts] = urlParts[1].split('/');
                const path = pathParts.join('/');
                
                // Créer une URL signée valide pour 1 heure
                const { data: signedData, error: signedError } = await supabaseClient
                  .storage
                  .from(bucket)
                  .createSignedUrl(path, 3600);
                
                if (signedData?.signedUrl) {
                  logoUrl = signedData.signedUrl;
                  console.log('URL signée générée pour le logo:', logoUrl);
                } else if (signedError) {
                  console.error('Erreur génération URL signée:', signedError);
                }
              }
            } catch (err) {
              console.error('Erreur lors de la génération de l\'URL signée:', err);
            }
          }
          
          // Convertir en Base64 pour l'impression/téléchargement
          if (logoUrl && (shouldPrint || downloadMode)) {
            try {
              const response = await fetch(logoUrl);
              const blob = await response.blob();
              const reader = new FileReader();
              logoUrl = await new Promise((resolve) => {
                reader.onloadend = () => resolve(reader.result as string);
                reader.readAsDataURL(blob);
              });
              console.log('Logo converti en Base64 pour impression');
            } catch (e) {
              console.warn('Échec conversion Base64, utilisation URL:', e);
            }
          }
          
          setSettings({
            nom_agence: tenantSettings.nom,
            adresse: tenantSettings.adresse,
            telephone: tenantSettings.telephone,
            email: tenantSettings.email,
            logo_url: logoUrl,
            taux_tva: tenantSettings.taux_tva,
            raison_sociale: tenantSettings.raison_sociale,
            ice: tenantSettings.ice,
            if_number: tenantSettings.if_number,
            rc: tenantSettings.rc,
            cnss: tenantSettings.cnss,
            patente: tenantSettings.patente,
            masquer_entete: tenantSettings.masquer_entete,
            masquer_logo: tenantSettings.masquer_logo,
            masquer_pied_page: tenantSettings.masquer_pied_page
          });
          console.log('Logo URL finale:', logoUrl);
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
        body, html {
          background: white !important;
          margin: 0;
          padding: 0;
        }
        @page { 
          size: A4 portrait; 
          margin: 0; 
        }
        #invoice-content {
          width: 100%;
          max-width: 190mm;
          margin: auto;
          overflow: visible;
          background: #ffffff;
        }
        .invoice-page {
          width: 190mm;
          min-height: 277mm;
          display: flex;
          flex-direction: column;
          overflow: visible;
          padding: 0 0 10mm 0;
          background: white;
          background-color: white !important;
          box-sizing: border-box;
        }
        .invoice-page > .flex-1 {
          flex: 1;
        }
        table {
          table-layout: fixed;
          width: 100%;
        }
        th, td {
          word-break: break-word;
        }
        img, svg {
          max-width: 100%;
          height: auto;
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
