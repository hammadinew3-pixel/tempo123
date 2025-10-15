import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import vehicleInspectionDiagram from '@/assets/vehicle-inspection-diagram.png';

export default function ContractTemplate() {
  const [searchParams] = useSearchParams();
  const contractId = searchParams.get('id');
  const [contract, setContract] = useState<any>(null);
  const [vehicleChanges, setVehicleChanges] = useState<any[]>([]);
  const [secondaryDrivers, setSecondaryDrivers] = useState<any[]>([]);
  const [agenceSettings, setAgenceSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (contractId) {
      loadContractData();
    }
  }, [contractId]);

  useEffect(() => {
    if (!loading && contract) {
      setTimeout(() => window.print(), 500);
    }
  }, [loading, contract]);

  const loadContractData = async () => {
    try {
      const [contractRes, changesRes, driversRes, settingsRes] = await Promise.all([
        supabase
          .from('contracts')
          .select('*, clients(*), vehicles(*)')
          .eq('id', contractId)
          .single(),
        supabase
          .from('vehicle_changes')
          .select('*, old_vehicle:old_vehicle_id(*), new_vehicle:new_vehicle_id(*)')
          .eq('contract_id', contractId)
          .order('change_date', { ascending: true }),
        supabase
          .from('secondary_drivers')
          .select('*')
          .eq('contract_id', contractId),
        supabase
          .from('agence_settings')
          .select('*')
          .single()
      ]);

      if (contractRes.error) throw contractRes.error;

      setContract(contractRes.data);
      setVehicleChanges(changesRes.data || []);
      setSecondaryDrivers(driversRes.data || []);
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

  if (!contractId || !contract) {
    return (
      <div className="p-10 text-center">
        <h2 className="text-xl font-bold mb-4">Contrat non trouvé</h2>
      </div>
    );
  }

  const client = contract.clients;
  const vehicle = contract.vehicles;
  const secondaryDriver = secondaryDrivers[0];

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
          .page-break { page-break-before: always; }
        }
      `}</style>
      
      <div className="min-h-[297mm] flex flex-col p-6 font-sans text-[10pt] leading-normal bg-white w-[210mm] mx-auto print:p-0"
           style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}>
        
        {!agenceSettings?.masquer_entete && (
          <div className="mb-4 pb-2 border-b-2 border-black">
            <div className="flex justify-between items-center">
              {!agenceSettings?.masquer_logo && agenceSettings?.logo_url && (
                <img src={agenceSettings.logo_url} alt="Logo" className="h-10 w-auto object-contain" />
              )}
              <div className="flex-1 text-center">
                <h1 className="text-[14pt] font-bold">CONTRAT DE LOCATION N° {contract.numero_contrat}</h1>
              </div>
              <div className="text-[9pt] text-gray-600">
                {format(new Date(), 'dd/MM/yyyy')}
              </div>
            </div>
          </div>
        )}

        <table className="w-full border-collapse mb-3">
          <thead>
            <tr>
              <th className="bg-gray-300 border border-black p-1 text-center font-bold text-[10pt] w-1/2">LOCATAIRE</th>
              <th className="bg-gray-300 border border-black p-1 text-center font-bold text-[10pt] w-1/2">2ÈME CONDUCTEUR</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border border-black p-2 align-top">
                <div className="space-y-1 text-[9pt]">
                  <div><strong>Nom & Prénom:</strong> {client?.nom} {client?.prenom}</div>
                  <div><strong>CIN:</strong> {client?.cin}</div>
                  <div><strong>Permis:</strong> {client?.permis_conduire}</div>
                  <div><strong>Adresse:</strong> {client?.adresse}</div>
                  <div><strong>Tél:</strong> {client?.telephone}</div>
                </div>
              </td>
              <td className="border border-black p-2 align-top">
                <div className="space-y-1 text-[9pt]">
                  <div><strong>Nom & Prénom:</strong> {secondaryDriver?.nom} {secondaryDriver?.prenom}</div>
                  <div><strong>CIN:</strong> {secondaryDriver?.cin}</div>
                  <div><strong>Permis:</strong> {secondaryDriver?.permis_conduire}</div>
                  <div><strong>Tél:</strong> {secondaryDriver?.telephone}</div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        <table className="w-full border-collapse mb-3">
          <thead>
            <tr>
              <th className="bg-gray-300 border border-black p-1 text-center font-bold text-[10pt] w-1/2">VÉHICULE</th>
              <th className="bg-gray-300 border border-black p-1 text-center font-bold text-[10pt] w-1/2">LOCATION</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border border-black p-2 align-top">
                <div className="space-y-1 text-[9pt]">
                  <div><strong>Marque/Modèle:</strong> {vehicle?.marque} {vehicle?.modele}</div>
                  <div><strong>Immatriculation:</strong> {vehicle?.immatriculation}</div>
                  <div><strong>Km départ:</strong> {contract.delivery_km || vehicle?.kilometrage}</div>
                </div>
              </td>
              <td className="border border-black p-2 align-top">
                <div className="space-y-1 text-[9pt]">
                  <div><strong>Départ:</strong> {contract.date_debut ? format(new Date(contract.date_debut), 'dd/MM/yyyy') : ''}</div>
                  <div><strong>Retour:</strong> {contract.date_fin ? format(new Date(contract.date_fin), 'dd/MM/yyyy') : ''}</div>
                  <div><strong>Durée:</strong> {contract.duration}j</div>
                  <div><strong>Prix TTC:</strong> {contract.total_amount?.toFixed(2)} Dh</div>
                  <div><strong>Caution:</strong> {contract.caution_montant?.toFixed(2)} Dh</div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        {contract.prolongations && contract.prolongations.length > 0 && (
          <table className="w-full border-collapse mb-3">
            <thead>
              <tr>
                <th className="bg-yellow-100 border border-yellow-600 p-1 text-center font-bold text-[9pt]">
                  PROLONGATION(S)
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-black p-2">
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
                            Du {format(ancienneDate, 'dd/MM/yyyy')} au {format(nouvelleDate, 'dd/MM/yyyy')} - {duree}j - {montant.toFixed(2)} Dh
                            {p.raison && <span className="ml-2 text-gray-600">({p.raison})</span>}
                          </>
                        )}
                      </div>
                    );
                  })}
                </td>
              </tr>
            </tbody>
          </table>
        )}

        {vehicleChanges && vehicleChanges.length > 0 && (
          <table className="w-full border-collapse mb-3">
            <thead>
              <tr>
                <th className="bg-orange-100 border border-orange-600 p-1 text-center font-bold text-[9pt]">
                  CHANGEMENT(S) DE VÉHICULE
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-black p-2">
                  {vehicleChanges.map((change: any, idx: number) => (
                    <div key={change.id} className="text-[9pt] mb-1">
                      <strong>#{idx + 1}:</strong> {change.old_vehicle?.immatriculation} → {change.new_vehicle?.immatriculation} - {formatReason(change.reason)}
                    </div>
                  ))}
                </td>
              </tr>
            </tbody>
          </table>
        )}

        <table className="w-full border-collapse mb-3">
          <thead>
            <tr>
              <th className="bg-gray-300 border border-black p-1 text-center font-bold text-[10pt] w-1/2">ÉTAT DE VÉHICULE</th>
              <th className="bg-gray-300 border border-black p-1 text-center font-bold text-[10pt] w-1/2">OBSERVATIONS</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border border-black p-3 align-middle text-center">
                <img src={vehicleInspectionDiagram} alt="Schéma inspection véhicule" className="w-full h-auto max-h-40 object-contain mx-auto" />
              </td>
              <td className="border border-black p-2 h-40 align-top">
                <div className="text-[9pt]">{contract.delivery_notes || contract.notes || ''}</div>
              </td>
            </tr>
          </tbody>
        </table>

        <div className="flex-grow"></div>

        <div className="text-center text-[9pt] italic mb-3">
          * En signant le contrat, le client accepte les CGV.
        </div>

        <div className="flex justify-between mt-4 mb-3 gap-4">
          <div className="w-[32%] text-center">
            <div className="h-12 mb-2 flex items-center justify-center">
              {agenceSettings?.signature_agence_url && (
                <img 
                  src={agenceSettings.signature_agence_url} 
                  alt="Signature agence" 
                  className="max-h-12 w-auto object-contain"
                />
              )}
            </div>
            <div className="border-t border-black pt-1 text-[9pt]">
              <strong>Signature agence</strong>
            </div>
          </div>
          <div className="w-[32%] text-center">
            <div className="h-12 mb-2"></div>
            <div className="border-t border-black pt-1 text-[9pt]">
              <strong>Signature locataire</strong>
            </div>
          </div>
          <div className="w-[32%] text-center">
            <div className="h-12 mb-2"></div>
            <div className="border-t border-black pt-1 text-[9pt]">
              <strong>Signature 2ème conducteur</strong>
            </div>
          </div>
        </div>

        {!agenceSettings?.masquer_pied_page && (
          <div className="text-center text-[8pt] text-gray-600 mt-auto pt-3 border-t border-gray-300">
            {agenceSettings?.raison_sociale && <>{agenceSettings.raison_sociale}</>}
            {agenceSettings?.ice && <> | ICE: {agenceSettings.ice}</>}
            <br/>
            {agenceSettings?.adresse && <>Adresse: {agenceSettings.adresse}</>}
            {agenceSettings?.telephone && <> | Tél: {agenceSettings.telephone}</>}
          </div>
        )}
      </div>

      {agenceSettings?.inclure_cgv && agenceSettings?.cgv_texte && (
        <div className="page-break p-4 font-sans bg-white w-[210mm] mx-auto print:p-0"
             style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}>
          <div className="text-center mb-3">
            <h2 className="text-[12pt] font-bold uppercase">CONDITIONS GÉNÉRALES DE VENTE</h2>
          </div>
          <div className="text-[10.5pt] leading-normal whitespace-pre-wrap text-justify">
            {agenceSettings.cgv_texte}
          </div>
        </div>
      )}
    </>
  );
}
