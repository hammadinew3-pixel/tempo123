import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

export default function ContractTemplate() {
  const [searchParams] = useSearchParams();
  const contractId = searchParams.get('id');
  const [contract, setContract] = useState<any>(null);
  const [client, setClient] = useState<any>(null);
  const [vehicle, setVehicle] = useState<any>(null);
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
      const { data: contractData, error: contractError } = await supabase
        .from('contracts')
        .select(`
          *,
          clients (*),
          vehicles (*)
        `)
        .eq('id', contractId)
        .single();

      if (contractError) throw contractError;

      setContract(contractData);
      setClient(contractData.clients);
      setVehicle(contractData.vehicles);
    } catch (error) {
      console.error('Error loading contract:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-10 text-center">Chargement...</div>;
  }

  if (!contractId) {
    return (
      <div className="p-10 text-center">
        <h2 className="text-xl font-bold mb-4">Aucun contrat spécifié</h2>
        <p className="text-muted-foreground">Veuillez accéder à cette page depuis la liste des contrats.</p>
      </div>
    );
  }

  if (!contract) {
    return <div className="p-10 text-center">Contrat non trouvé</div>;
  }

  return (
    <div className="p-10 font-sans text-sm leading-6 text-gray-800 bg-white max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">CONTRAT DE LOCATION DE VÉHICULE</h1>
        <p className="text-lg text-gray-600">N° {contract.numero_contrat}</p>
      </div>

      <div className="mb-8 border-2 border-gray-800 p-6">
        <h2 className="text-xl font-bold mb-4 border-b-2 border-gray-300 pb-2">INFORMATIONS DU CONTRAT</h2>
        
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <p className="font-semibold">Date de début :</p>
            <p>{new Date(contract.date_debut).toLocaleDateString('fr-FR')}</p>
            {contract.start_time && <p className="text-xs text-gray-600">Heure: {contract.start_time}</p>}
          </div>
          <div>
            <p className="font-semibold">Date de fin :</p>
            <p>{new Date(contract.date_fin).toLocaleDateString('fr-FR')}</p>
            {contract.end_time && <p className="text-xs text-gray-600">Heure: {contract.end_time}</p>}
          </div>
        </div>

        <div className="mb-4">
          <p className="font-semibold">Durée de location :</p>
          <p className="text-lg">{contract.duration} jour(s)</p>
        </div>
      </div>

      <div className="mb-8 border-2 border-gray-800 p-6">
        <h2 className="text-xl font-bold mb-4 border-b-2 border-gray-300 pb-2">CLIENT</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="font-semibold">Nom complet :</p>
            <p>{client?.nom} {client?.prenom}</p>
          </div>
          <div>
            <p className="font-semibold">Téléphone :</p>
            <p>{client?.telephone}</p>
          </div>
          {client?.email && (
            <div>
              <p className="font-semibold">Email :</p>
              <p>{client?.email}</p>
            </div>
          )}
          {client?.cin && (
            <div>
              <p className="font-semibold">CIN :</p>
              <p>{client?.cin}</p>
            </div>
          )}
          {client?.adresse && (
            <div className="col-span-2">
              <p className="font-semibold">Adresse :</p>
              <p>{client?.adresse}</p>
            </div>
          )}
        </div>
      </div>

      <div className="mb-8 border-2 border-gray-800 p-6">
        <h2 className="text-xl font-bold mb-4 border-b-2 border-gray-300 pb-2">VÉHICULE</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="font-semibold">Marque et Modèle :</p>
            <p className="text-lg">{vehicle?.marque} {vehicle?.modele}</p>
          </div>
          <div>
            <p className="font-semibold">Immatriculation :</p>
            <p className="text-lg font-bold">{vehicle?.immatriculation}</p>
          </div>
          <div>
            <p className="font-semibold">Année :</p>
            <p>{vehicle?.annee}</p>
          </div>
          <div>
            <p className="font-semibold">Kilométrage :</p>
            <p>{vehicle?.kilometrage} km</p>
          </div>
        </div>
      </div>

      {(contract.start_location || contract.end_location) && (
        <div className="mb-8 border-2 border-gray-800 p-6">
          <h2 className="text-xl font-bold mb-4 border-b-2 border-gray-300 pb-2">LIEUX</h2>
          <div className="grid grid-cols-2 gap-4">
            {contract.start_location && (
              <div>
                <p className="font-semibold">Lieu de départ :</p>
                <p>{contract.start_location}</p>
              </div>
            )}
            {contract.end_location && (
              <div>
                <p className="font-semibold">Lieu de retour :</p>
                <p>{contract.end_location}</p>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="mb-8 border-2 border-gray-800 p-6 bg-gray-50">
        <h2 className="text-xl font-bold mb-4 border-b-2 border-gray-300 pb-2">DÉTAILS FINANCIERS</h2>
        <div className="space-y-3">
          <div className="flex justify-between text-lg">
            <span className="font-semibold">Tarif journalier :</span>
            <span>{contract.daily_rate?.toFixed(2)} MAD</span>
          </div>
          <div className="flex justify-between text-lg">
            <span className="font-semibold">Durée :</span>
            <span>{contract.duration} jour(s)</span>
          </div>
          <div className="flex justify-between text-xl font-bold border-t-2 border-gray-400 pt-2">
            <span>MONTANT TOTAL :</span>
            <span>{contract.total_amount?.toFixed(2)} MAD</span>
          </div>
          <div className="flex justify-between text-lg">
            <span className="font-semibold">Acompte versé :</span>
            <span>{contract.advance_payment?.toFixed(2)} MAD</span>
          </div>
          <div className="flex justify-between text-xl font-bold text-orange-600 border-t-2 border-gray-400 pt-2">
            <span>RESTE À PAYER :</span>
            <span>{contract.remaining_amount?.toFixed(2)} MAD</span>
          </div>
          {contract.payment_method && (
            <div className="flex justify-between text-sm text-gray-600 pt-2">
              <span>Mode de paiement :</span>
              <span className="uppercase">{contract.payment_method}</span>
            </div>
          )}
        </div>
      </div>

      <div className="mb-8 border-2 border-gray-800 p-6">
        <h2 className="text-xl font-bold mb-4 border-b-2 border-gray-300 pb-2">CAUTION</h2>
        <div className="text-lg">
          <p className="font-semibold">Montant de la caution : <span className="text-blue-600">{contract.caution_montant?.toFixed(2)} MAD</span></p>
          <p className="text-sm text-gray-600 mt-2">
            La caution sera restituée à la fin de la location après vérification de l'état du véhicule.
          </p>
        </div>
      </div>

      {contract.notes && (
        <div className="mb-8 border-2 border-gray-800 p-6">
          <h2 className="text-xl font-bold mb-4 border-b-2 border-gray-300 pb-2">NOTES / REMARQUES</h2>
          <p>{contract.notes}</p>
        </div>
      )}

      <div className="mb-8 p-6 bg-gray-100">
        <h2 className="text-xl font-bold mb-4">CONDITIONS GÉNÉRALES</h2>
        <ul className="list-disc list-inside space-y-2 text-sm">
          <li>Le locataire s'engage à restituer le véhicule dans l'état dans lequel il l'a reçu.</li>
          <li>Toute prolongation de location doit être approuvée par l'agence.</li>
          <li>Le locataire est responsable de toutes les infractions commises pendant la période de location.</li>
          <li>Le véhicule est assuré selon les termes du contrat d'assurance.</li>
          <li>En cas de dommages, la franchise de {contract.caution_montant} MAD s'applique.</li>
        </ul>
      </div>

      <div className="mt-12 pt-8 border-t-2 border-gray-300">
        <p className="text-center mb-8">
          Fait à {contract.start_location || 'Casablanca'}, le{' '}
          {contract.signed_at 
            ? new Date(contract.signed_at).toLocaleDateString('fr-FR')
            : new Date().toLocaleDateString('fr-FR')}
        </p>

        <div className="grid grid-cols-2 gap-12 mt-12">
          <div>
            <p className="font-bold mb-8">Signature du Client :</p>
            {contract.client_signature ? (
              <img src={contract.client_signature} alt="Signature client" className="h-24 border-b-2 border-gray-800" />
            ) : (
              <div className="h-24 border-b-2 border-gray-800"></div>
            )}
          </div>
          <div>
            <p className="font-bold mb-8">Signature de l'Agence :</p>
            {contract.witness_signature ? (
              <img src={contract.witness_signature} alt="Signature agence" className="h-24 border-b-2 border-gray-800" />
            ) : (
              <div className="h-24 border-b-2 border-gray-800"></div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
