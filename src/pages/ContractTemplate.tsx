import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

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
    } else {
      setLoading(false);
    }
  }, [contractId]);

  const loadContractData = async () => {
    try {
      const [contractRes, changesRes, driversRes, settingsRes] = await Promise.all([
        supabase
          .from('contracts')
          .select(`
            *,
            clients (*),
            vehicles (*)
          `)
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
        <p className="text-muted-foreground">Veuillez accéder à cette page depuis la liste des contrats.</p>
      </div>
    );
  }

  const client = contract.clients;
  const vehicle = contract.vehicles;
  const secondaryDriver = secondaryDrivers[0];

  return (
    <div className="p-8 font-sans text-[11pt] leading-normal bg-white max-w-[210mm] mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6 pb-3 border-b-2 border-black">
        <h1 className="text-[18pt] font-bold">CONTRAT DE LOCATION N° {contract.numero_contrat}</h1>
        <div className="text-[10pt] text-gray-600">
          Édité le {format(new Date(), 'dd/MM/yyyy')}
        </div>
      </div>

      {/* Table 1: Locataire & Deuxième conducteur */}
      <table className="w-full border-collapse mb-5">
        <thead>
          <tr>
            <th className="bg-gray-300 border border-black p-2 text-center font-bold text-[12pt] w-1/2">
              LOCATAIRE
            </th>
            <th className="bg-gray-300 border border-black p-2 text-center font-bold text-[12pt] w-1/2">
              DEUXIÈME CONDUCTEUR
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="border border-black p-3 align-top">
              <div className="space-y-1.5 text-[10pt]">
                <div><strong>Nom & Prénom:</strong> {client?.nom || ''} {client?.prenom || ''}</div>
                <div><strong>CIN N°:</strong> {client?.cin || ''}</div>
                <div><strong>Permis de conduire N°:</strong> {client?.permis_conduire || ''}</div>
                <div><strong>Délivré le:</strong> {contract.date_debut ? format(new Date(contract.date_debut), 'dd/MM/yyyy') : ''}</div>
                <div><strong>Passeport N°:</strong></div>
                <div><strong>Adresse:</strong> {client?.adresse || ''}</div>
                <div><strong>Tél:</strong> {client?.telephone || ''}</div>
              </div>
            </td>
            <td className="border border-black p-3 align-top">
              <div className="space-y-1.5 text-[10pt]">
                <div><strong>Nom & Prénom:</strong> {secondaryDriver?.nom || ''} {secondaryDriver?.prenom || ''}</div>
                <div><strong>CIN N°:</strong> {secondaryDriver?.cin || ''}</div>
                <div><strong>Permis de conduire N°:</strong> {secondaryDriver?.permis_conduire || ''}</div>
                <div><strong>Délivré le:</strong></div>
                <div><strong>Passeport N°:</strong></div>
                <div><strong>Adresse:</strong></div>
                <div><strong>Tél:</strong> {secondaryDriver?.telephone || ''}</div>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      {/* Table 2: Véhicule & Location */}
      <table className="w-full border-collapse mb-5">
        <thead>
          <tr>
            <th className="bg-gray-300 border border-black p-2 text-center font-bold text-[12pt] w-1/2">
              VÉHICULE
            </th>
            <th className="bg-gray-300 border border-black p-2 text-center font-bold text-[12pt] w-1/2">
              LOCATION
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="border border-black p-3 align-top">
              <div className="space-y-1.5 text-[10pt]">
                <div><strong>Marque/Modèle:</strong> {vehicle?.marque || ''} - {vehicle?.modele || ''}</div>
                <div><strong>Immatriculation:</strong> {vehicle?.immatriculation || ''}</div>
                <div><strong>Carburant:</strong> Diesel</div>
                <div><strong>Km départ:</strong> {contract.delivery_km || vehicle?.kilometrage || ''} KMs</div>
              </div>
            </td>
            <td className="border border-black p-3 align-top">
              <div className="space-y-1.5 text-[10pt]">
                <div><strong>Date de départ:</strong> {contract.date_debut ? format(new Date(contract.date_debut), 'dd/MM/yyyy HH:mm', { locale: fr }) : ''}</div>
                <div><strong>Date de retour:</strong> {contract.date_fin ? format(new Date(contract.date_fin), 'dd/MM/yyyy HH:mm', { locale: fr }) : ''}</div>
                <div><strong>Durée de location:</strong> {contract.duration || 0} jour(s)</div>
                <div><strong>Prix total (TTC):</strong> {contract.total_amount?.toFixed(2) || '0.00'} Dh</div>
                <div><strong>Lieu de départ:</strong> {contract.start_location || ''}</div>
                <div><strong>Lieu de retour:</strong> {contract.end_location || contract.start_location || ''}</div>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      {/* Table 3: Changements de véhicule (si présent) */}
      {vehicleChanges && vehicleChanges.length > 0 && (
        <table className="w-full border-collapse mb-5">
          <thead>
            <tr>
              <th colSpan={2} className="bg-yellow-100 border-2 border-yellow-500 p-2 text-center font-bold text-[12pt]">
                ⚠️ CHANGEMENT(S) DE VÉHICULE
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={2} className="border border-black p-3">
                {vehicleChanges.map((change: any, index: number) => (
                  <div key={change.id} className="mb-3 pb-3 border-b last:border-b-0 last:mb-0 last:pb-0">
                    <div className="text-[10pt] font-bold text-orange-600 mb-2">
                      Changement #{index + 1} - {change.change_date ? format(new Date(change.change_date), 'dd/MM/yyyy', { locale: fr }) : ''}
                    </div>
                    <div className="text-[9pt] space-y-1">
                      <div><strong>Ancien véhicule:</strong> {change.old_vehicle?.marque} {change.old_vehicle?.modele} ({change.old_vehicle?.immatriculation})</div>
                      <div><strong>Nouveau véhicule:</strong> {change.new_vehicle?.marque} {change.new_vehicle?.modele} ({change.new_vehicle?.immatriculation})</div>
                      <div><strong>Raison:</strong> {formatReason(change.reason)}</div>
                      {change.notes && (
                        <div className="text-[8.5pt] text-gray-700 mt-1"><strong>Détails:</strong> {change.notes}</div>
                      )}
                    </div>
                  </div>
                ))}
                <div className="mt-3 p-2 bg-blue-50 rounded text-[9pt]">
                  <strong>Note:</strong> Le montant total ci-dessous inclut le calcul au prorata des changements de véhicule effectués.
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      )}

      {/* Table 4: État de véhicule & Observations */}
      <table className="w-full border-collapse mb-5">
        <thead>
          <tr>
            <th className="bg-gray-300 border border-black p-2 text-center font-bold text-[12pt] w-1/2">
              ÉTAT DE VÉHICULE
            </th>
            <th className="bg-gray-300 border border-black p-2 text-center font-bold text-[12pt] w-1/2">
              OBSERVATIONS
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="border border-black p-3 h-[200px] text-center align-middle">
              <div className="text-[9pt] text-gray-500">
                Schéma d&apos;inspection du véhicule<br/>
                (À compléter lors de la remise des clés)
              </div>
            </td>
            <td className="border border-black p-3 h-[200px] align-top">
              <div className="text-[10pt] whitespace-pre-wrap">
                {contract.delivery_notes || contract.notes || ''}
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      {/* Footer note */}
      <div className="text-center text-[9pt] italic mb-8">
        * En signant le contrat de location, le client accepte les conditions générales de location fournies par le loueur professionnel.
      </div>

      {/* Signatures */}
      <div className="flex justify-between mt-12 mb-8">
        <div className="w-[45%] text-center">
          <div className="h-20 mb-2"></div>
          <div className="border-t-2 border-black pt-2">
            <strong>Signature agence :</strong>
          </div>
        </div>
        <div className="w-[45%] text-center">
          <div className="h-20 mb-2"></div>
          <div className="border-t-2 border-black pt-2">
            <strong>Signature locataire :</strong>
          </div>
        </div>
      </div>

      {/* Company info */}
      <div className="text-center text-[9pt] text-gray-600 mt-6">
        {agenceSettings?.raison_sociale && <>{agenceSettings.raison_sociale}</>}
        {agenceSettings?.ice && <> | ICE: {agenceSettings.ice}</>}
        <br/>
        {agenceSettings?.adresse && <>Adresse: {agenceSettings.adresse}</>}
        {agenceSettings?.telephone && <> | Tél: {agenceSettings.telephone}</>}
        {agenceSettings?.email && <> | Email: {agenceSettings.email}</>}
      </div>
    </div>
  );
}
