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
        
        // Charger les settings depuis agence_settings
        const { data: settingsData } = await supabaseClient
          .from("agence_settings")
          .select("*")
          .eq('id', tenantId)
          .single();
        
        setSettings(settingsData);

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

        // Charger les settings depuis agence_settings
        const { data: settingsData } = await supabaseClient
          .from("agence_settings")
          .select("*")
          .eq('id', data.tenant_id)
          .single();
        
        setSettings(settingsData);

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
