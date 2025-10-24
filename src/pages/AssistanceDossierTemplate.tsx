import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export default function AssistanceDossierTemplate() {
  const [searchParams] = useSearchParams();
  const assistanceId = searchParams.get("id");
  const [assistance, setAssistance] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, [assistanceId]);

  const loadData = async () => {
    if (!assistanceId) return;

    try {
      // Load settings
      const { data: settingsData } = await supabase
        .from("tenant_settings")
        .select("*")
        .maybeSingle();
      setSettings(settingsData);

      const { data, error } = await supabase
        .from("assistance")
        .select(`
          *,
          clients (nom, prenom, telephone, email, cin, permis_conduire, adresse),
          vehicles (immatriculation, immatriculation_provisoire, ww, marque, modele, annee, categorie, kilometrage)
        `)
        .eq("id", assistanceId)
        .single();

      if (error) {
        console.error("Error loading assistance:", error);
      } else {
        let assistanceData: any = data;
        
        // Charger l'assurance séparément si assureur_id existe
        if (data?.assureur_id) {
          const { data: assuranceData } = await supabase
            .from('assurances')
            .select('nom, contact_nom, contact_telephone, contact_email, adresse')
            .eq('id', data.assureur_id)
            .maybeSingle();
          
          if (assuranceData) {
            assistanceData = {
              ...data,
              assurance: assuranceData
            };
          }
        }
        
        setAssistance(assistanceData);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (assistance && !loading) {
      setTimeout(() => window.print(), 500);
    }
  }, [assistance, loading]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Chargement...</div>
      </div>
    );
  }

  if (!assistance) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Dossier d'assistance introuvable</div>
      </div>
    );
  }

  const clientName = `${assistance.clients?.nom || ''} ${assistance.clients?.prenom || ''}`.trim();
  const vehicleName = `${assistance.vehicles?.marque || ''} ${assistance.vehicles?.modele || ''}`.trim();
  const startDate = new Date(assistance.date_debut);
  const endDate = assistance.date_fin ? new Date(assistance.date_fin) : new Date();
  const duration = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      remplacement: 'Véhicule de remplacement',
      panne: 'Panne',
      accident: 'Accident',
    };
    return labels[type] || type;
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      ouvert: 'Réservation',
      contrat_valide: 'Contrat validé',
      livre: 'En cours',
      retour_effectue: 'Retour effectué',
      cloture: 'Clôturé',
    };
    return labels[status] || status;
  };

  return (
    <div className="max-w-4xl mx-auto p-8 bg-white print:p-0">
      <style>{`
        @media print {
          body { margin: 0; padding: 20px; }
          @page { size: A4; margin: 15mm; }
        }
      `}</style>

      {/* Header */}
      {!settings?.masquer_entete && (
        <div className="border-b-2 border-black pb-4 mb-6">
          {!settings?.masquer_logo && settings?.logo_url && (
            <div className="flex justify-center mb-4">
              <img 
                src={settings.logo_url} 
                alt="Logo" 
                className="h-16 w-auto object-contain"
              />
            </div>
          )}
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-2">DOSSIER D'ASSISTANCE</h1>
            <p className="text-lg">N° {assistance.num_dossier}</p>
            <p className="text-sm text-gray-600 mt-2">
              Date d'émission : {format(new Date(assistance.created_at), 'dd MMMM yyyy', { locale: fr })}
            </p>
          </div>
        </div>
      )}

      {/* Informations générales */}
      <div className="mb-6">
        <h3 className="font-bold text-lg mb-3 bg-gray-100 p-2">INFORMATIONS GÉNÉRALES</h3>
        <table className="w-full text-sm">
          <tbody>
            <tr className="border-b">
              <td className="py-2 font-semibold w-1/3">Type :</td>
              <td className="py-2">{getTypeLabel(assistance.type)}</td>
            </tr>
            <tr className="border-b">
              <td className="py-2 font-semibold">Statut :</td>
              <td className="py-2">{getStatusLabel(assistance.etat)}</td>
            </tr>
            {(assistance.ordre_mission || assistance.ordre_mission_url) && (
              <tr className="border-b">
                <td className="py-2 font-semibold">Ordre de mission :</td>
                <td className="py-2">
                  {assistance.ordre_mission}
                  {assistance.ordre_mission_url && (
                    <a 
                      href={assistance.ordre_mission_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="ml-2 text-blue-600 hover:underline"
                    >
                      Voir le document
                    </a>
                  )}
                </td>
              </tr>
            )}
            <tr className="border-b">
              <td className="py-2 font-semibold">Date début :</td>
              <td className="py-2">{format(startDate, 'dd MMMM yyyy', { locale: fr })}</td>
            </tr>
            <tr className="border-b">
              <td className="py-2 font-semibold">Date fin prévue :</td>
              <td className="py-2">{format(endDate, 'dd MMMM yyyy', { locale: fr })}</td>
            </tr>
            <tr className="border-b">
              <td className="py-2 font-semibold">Durée :</td>
              <td className="py-2">{duration} jour(s)</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Prolongations */}
      {assistance.prolongations && assistance.prolongations.length > 0 && (
        <div className="mb-6 bg-yellow-50 border-2 border-yellow-300 rounded p-4">
          <h3 className="font-bold text-lg mb-3 bg-yellow-100 p-2">⚠️ HISTORIQUE DES PROLONGATIONS</h3>
          <div className="space-y-4">
            {assistance.prolongations.map((prolongation: any, index: number) => (
              <div key={index} className="bg-white border border-gray-300 rounded p-3">
                <p className="font-semibold text-sm mb-2 text-blue-700">Prolongation #{index + 1}</p>
                <table className="w-full text-sm">
                  <tbody>
                    <tr className="border-b">
                      <td className="py-1 font-semibold w-1/3">Date :</td>
                      <td className="py-1">
                        {format(new Date(prolongation.date), 'dd/MM/yyyy à HH:mm', { locale: fr })}
                      </td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-1 font-semibold">Ancienne date de fin :</td>
                      <td className="py-1">
                        {format(new Date(prolongation.ancienne_date_fin), 'dd MMMM yyyy', { locale: fr })}
                      </td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-1 font-semibold">Nouvelle date de fin :</td>
                      <td className="py-1 text-blue-600 font-bold">
                        {format(new Date(prolongation.nouvelle_date_fin), 'dd MMMM yyyy', { locale: fr })}
                      </td>
                    </tr>
                    {prolongation.raison && (
                      <tr>
                        <td className="py-1 font-semibold align-top">Raison :</td>
                        <td className="py-1">{prolongation.raison}</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Compagnie d'assurance */}
      <div className="mb-6">
        <h3 className="font-bold text-lg mb-3 bg-gray-100 p-2">COMPAGNIE D'ASSURANCE</h3>
        <table className="w-full text-sm">
          <tbody>
            <tr className="border-b">
              <td className="py-2 font-semibold w-1/3">Compagnie :</td>
              <td className="py-2">{assistance.assurances?.nom || assistance.assureur_nom}</td>
            </tr>
            {assistance.assurances?.contact_nom && (
              <tr className="border-b">
                <td className="py-2 font-semibold">Contact :</td>
                <td className="py-2">{assistance.assurances.contact_nom}</td>
              </tr>
            )}
            {assistance.assurances?.contact_telephone && (
              <tr className="border-b">
                <td className="py-2 font-semibold">Téléphone :</td>
                <td className="py-2">{assistance.assurances.contact_telephone}</td>
              </tr>
            )}
            {assistance.assurances?.contact_email && (
              <tr className="border-b">
                <td className="py-2 font-semibold">Email :</td>
                <td className="py-2">{assistance.assurances.contact_email}</td>
              </tr>
            )}
            {assistance.assurances?.adresse && (
              <tr className="border-b">
                <td className="py-2 font-semibold">Adresse :</td>
                <td className="py-2">{assistance.assurances.adresse}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Client */}
      <div className="mb-6">
        <h3 className="font-bold text-lg mb-3 bg-gray-100 p-2">INFORMATIONS CLIENT</h3>
        <table className="w-full text-sm">
          <tbody>
            <tr className="border-b">
              <td className="py-2 font-semibold w-1/3">Nom complet :</td>
              <td className="py-2">{clientName}</td>
            </tr>
            <tr className="border-b">
              <td className="py-2 font-semibold">CIN :</td>
              <td className="py-2">{assistance.clients?.cin || 'N/A'}</td>
            </tr>
            <tr className="border-b">
              <td className="py-2 font-semibold">Permis de conduire :</td>
              <td className="py-2">{assistance.clients?.permis_conduire || 'N/A'}</td>
            </tr>
            <tr className="border-b">
              <td className="py-2 font-semibold">Téléphone :</td>
              <td className="py-2">{assistance.clients?.telephone || 'N/A'}</td>
            </tr>
            <tr className="border-b">
              <td className="py-2 font-semibold">Email :</td>
              <td className="py-2">{assistance.clients?.email || 'N/A'}</td>
            </tr>
            {assistance.clients?.adresse && (
              <tr className="border-b">
                <td className="py-2 font-semibold">Adresse :</td>
                <td className="py-2">{assistance.clients.adresse}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Véhicule de remplacement */}
      <div className="mb-6">
        <h3 className="font-bold text-lg mb-3 bg-gray-100 p-2">VÉHICULE DE REMPLACEMENT</h3>
        <table className="w-full text-sm">
          <tbody>
            <tr className="border-b">
              <td className="py-2 font-semibold w-1/3">Immatriculation :</td>
              <td className="py-2">{assistance.vehicles?.immatriculation}</td>
            </tr>
            <tr className="border-b">
              <td className="py-2 font-semibold">Marque / Modèle :</td>
              <td className="py-2">{vehicleName}</td>
            </tr>
            <tr className="border-b">
              <td className="py-2 font-semibold">Année :</td>
              <td className="py-2">{assistance.vehicles?.annee}</td>
            </tr>
            {assistance.vehicles?.categorie && (
              <tr className="border-b">
                <td className="py-2 font-semibold">Catégorie :</td>
                <td className="py-2">{assistance.vehicles.categorie.toUpperCase()}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* État livraison */}
      {(assistance.kilometrage_depart || assistance.niveau_carburant_depart || assistance.etat_vehicule_depart) && (
        <div className="mb-6">
          <h3 className="font-bold text-lg mb-3 bg-gray-100 p-2">ÉTAT À LA LIVRAISON</h3>
          <table className="w-full text-sm">
            <tbody>
              {assistance.kilometrage_depart && (
                <tr className="border-b">
                  <td className="py-2 font-semibold w-1/3">Kilométrage :</td>
                  <td className="py-2">{assistance.kilometrage_depart} km</td>
                </tr>
              )}
              {assistance.niveau_carburant_depart && (
                <tr className="border-b">
                  <td className="py-2 font-semibold">Carburant :</td>
                  <td className="py-2">{assistance.niveau_carburant_depart}</td>
                </tr>
              )}
              {assistance.etat_vehicule_depart && (
                <tr className="border-b">
                  <td className="py-2 font-semibold">État :</td>
                  <td className="py-2">{assistance.etat_vehicule_depart}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* État retour */}
      {(assistance.date_retour_effective || assistance.kilometrage_retour || assistance.niveau_carburant_retour || assistance.etat_vehicule_retour) && (
        <div className="mb-6">
          <h3 className="font-bold text-lg mb-3 bg-gray-100 p-2">ÉTAT AU RETOUR</h3>
          <table className="w-full text-sm">
            <tbody>
              {assistance.date_retour_effective && (
                <tr className="border-b">
                  <td className="py-2 font-semibold w-1/3">Date de retour :</td>
                  <td className="py-2">{format(new Date(assistance.date_retour_effective), 'dd MMMM yyyy', { locale: fr })}</td>
                </tr>
              )}
              {assistance.kilometrage_retour && (
                <tr className="border-b">
                  <td className="py-2 font-semibold">Kilométrage :</td>
                  <td className="py-2">{assistance.kilometrage_retour} km</td>
                </tr>
              )}
              {assistance.niveau_carburant_retour && (
                <tr className="border-b">
                  <td className="py-2 font-semibold">Carburant :</td>
                  <td className="py-2">{assistance.niveau_carburant_retour}</td>
                </tr>
              )}
              {assistance.etat_vehicule_retour && (
                <tr className="border-b">
                  <td className="py-2 font-semibold">État :</td>
                  <td className="py-2">{assistance.etat_vehicule_retour}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Montants */}
      <div className="mb-6">
        <h3 className="font-bold text-lg mb-3 bg-gray-100 p-2">MONTANTS</h3>
        <table className="w-full text-sm">
          <tbody>
            <tr className="border-b">
              <td className="py-2 font-semibold w-1/3">Tarif journalier :</td>
              <td className="py-2">{assistance.tarif_journalier?.toFixed(2) || '0.00'} DH</td>
            </tr>
            <tr className="border-b">
              <td className="py-2 font-semibold">Montant total :</td>
              <td className="py-2 font-bold text-lg">{(assistance.montant_facture || assistance.montant_total || 0).toFixed(2)} DH</td>
            </tr>
            <tr className="border-b">
              <td className="py-2 font-semibold">Franchise :</td>
              <td className="py-2">{assistance.franchise_montant?.toFixed(2) || '0.00'} DH</td>
            </tr>
            <tr className="border-b">
              <td className="py-2 font-semibold">Statut franchise :</td>
              <td className="py-2">
                {assistance.franchise_statut === 'bloquee' ? 'Bloquée' :
                 assistance.franchise_statut === 'remboursee' ? 'Remboursée' :
                 assistance.franchise_statut === 'utilisee' ? 'Utilisée' : 'N/A'}
              </td>
            </tr>
            {assistance.etat_paiement && assistance.etat_paiement !== 'en_attente' && (
              <>
                <tr className="border-b">
                  <td className="py-2 font-semibold">Montant payé :</td>
                  <td className="py-2">{assistance.montant_paye?.toFixed(2) || '0.00'} DH</td>
                </tr>
                {assistance.date_paiement_assurance && (
                  <tr className="border-b">
                    <td className="py-2 font-semibold">Date paiement :</td>
                    <td className="py-2">{format(new Date(assistance.date_paiement_assurance), 'dd MMMM yyyy', { locale: fr })}</td>
                  </tr>
                )}
              </>
            )}
          </tbody>
        </table>
      </div>

      {/* Remarques */}
      {assistance.remarques && (
        <div className="mb-6">
          <h3 className="font-bold text-lg mb-3 bg-gray-100 p-2">REMARQUES</h3>
          <p className="text-sm p-4 border">{assistance.remarques}</p>
        </div>
      )}

      {/* Footer */}
      {!settings?.masquer_pied_page && (
        <div className="mt-8 text-center text-xs text-gray-500 border-t pt-4">
          <p>
            {settings?.raison_sociale || "Nom de l'entreprise"}
            {settings?.rc && ` - RC: ${settings.rc}`}
            {settings?.if_number && ` - IF: ${settings.if_number}`}
            {settings?.ice && ` - ICE: ${settings.ice}`}
            {settings?.cnss && ` - CNSS: ${settings.cnss}`}
            {settings?.patente && ` - Patente: ${settings.patente}`}
          </p>
          {settings?.adresse && <p>{settings.adresse}</p>}
          <p className="mt-2">Document généré le {format(new Date(), 'dd/MM/yyyy à HH:mm', { locale: fr })}</p>
          <p>Dossier N° {assistance.num_dossier}</p>
        </div>
      )}
    </div>
  );
}