import { useEffect, useState } from "react";
import { useSearchParams, Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';

import InvoicePrintable from "@/components/assistance/InvoicePrintable";

export default function AssistanceFactureTemplate() {
  const [searchParams] = useSearchParams();
  const assistanceId = searchParams.get("id");
  const assistanceIds = searchParams.get("ids");
  const downloadMode = searchParams.get("download") === "true";
  const shouldPrint = searchParams.get("print") === "true";
  const isPrintMode = searchParams.get('print') === 'true';
  const { user } = useAuth();
  
  // Redirect to auth if not in print mode and not authenticated
  const hasData = assistanceId || assistanceIds;
  if (!isPrintMode && !user && hasData) {
    return <Navigate to="/auth" />;
  }
  const [assistances, setAssistances] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isGrouped, setIsGrouped] = useState(false);
  const [settings, setSettings] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, [assistanceId, assistanceIds]);

  const loadData = async () => {
    try {
      // Créer un client Supabase avec service_role_key pour bypasser RLS
      const supabaseUrl = 'https://vqlusbhqoalhbfiotdhi.supabase.co';
      const serviceRoleKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
      
      const supabaseClient = serviceRoleKey 
        ? createClient<Database>(supabaseUrl, serviceRoleKey, {
            auth: {
              autoRefreshToken: false,
              persistSession: false
            }
          })
        : supabase;

      if (assistanceIds) {
        // Multiple IDs for grouped invoice
        const ids = assistanceIds.split(',');
        const { data, error } = await supabaseClient
          .from("assistance")
          .select(`
            *,
            clients (nom, prenom, telephone, email, cin, adresse),
            vehicles (immatriculation, marque, modele)
          `)
          .in("id", ids);

        if (error) throw error;

        // Récupérer tenant_id depuis la première assistance
        const tenantId = data?.[0]?.tenant_id;
        
      // Charger les settings depuis tenant_settings
      const { data: settingsData } = await supabaseClient
        .from("tenant_settings")
        .select("*")
        .eq('tenant_id', tenantId)
        .single();
      
      if (settingsData) {
        console.log('=== DEBUG SETTINGS ASSISTANCE (GROUPED) ===');
        console.log('Logo URL:', settingsData.logo_url);
        console.log('Masquer logo?', settingsData.masquer_logo);
        console.log('Masquer pied de page?', settingsData.masquer_pied_page);
        
        // Générer une URL signée pour le logo si nécessaire
        let logoUrl = settingsData.logo_url;
        if (logoUrl && logoUrl.includes('supabase.co/storage/v1/object/public/')) {
          try {
            const urlParts = logoUrl.split('/storage/v1/object/public/');
            if (urlParts[1]) {
              const [bucket, ...pathParts] = urlParts[1].split('/');
              const path = pathParts.join('/');
              
              const { data: signedData, error: signedError } = await supabaseClient
                .storage
                .from(bucket)
                .createSignedUrl(path, 3600);
              
              if (signedData?.signedUrl) {
                logoUrl = signedData.signedUrl;
                console.log('URL signée générée pour le logo');
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
          ...settingsData,
          logo_url: logoUrl
        });
      }

        // Charger les assurances pour chaque assistance
        const assistancesWithAssurance = await Promise.all(
          (data || []).map(async (assistance: any) => {
            if (assistance.assureur_id) {
              const { data: assuranceData } = await supabaseClient
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
      } else if (assistanceId) {
        // Single ID
        const { data, error } = await supabaseClient
          .from("assistance")
          .select(`
            *,
            clients (nom, prenom, telephone, email, cin, adresse),
            vehicles (immatriculation, marque, modele)
          `)
          .eq("id", assistanceId)
          .single();

        if (error) throw error;

      // Charger les settings depuis tenant_settings
      const { data: settingsData } = await supabaseClient
        .from("tenant_settings")
        .select("*")
        .eq('tenant_id', data.tenant_id)
        .single();
      
      if (settingsData) {
        console.log('=== DEBUG SETTINGS ASSISTANCE (SINGLE) ===');
        console.log('Logo URL:', settingsData.logo_url);
        console.log('Masquer logo?', settingsData.masquer_logo);
        console.log('Masquer pied de page?', settingsData.masquer_pied_page);
        
        // Générer une URL signée pour le logo si nécessaire
        let logoUrl = settingsData.logo_url;
        if (logoUrl && logoUrl.includes('supabase.co/storage/v1/object/public/')) {
          try {
            const urlParts = logoUrl.split('/storage/v1/object/public/');
            if (urlParts[1]) {
              const [bucket, ...pathParts] = urlParts[1].split('/');
              const path = pathParts.join('/');
              
              const { data: signedData, error: signedError } = await supabaseClient
                .storage
                .from(bucket)
                .createSignedUrl(path, 3600);
              
              if (signedData?.signedUrl) {
                logoUrl = signedData.signedUrl;
                console.log('URL signée générée pour le logo');
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
          ...settingsData,
          logo_url: logoUrl
        });
      }

        let assistanceData: any = data;
        
        // Charger l'assurance si assureur_id existe
        if (data?.assureur_id) {
          const { data: assuranceData } = await supabaseClient
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
    } catch (error) {
      console.error("Error in loadData:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (assistances.length > 0 && !loading && shouldPrint) {
      setTimeout(() => window.print(), 500);
    }
  }, [assistances, loading, shouldPrint]);

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

  return (
    <div id="facture-content" className="w-full max-w-[190mm] mx-auto bg-white">
      <style>{`
        * {
          box-sizing: border-box;
        }
        @page { 
          size: A4 portrait; 
          margin: 10mm; 
        }
        #facture-content {
          width: 100%;
          max-width: 190mm;
          margin: auto;
          overflow: hidden;
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
          body { margin: 0; padding: 0; }
        }
        table {
          width: 100%;
        }
      `}</style>

      <InvoicePrintable 
        assistances={assistances} 
        settings={settings} 
        isGrouped={isGrouped}
        tauxTVA={settings?.taux_tva}
      />
    </div>
  );
}
