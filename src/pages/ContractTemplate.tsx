import { useEffect, useState } from 'react';
import { useSearchParams, Navigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { createClient } from '@supabase/supabase-js';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import vehicleInspectionDiagram from '@/assets/vehicle-inspection-diagram.png';


export default function ContractTemplate() {
  const [searchParams] = useSearchParams();
  const contractId = searchParams.get('id');
  const downloadMode = searchParams.get('download') === 'true';
  const blankMode = searchParams.get('blank') === 'true';
  const isPrintMode = searchParams.get('print') === 'true';
  const { user } = useAuth();
  
  // Fonction pour obtenir le client Supabase approprié
  const getSupabaseClient = () => {
    // En mode print (appelé par Gotenberg), utiliser le service role key
    if (isPrintMode) {
      return createClient(
        'https://vqlusbhqoalhbfiotdhi.supabase.co',
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZxbHVzYmhxb2FsaGJmaW90ZGhpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDUwMjEyOCwiZXhwIjoyMDc2MDc4MTI4fQ.ZHU2LEi0o7ZQCVSsnEwZxEHsT-cuBMgGlndeBtyUH7g'
      );
    }
    // En mode normal, utiliser le client standard (avec auth)
    return supabase;
  };
  
  // Redirect to auth if not in print mode and not authenticated
  if (!isPrintMode && !user && !blankMode && contractId) {
    return <Navigate to="/auth" />;
  }
  const [contract, setContract] = useState<any>(null);
  const [vehicleChanges, setVehicleChanges] = useState<any[]>([]);
  const [secondaryDrivers, setSecondaryDrivers] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [agenceSettings, setAgenceSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (blankMode) {
      (async () => {
        const client = getSupabaseClient();
        setLoading(true);
        try {
          const { data: userTenant } = await client
            .from('user_tenants')
            .select('tenant_id')
            .eq('user_id', (await client.auth.getUser()).data.user?.id)
            .eq('is_active', true)
            .single();

          const { data, error } = await client
            .from('tenant_settings')
            .select('*')
            .eq('tenant_id', userTenant?.tenant_id)
            .single();
          
          if (error) throw error;
          setAgenceSettings(data);
        } catch (error) {
          console.error('Error loading settings for blank contract:', error);
        } finally {
          setLoading(false);
        }
      })();
    } else if (contractId) {
      loadContractData();
    }
  }, [contractId, blankMode]);

  useEffect(() => {
    if (!loading && (contract || blankMode) && !downloadMode && !blankMode) {
      setTimeout(() => window.print(), 500);
    }
  }, [loading, contract, downloadMode, blankMode]);

  const loadContractData = async () => {
    const client = getSupabaseClient();
    
    try {
      // Charger d'abord le contrat pour récupérer le tenant_id
      const contractRes = await client
        .from('contracts')
        .select('*, clients(*), vehicles(*)')
        .eq('id', contractId)
        .single();

      if (contractRes.error) throw contractRes.error;

      // Charger le reste des données en parallèle
      const [changesRes, driversRes, paymentsRes, settingsRes] = await Promise.all([
        client
          .from('vehicle_changes')
          .select('*, old_vehicle:old_vehicle_id(*), new_vehicle:new_vehicle_id(*)')
          .eq('contract_id', contractId)
          .order('change_date', { ascending: true }),
        client
          .from('secondary_drivers')
          .select('*')
          .eq('contract_id', contractId),
        client
          .from('contract_payments')
          .select('*')
          .eq('contract_id', contractId)
          .order('date_paiement', { ascending: true }),
        client
          .from('tenant_settings')
          .select('*')
          .eq('tenant_id', contractRes.data?.tenant_id)
          .single()
      ]);

      if (contractRes.error) throw contractRes.error;

      setContract(contractRes.data);
      setVehicleChanges(changesRes.data || []);
      setSecondaryDrivers(driversRes.data || []);
      setPayments(paymentsRes.data || []);
      setAgenceSettings(settingsRes.data);
    } catch (error) {
      console.error('Error loading contract:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatReason = (reason: string) => {
    const reasons: Record<string, string> = {
      'panne': 'Panne technique',
      'accident': 'Accident',
      'demande_client': 'Demande du client',
      'maintenance': 'Maintenance urgente',
      'autre': 'Autre'
    };
    return reasons[reason] || reason;
  };

  if (loading) {
    return <div className="p-10 text-center">Chargement...</div>;
  }

  if (!blankMode && (!contractId || !contract)) {
    return (
      <div className="p-10 text-center">
        <h2 className="text-xl font-bold mb-4">Contrat non trouvé</h2>
      </div>
    );
  }

  const ph = (text = '') => text;
  const client = contract?.clients;
  const vehicle = contract?.vehicles;
  const secondaryDriver = secondaryDrivers[0];
  
  // Calculer la durée et les montants
  const calculateDuration = (start: string, end: string) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    return Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  };
  
  const duration = contract?.duration || (contract ? calculateDuration(contract.date_debut, contract.date_fin) : 0);
  const dailyRate = contract?.daily_rate || vehicle?.tarif_journalier || 0;
  const totalAmount = contract?.total_amount || (duration * dailyRate);
  const paidAmount = payments.reduce((sum, p) => sum + parseFloat(p.montant || 0), 0);
  const remainingAmount = Math.max(0, totalAmount - paidAmount);
  
  const hasCgvPage = Boolean(
    agenceSettings?.inclure_cgv &&
    agenceSettings?.cgv_texte &&
    agenceSettings.cgv_texte.trim().length > 0
  );

  return (
    <>
      <style>{`
        @page { 
          size: A4 portrait;
          margin: 0;
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
          height: 297mm;
          padding: 0;
          overflow: hidden;
          background: white;
        }
        .cgv-page {
          width: 190mm;
          min-height: 297mm;
          padding: 0;
          background: white;
        }
      `}</style>
      
      <div id="contract-content" className="bg-white w-[190mm] mx-auto print:p-0"
           style={{ fontFamily: 'Arial, Helvetica, sans-serif', background: 'white' }}>
        
        {/* Page 1 - Contrat */}
        <div className="contract-page flex flex-col bg-white"
             style={{ height: '297mm', overflow: 'hidden', background: 'white' }}>
          <div className="flex-1 px-3 pt-3">
          {!agenceSettings?.masquer_entete && (
            <div className="mb-8 pb-4 border-b-2 border-black">
              <div className="flex justify-between items-end">
                {!agenceSettings?.masquer_logo && agenceSettings?.logo_url && (
                  <div className="w-1/4">
                    <img 
                      src={agenceSettings.logo_url} 
                      alt="Logo" 
                      className="h-24 w-auto object-contain" 
                      crossOrigin="anonymous"
                    />
                  </div>
                )}
                <div className={`flex-1 text-center ${!agenceSettings?.masquer_logo && agenceSettings?.logo_url ? '' : 'w-full'}`}>
                  <h1 className="text-[14pt] font-bold mb-3">CONTRAT DE LOCATION</h1>
                  <p className="text-[11pt] font-semibold">N° {blankMode ? ph() : contract.numero_contrat}</p>
                </div>
                {!agenceSettings?.masquer_logo && agenceSettings?.logo_url && (
                  <div className="w-1/4 text-right text-[11pt] text-gray-600">
                    {format(new Date(), 'dd/MM/yyyy')}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Informations principales */}
          <div className="grid grid-cols-2 gap-3 mb-3">
            {/* Locataire */}
            <div className="border-2 border-black">
              <div className="bg-white border-b-2 border-black p-2 text-center">
                <strong className="text-[11pt]">LOCATAIRE</strong>
              </div>
              <div className="p-3 space-y-1 text-[9pt]">
                <div><strong>Nom & Prénom:</strong> {blankMode ? ph() : `${client?.nom || ''} ${client?.prenom || ''}`}</div>
                <div className="grid grid-cols-2 gap-4">
                  <div><strong>CIN:</strong> {blankMode ? ph() : client?.cin}</div>
                  <div><strong>Permis:</strong> {blankMode ? ph() : client?.permis_conduire}</div>
                </div>
                <div><strong>Téléphone:</strong> {blankMode ? ph() : client?.telephone}</div>
                <div><strong>Adresse:</strong> {blankMode ? ph() : client?.adresse}</div>
              </div>
            </div>

            {/* 2ème conducteur */}
            <div className="border-2 border-black">
              <div className="bg-white border-b-2 border-black p-2 text-center">
                <strong className="text-[11pt]">2ÈME CONDUCTEUR</strong>
              </div>
              <div className="p-3 space-y-1 text-[9pt]">
                <div><strong>Nom & Prénom:</strong> {blankMode ? ph() : `${secondaryDriver?.nom || ''} ${secondaryDriver?.prenom || ''}`}</div>
                <div><strong>CIN:</strong> {blankMode ? ph() : (secondaryDriver?.cin || '')}</div>
                <div><strong>Permis:</strong> {blankMode ? ph() : (secondaryDriver?.permis_conduire || '')}</div>
              </div>
            </div>
          </div>

          {/* Véhicule et Location */}
          <div className="grid grid-cols-2 gap-3 mb-3">
            {/* Véhicule */}
            <div className="border-2 border-black">
              <div className="bg-white border-b-2 border-black p-2 text-center">
                <strong className="text-[11pt]">VÉHICULE</strong>
              </div>
              <div className="p-3 space-y-1 text-[9pt]">
                <div><strong>Marque/Modèle:</strong> {blankMode ? ph() : `${vehicle?.marque || ''} ${vehicle?.modele || ''}`}</div>
                <div><strong>Immatriculation:</strong> {blankMode ? ph() : (vehicle?.immatriculation || vehicle?.immatriculation_provisoire || 'N/A')}</div>
                <div><strong>Km départ:</strong> {blankMode ? ph() : (contract?.delivery_km || vehicle?.kilometrage)}</div>
              </div>
            </div>

            {/* Location */}
            <div className="border-2 border-black">
              <div className="bg-white border-b-2 border-black p-2 text-center">
                <strong className="text-[11pt]">LOCATION</strong>
              </div>
              <div className="p-3 space-y-1 text-[9pt]">
                <div><strong>Départ:</strong> {blankMode ? ph() : (contract.date_debut ? format(new Date(contract.date_debut), 'dd/MM/yyyy') : '')} - <strong>Retour:</strong> {blankMode ? ph() : (contract.date_fin ? format(new Date(contract.date_fin), 'dd/MM/yyyy') : '')}</div>
                <div><strong>Durée:</strong> {blankMode ? ph() : `${duration} jour(s)`} - <strong>Prix/Jr:</strong> {blankMode ? ph() : `${dailyRate.toFixed(2)} DH`}</div>
                <div><strong>Prix total:</strong> {blankMode ? ph() : `${totalAmount.toFixed(2)} DH`} - <strong>Caution:</strong> {blankMode ? ph() : `${contract?.caution_montant?.toFixed(2) || '0.00'} DH`}</div>
              </div>
            </div>
          </div>

          {/* Prolongations */}
          {!blankMode && contract?.prolongations && contract.prolongations.length > 0 && (
            <div className="border-2 border-yellow-500 bg-white mb-3">
              <div className="bg-white border-b-2 border-yellow-500 p-2 text-center">
                <strong className="text-[10pt]">⚠️ PROLONGATION(S)</strong>
              </div>
              <div className="p-3">
                {contract.prolongations.map((p: any, i: number) => {
                  const ancienneDate = p.ancienne_date_fin ? new Date(p.ancienne_date_fin) : null;
                  const nouvelleDate = p.nouvelle_date_fin ? new Date(p.nouvelle_date_fin) : null;
                  const duree = ancienneDate && nouvelleDate 
                    ? Math.ceil((nouvelleDate.getTime() - ancienneDate.getTime()) / (1000 * 60 * 60 * 24))
                    : 0;
                  const montant = duree * (contract.daily_rate || 0);
                  
                  return (
                    <div key={i} className="text-[9pt] mb-1">
                      {ancienneDate && nouvelleDate && (
                        <>
                          <strong>Prolongation #{i + 1}:</strong> Du {format(ancienneDate, 'dd/MM/yyyy')} au {format(nouvelleDate, 'dd/MM/yyyy')} - {duree} jour(s) - {montant.toFixed(2)} DH
                          {p.raison && <span className="text-gray-700"> ({p.raison})</span>}
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Changements de véhicule */}
          {!blankMode && vehicleChanges && vehicleChanges.length > 0 && (
            <div className="border-2 border-orange-500 bg-white mb-3">
              <div className="bg-white border-b-2 border-orange-500 p-2 text-center">
                <strong className="text-[10pt]">CHANGEMENT(S) DE VÉHICULE</strong>
              </div>
              <div className="p-3">
                {vehicleChanges.map((change: any, idx: number) => (
                  <div key={change.id} className="text-[9pt] mb-1">
                    <strong>#{idx + 1}:</strong> {change.old_vehicle?.immatriculation} → {change.new_vehicle?.immatriculation} - {formatReason(change.reason)}
                  </div>
                ))}
              </div>
            </div>
          )}


          <div className="grid grid-cols-2 gap-3 mb-3">
            <div className="border-2 border-black">
              <div className="bg-white border-b-2 border-black p-2 text-center">
                <strong className="text-[10pt]">ÉTAT DU VÉHICULE</strong>
              </div>
              <div className="p-2 flex items-center justify-center">
                <img src={vehicleInspectionDiagram} alt="Schéma inspection" className="w-full h-auto max-h-[125px] object-contain" />
              </div>
            </div>

            <div className="border-2 border-black">
              <div className="bg-white border-b-2 border-black p-2 text-center">
                <strong className="text-[10pt]">OBSERVATIONS</strong>
              </div>
              <div className="p-2 text-[9pt] min-h-[125px]">
                {blankMode ? '' : (contract?.delivery_notes || contract?.notes || '')}
              </div>
            </div>
          </div>

          {/* Note CGV */}
          <div className="text-center text-[8pt] italic my-2">
            * En signant le contrat, le client accepte les conditions générales de location.
          </div>

          {/* Signatures */}
          <div className="mt-auto mb-3">
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="h-16 mb-1 flex items-center justify-center">
                  {agenceSettings?.signature_agence_url && (
                    <img 
                      src={agenceSettings.signature_agence_url} 
                      alt="Signature agence" 
                      className="max-h-16 w-auto object-contain"
                      style={{ transform: 'scale(1.2)' }}
                      crossOrigin="anonymous"
                    />
                  )}
                </div>
                <div className="border-t-2 border-black pt-1">
                  <strong className="text-[9pt]">Signature Agence</strong>
                </div>
              </div>
              
              <div className="text-center">
                <div className="h-16 mb-1"></div>
                <div className="border-t-2 border-black pt-1">
                  <strong className="text-[9pt]">Signature Locataire</strong>
                </div>
              </div>
              
              <div className="text-center">
                <div className="h-16 mb-1"></div>
                <div className="border-t-2 border-black pt-1">
                  <strong className="text-[9pt]">Signature 2ème Conducteur</strong>
                </div>
              </div>
            </div>
          </div>

          </div>
          
          {/* Footer */}
          {!agenceSettings?.masquer_pied_page && (
            <div className="text-center text-[9.5pt] text-gray-600 pt-1 border-t border-gray-400 px-3 pb-2">
              {agenceSettings?.raison_sociale && <><strong>{agenceSettings.raison_sociale}</strong></>}
              {agenceSettings?.ice && <> | ICE: {agenceSettings.ice}</>}
              {agenceSettings?.if_number && <> | IF: {agenceSettings.if_number}</>}
              {agenceSettings?.rc && <> | RC: {agenceSettings.rc}</>}
              {agenceSettings?.cnss && <> | CNSS: {agenceSettings.cnss}</>}
              {agenceSettings?.patente && <> | Patente: {agenceSettings.patente}</>}
              <br/>
              {agenceSettings?.adresse && <>Adresse: {agenceSettings.adresse}</>}
              {agenceSettings?.telephone && <> | Tél: {agenceSettings.telephone}</>}
              {agenceSettings?.email && <> | Email: {agenceSettings.email}</>}
            </div>
          )}
        </div>

        {/* Page 2 - CGV */}
        {hasCgvPage && (
          <div className="page-break-before cgv-page"
               style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}>
            <div className="px-3 pt-3">
              <div className="text-center mb-3">
                <h2 className="text-[13pt] font-bold uppercase">CONDITIONS GÉNÉRALES DE LOCATION</h2>
              </div>
              <div className="whitespace-pre-wrap text-justify"
                   style={{ fontSize: '9.5pt', lineHeight: '1.4' }}>
                {agenceSettings.cgv_texte}
              </div>
            </div>
          </div>
        )}

      </div>
    </>
  );
}
