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

  useEffect(() => {
    if (!loading && contract) {
      setTimeout(() => window.print(), 500);
    }
  }, [loading, contract]);

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
  const prolongations = contract.prolongations || [];

  return (
    <>
      <style>{`
        @media print {
          @page { 
            size: A4 portrait;
            margin: 10mm;
          }
          body { margin: 0; }
          .page-break { page-break-before: always; }
        }
        .contract-table { border-collapse: collapse; width: 100%; }
        .contract-table th, .contract-table td { border: 2px solid #000; padding: 6px; }
        .contract-table th { background-color: #e0e0e0; font-weight: bold; text-align: center; font-size: 11pt; }
        .field { margin-bottom: 4px; font-size: 9pt; }
        .field strong { font-weight: 600; }
      `}</style>

      {/* PAGE 1: CONTRAT */}
      <div className="p-6 font-sans text-[9pt] leading-tight bg-white max-w-[210mm] mx-auto">
        
        {/* En-tête */}
        {!agenceSettings?.masquer_entete && (
          <div className="flex justify-between items-start mb-4 pb-2 border-b-2 border-black">
            {/* Logo */}
            {!agenceSettings?.masquer_logo && agenceSettings?.logo_url && (
              <img 
                src={agenceSettings.logo_url} 
                alt="Logo" 
                className="h-14 w-auto object-contain"
              />
            )}
            
            {/* Titre centré */}
            <div className="flex-1 text-center">
              <h1 className="text-[16pt] font-bold uppercase">Contrat de Location</h1>
              <div className="text-[10pt] font-semibold mt-1">N° {contract.numero_contrat}</div>
            </div>
            
            {/* Infos agence */}
            <div className="text-[8pt] text-right leading-tight max-w-[140px]">
              {agenceSettings?.raison_sociale && <div className="font-semibold">{agenceSettings.raison_sociale}</div>}
              {agenceSettings?.adresse && <div>{agenceSettings.adresse}</div>}
              {agenceSettings?.telephone && <div>Tél: {agenceSettings.telephone}</div>}
              {agenceSettings?.ice && <div>ICE: {agenceSettings.ice}</div>}
            </div>
          </div>
        )}

        {/* Section CLIENT */}
        <table className="contract-table mb-3">
          <thead>
            <tr>
              <th colSpan={4}>CLIENT</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="w-1/4">
                <div className="field"><strong>Compagnie:</strong> {client?.type === 'entreprise' ? client?.nom : ''}</div>
              </td>
              <td className="w-1/4">
                <div className="field"><strong>Nom:</strong> {client?.nom || ''}</div>
              </td>
              <td className="w-1/4">
                <div className="field"><strong>Prénom:</strong> {client?.prenom || ''}</div>
              </td>
              <td className="w-1/4">
                <div className="field"><strong>Adresse:</strong> {client?.adresse || ''}</div>
              </td>
            </tr>
            <tr>
              <td>
                <div className="field"><strong>CIN N°:</strong> {client?.cin || ''}</div>
              </td>
              <td>
                <div className="field"><strong>N° Permis:</strong> {client?.permis_conduire || ''}</div>
              </td>
              <td>
                <div className="field"><strong>N° Passeport:</strong></div>
              </td>
              <td>
                <div className="field"><strong>Réf dossier:</strong> {contract.numero_contrat}</div>
              </td>
            </tr>
            <tr>
              <td colSpan={4}>
                <div className="field"><strong>GSM:</strong> {client?.telephone || ''}</div>
              </td>
            </tr>
          </tbody>
        </table>

        {/* Section VOITURE */}
        <table className="contract-table mb-3">
          <thead>
            <tr>
              <th colSpan={4}>VOITURE</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="w-1/4">
                <div className="field"><strong>Marque:</strong> {vehicle?.marque || ''}</div>
              </td>
              <td className="w-1/4">
                <div className="field"><strong>Immatriculation:</strong> {vehicle?.immatriculation || ''}</div>
              </td>
              <td className="w-1/4">
                <div className="field"><strong>Km Départ:</strong> {contract.delivery_km || vehicle?.kilometrage || ''}</div>
              </td>
              <td className="w-1/4">
                <div className="field"><strong>Carburant:</strong> {contract.delivery_fuel_level || ''}</div>
              </td>
            </tr>
            <tr>
              <td colSpan={2}>
                <div className="field"><strong>Lieu Départ:</strong> {contract.start_location || ''}</div>
              </td>
              <td colSpan={2}>
                <div className="field"><strong>Lieu Retour:</strong> {contract.end_location || contract.start_location || ''}</div>
              </td>
            </tr>
            <tr>
              <td>
                <div className="field"><strong>Date:</strong> {contract.date_debut ? format(new Date(contract.date_debut), 'dd/MM/yyyy', { locale: fr }) : ''}</div>
              </td>
              <td>
                <div className="field"><strong>Heure:</strong> {contract.start_time || ''}</div>
              </td>
              <td>
                <div className="field"><strong>Lieu:</strong> {contract.start_location || ''}</div>
              </td>
              <td>
                <div className="field"><strong>Durée:</strong> {contract.daily_rate?.toFixed(0) || 0} DH x {contract.duration || 0}j = {contract.total_amount?.toFixed(0) || 0} DH</div>
              </td>
            </tr>
          </tbody>
        </table>

        {/* Section PROLONGATION */}
        {prolongations.length > 0 && (
          <table className="contract-table mb-3">
            <thead>
              <tr>
                <th colSpan={4}>PROLONGATION</th>
              </tr>
            </thead>
            <tbody>
              {prolongations.map((p: any, idx: number) => (
                <tr key={idx}>
                  <td colSpan={4}>
                    <div className="field">
                      <strong>Prolongation {idx + 1}:</strong> Du {p.date_debut ? format(new Date(p.date_debut), 'dd/MM/yyyy') : ''} 
                      au {p.date_fin ? format(new Date(p.date_fin), 'dd/MM/yyyy') : ''} 
                      - {p.duree || 0} jour(s) - {p.montant?.toFixed(0) || 0} DH
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Section CHANGEMENT DE VÉHICULE */}
        {vehicleChanges.length > 0 && (
          <table className="contract-table mb-3">
            <thead>
              <tr>
                <th colSpan={4}>CHANGEMENT DE VÉHICULE</th>
              </tr>
            </thead>
            <tbody>
              {vehicleChanges.map((change: any, idx: number) => (
                <tr key={change.id}>
                  <td colSpan={4}>
                    <div className="field">
                      <strong>Changement {idx + 1}:</strong> {change.old_vehicle?.immatriculation} → {change.new_vehicle?.immatriculation} 
                      ({formatReason(change.reason)}) - {change.change_date ? format(new Date(change.change_date), 'dd/MM/yyyy') : ''}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Section AUTRES CONDUCTEURS */}
        <table className="contract-table mb-3">
          <thead>
            <tr>
              <th colSpan={4}>AUTRES CONDUCTEURS</th>
            </tr>
          </thead>
          <tbody>
            {secondaryDrivers.length > 0 ? (
              secondaryDrivers.map((driver: any) => (
                <tr key={driver.id}>
                  <td className="w-1/3">
                    <div className="field"><strong>Nom & Prénom:</strong> {driver.nom} {driver.prenom || ''}</div>
                  </td>
                  <td className="w-1/3">
                    <div className="field"><strong>CIN/Passeport:</strong> {driver.cin || ''}</div>
                  </td>
                  <td className="w-1/3">
                    <div className="field"><strong>N° Permis:</strong> {driver.permis_conduire || ''}</div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4}>
                  <div className="field text-center text-gray-500">CIN/Passeport renseigné: _________________</div>
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Section AGENCES */}
        <table className="contract-table mb-3">
          <thead>
            <tr>
              <th className="w-1/2">Agence Départ</th>
              <th className="w-1/2">Agence Retour</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <div className="field">{contract.start_location || agenceSettings?.raison_sociale || ''}</div>
              </td>
              <td>
                <div className="field">{contract.end_location || contract.start_location || agenceSettings?.raison_sociale || ''}</div>
              </td>
            </tr>
          </tbody>
        </table>

        {/* Section MODE DE RÈGLEMENT */}
        <table className="contract-table mb-3">
          <thead>
            <tr>
              <th colSpan={3}>MODE DE RÈGLEMENT</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="w-1/3 text-center">
                <div className="field">
                  <input type="checkbox" checked={contract.payment_method === 'especes'} readOnly /> Espèces
                </div>
              </td>
              <td className="w-1/3 text-center">
                <div className="field">
                  <input type="checkbox" checked={contract.payment_method === 'cheque'} readOnly /> Chèque
                </div>
              </td>
              <td className="w-1/3 text-center">
                <div className="field">
                  <input type="checkbox" checked={contract.payment_method && !['especes', 'cheque'].includes(contract.payment_method)} readOnly /> Autres
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        {/* Diagramme véhicule + Observations */}
        <table className="contract-table mb-3">
          <thead>
            <tr>
              <th className="w-1/2">DIAGRAMME DU VÉHICULE</th>
              <th className="w-1/2">OBSERVATIONS</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="align-top" style={{ height: '180px' }}>
                {/* SVG Simple du véhicule */}
                <svg viewBox="0 0 200 120" className="w-full h-full">
                  {/* Vue de dessus simplifiée */}
                  <rect x="40" y="20" width="120" height="80" fill="none" stroke="#000" strokeWidth="2" rx="8"/>
                  <rect x="50" y="10" width="100" height="15" fill="none" stroke="#000" strokeWidth="1.5"/>
                  <rect x="50" y="95" width="100" height="15" fill="none" stroke="#000" strokeWidth="1.5"/>
                  <circle cx="60" cy="30" r="8" fill="none" stroke="#000" strokeWidth="1.5"/>
                  <circle cx="140" cy="30" r="8" fill="none" stroke="#000" strokeWidth="1.5"/>
                  <circle cx="60" cy="90" r="8" fill="none" stroke="#000" strokeWidth="1.5"/>
                  <circle cx="140" cy="90" r="8" fill="none" stroke="#000" strokeWidth="1.5"/>
                  <text x="100" y="65" textAnchor="middle" fontSize="10" fill="#666">Vue dessus</text>
                </svg>
              </td>
              <td className="align-top" style={{ height: '180px' }}>
                <div className="field text-[8pt] whitespace-pre-wrap h-full overflow-hidden">
                  {contract.delivery_notes || contract.notes || 'Aucune observation'}
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        {/* Signatures */}
        <table className="contract-table mb-3">
          <thead>
            <tr>
              <th className="w-1/3">Signature Agence</th>
              <th className="w-1/3">Signature Client</th>
              <th className="w-1/3">Signature 2ème Conducteur</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ height: '60px' }} className="align-bottom text-center">
                {contract.signed_at && (
                  <div className="text-[7pt] text-gray-500">
                    Signé le {format(new Date(contract.signed_at), 'dd/MM/yyyy HH:mm')}
                  </div>
                )}
              </td>
              <td style={{ height: '60px' }} className="align-bottom text-center"></td>
              <td style={{ height: '60px' }} className="align-bottom text-center"></td>
            </tr>
          </tbody>
        </table>

        {/* Pied de page */}
        {!agenceSettings?.masquer_pied_page && (
          <div className="text-center text-[7pt] text-gray-600 mt-2 border-t pt-2">
            {agenceSettings?.raison_sociale && <>{agenceSettings.raison_sociale}</>}
            {agenceSettings?.ice && <> | ICE: {agenceSettings.ice}</>}
            {agenceSettings?.rc && <> | RC: {agenceSettings.rc}</>}
            {agenceSettings?.cnss && <> | CNSS: {agenceSettings.cnss}</>}
            {agenceSettings?.patente && <> | Patente: {agenceSettings.patente}</>}
            {agenceSettings?.if_number && <> | IF: {agenceSettings.if_number}</>}
            <br/>
            {agenceSettings?.adresse && <>Adresse: {agenceSettings.adresse}</>}
            {agenceSettings?.telephone && <> | Tél: {agenceSettings.telephone}</>}
            {agenceSettings?.email && <> | Email: {agenceSettings.email}</>}
          </div>
        )}
      </div>

      {/* PAGE 2: CGV */}
      {agenceSettings?.inclure_cgv && agenceSettings?.cgv_texte && (
        <div className="page-break p-8 font-sans text-[10pt] leading-relaxed bg-white max-w-[210mm] mx-auto min-h-screen">
          <div className="text-center mb-6 pt-8">
            <h2 className="text-[16pt] font-bold uppercase">Conditions Générales de Vente</h2>
          </div>
          <div className="text-[9pt] leading-relaxed whitespace-pre-wrap text-justify">
            {agenceSettings.cgv_texte}
          </div>
        </div>
      )}
    </>
  );
}
