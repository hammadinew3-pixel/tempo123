import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

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
      
      <div className="p-4 font-sans text-[9pt] leading-tight bg-white w-[210mm] mx-auto print:p-0"
           style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}>
        
        {!agenceSettings?.masquer_entete && (
          <div className="mb-2 pb-1 border-b-2 border-black">
            <div className="flex justify-between items-center">
              {!agenceSettings?.masquer_logo && agenceSettings?.logo_url && (
                <img src={agenceSettings.logo_url} alt="Logo" className="h-10 w-auto object-contain" />
              )}
              <div className="flex-1 text-center">
                <h1 className="text-[13pt] font-bold">CONTRAT DE LOCATION N° {contract.numero_contrat}</h1>
              </div>
              <div className="text-[8pt] text-gray-600">
                {format(new Date(), 'dd/MM/yyyy')}
              </div>
            </div>
          </div>
        )}

        <table className="w-full border-collapse mb-1.5">
          <thead>
            <tr>
              <th className="bg-gray-300 border border-black p-1 text-center font-bold text-[9pt] w-1/2">LOCATAIRE</th>
              <th className="bg-gray-300 border border-black p-1 text-center font-bold text-[9pt] w-1/2">2ÈME CONDUCTEUR</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border border-black p-1.5 align-top">
                <div className="space-y-0.5 text-[7.5pt]">
                  <div><strong>Nom & Prénom:</strong> {client?.nom} {client?.prenom}</div>
                  <div><strong>CIN:</strong> {client?.cin}</div>
                  <div><strong>Permis:</strong> {client?.permis_conduire}</div>
                  <div><strong>Adresse:</strong> {client?.adresse}</div>
                  <div><strong>Tél:</strong> {client?.telephone}</div>
                </div>
              </td>
              <td className="border border-black p-1.5 align-top">
                <div className="space-y-0.5 text-[7.5pt]">
                  <div><strong>Nom & Prénom:</strong> {secondaryDriver?.nom} {secondaryDriver?.prenom}</div>
                  <div><strong>CIN:</strong> {secondaryDriver?.cin}</div>
                  <div><strong>Permis:</strong> {secondaryDriver?.permis_conduire}</div>
                  <div><strong>Tél:</strong> {secondaryDriver?.telephone}</div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        <table className="w-full border-collapse mb-1.5">
          <thead>
            <tr>
              <th className="bg-gray-300 border border-black p-1 text-center font-bold text-[9pt] w-1/2">VÉHICULE</th>
              <th className="bg-gray-300 border border-black p-1 text-center font-bold text-[9pt] w-1/2">LOCATION</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border border-black p-1.5 align-top">
                <div className="space-y-0.5 text-[7.5pt]">
                  <div><strong>Marque/Modèle:</strong> {vehicle?.marque} {vehicle?.modele}</div>
                  <div><strong>Immatriculation:</strong> {vehicle?.immatriculation}</div>
                  <div><strong>Km départ:</strong> {contract.delivery_km || vehicle?.kilometrage}</div>
                </div>
              </td>
              <td className="border border-black p-1.5 align-top">
                <div className="space-y-0.5 text-[7.5pt]">
                  <div><strong>Départ:</strong> {contract.date_debut ? format(new Date(contract.date_debut), 'dd/MM/yyyy') : ''}</div>
                  <div><strong>Retour:</strong> {contract.date_fin ? format(new Date(contract.date_fin), 'dd/MM/yyyy') : ''}</div>
                  <div><strong>Durée:</strong> {contract.duration}j</div>
                  <div><strong>Prix TTC:</strong> {contract.total_amount?.toFixed(2)} Dh</div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        {contract.prolongations && contract.prolongations.length > 0 && (
          <table className="w-full border-collapse mb-1.5">
            <thead>
              <tr>
                <th className="bg-yellow-100 border border-yellow-600 p-1 text-center font-bold text-[8pt]">
                  PROLONGATION(S)
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-black p-1.5">
                  {contract.prolongations.map((p: any, i: number) => (
                    <div key={i} className="text-[7pt] mb-0.5">
                      Du {p.date_debut ? format(new Date(p.date_debut), 'dd/MM/yyyy') : ''} au {p.date_fin ? format(new Date(p.date_fin), 'dd/MM/yyyy') : ''} - {p.duree}j - {p.montant} Dh
                    </div>
                  ))}
                </td>
              </tr>
            </tbody>
          </table>
        )}

        {vehicleChanges && vehicleChanges.length > 0 && (
          <table className="w-full border-collapse mb-1.5">
            <thead>
              <tr>
                <th className="bg-orange-100 border border-orange-600 p-1 text-center font-bold text-[8pt]">
                  CHANGEMENT(S) DE VÉHICULE
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-black p-1.5">
                  {vehicleChanges.map((change: any, idx: number) => (
                    <div key={change.id} className="text-[7pt] mb-0.5">
                      <strong>#{idx + 1}:</strong> {change.old_vehicle?.immatriculation} → {change.new_vehicle?.immatriculation} - {formatReason(change.reason)}
                    </div>
                  ))}
                </td>
              </tr>
            </tbody>
          </table>
        )}

        <table className="w-full border-collapse mb-1.5">
          <thead>
            <tr>
              <th className="bg-gray-300 border border-black p-1 text-center font-bold text-[9pt]">OBSERVATIONS</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border border-black p-1.5 h-12 align-top">
                <div className="text-[7.5pt]">{contract.delivery_notes || contract.notes || ''}</div>
              </td>
            </tr>
          </tbody>
        </table>

        <div className="text-center text-[7pt] italic mb-2">
          * En signant le contrat, le client accepte les CGV.
        </div>

        <div className="flex justify-between mt-3 mb-2">
          <div className="w-[48%] text-center">
            <div className="h-10 mb-1"></div>
            <div className="border-t border-black pt-0.5 text-[7.5pt]">
              <strong>Signature agence</strong>
            </div>
          </div>
          <div className="w-[48%] text-center">
            <div className="h-10 mb-1"></div>
            <div className="border-t border-black pt-0.5 text-[7.5pt]">
              <strong>Signature locataire</strong>
            </div>
          </div>
        </div>

        {!agenceSettings?.masquer_pied_page && (
          <div className="text-center text-[6.5pt] text-gray-600">
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
            <h2 className="text-[11pt] font-bold uppercase">CONDITIONS GÉNÉRALES DE VENTE</h2>
          </div>
          <div className="text-[10.5pt] leading-normal whitespace-pre-wrap text-justify">
            {agenceSettings.cgv_texte}
          </div>
        </div>
      )}
    </>
  );
}
