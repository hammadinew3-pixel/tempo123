import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export default function AssistanceContractTemplate() {
  const [searchParams] = useSearchParams();
  const assistanceId = searchParams.get("id");
  const [assistance, setAssistance] = useState<any>(null);
  const [agenceSettings, setAgenceSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [assistanceId]);

  const loadData = async () => {
    if (!assistanceId) return;

    try {
      const assistanceRes = await supabase
        .from("assistance")
        .select(`
          *,
          clients (nom, prenom, telephone, email, cin, permis_conduire, adresse),
          vehicles (immatriculation, marque, modele, annee, categorie)
        `)
        .eq("id", assistanceId)
        .single();

      if (assistanceRes.error) {
        console.error("Error loading assistance:", assistanceRes.error);
      } else {
        let assistanceData: any = assistanceRes.data;
        
        // Charger les données de l'assurance si assureur_id existe
        if (assistanceData?.assureur_id) {
          const { data: assuranceData } = await supabase
            .from('assurances')
            .select('nom, contact_nom, contact_telephone, contact_email, adresse')
            .eq('id', assistanceData.assureur_id)
            .maybeSingle();
          
          if (assuranceData) {
            assistanceData = {
              ...assistanceData,
              assurance: assuranceData
            };
          }
        }
        
        setAssistance(assistanceData);
      }
      
      const settingsRes = await supabase
        .from('agence_settings')
        .select('*')
        .maybeSingle();
      
      if (!settingsRes.error && settingsRes.data) {
        setAgenceSettings(settingsRes.data);
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
  const duration = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

  return (
    <>
      <style>{`
        @media print {
          @page { 
            size: A4 portrait;
            margin: 15mm;
          }
          body { margin: 0; }
          .page-break { page-break-before: always; }
        }
      `}</style>
      
      <div className="max-w-[210mm] mx-auto p-8 bg-white print:p-0">
      {/* Header */}
      {!agenceSettings?.masquer_entete && (
        <div className="border-b-2 border-black pb-4 mb-6">
          {!agenceSettings?.masquer_logo && agenceSettings?.logo_url && (
            <div className="flex justify-center mb-4">
              <img 
                src={agenceSettings.logo_url} 
                alt="Logo" 
                className="h-16 w-auto object-contain"
              />
            </div>
          )}
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-2">CONTRAT DE LOCATION</h1>
            <h2 className="text-xl font-bold">VÉHICULE DE REMPLACEMENT</h2>
            <p className="text-sm mt-2">N° {assistance.num_dossier}</p>
          </div>
        </div>
      )}

      {/* Parties */}
      <div className="mb-6">
        <h3 className="font-bold text-lg mb-3 border-b border-gray-300 pb-1">ENTRE LES SOUSSIGNÉS</h3>
        
        <div className="mb-4">
          <p className="font-semibold">LE LOUEUR :</p>
          <p className="ml-4">{agenceSettings?.raison_sociale || 'SEACAR LOCATION'}</p>
          {agenceSettings?.adresse && <p className="ml-4 text-sm">Adresse : {agenceSettings.adresse}</p>}
          {agenceSettings?.ice && <p className="ml-4 text-sm">ICE : {agenceSettings.ice}</p>}
        </div>

        <div className="mb-4">
          <p className="font-semibold">D'UNE PART,</p>
        </div>

        <div className="mb-4">
          <p className="font-semibold">LE LOCATAIRE :</p>
          <p className="ml-4">{clientName}</p>
          <p className="ml-4 text-sm">CIN : {assistance.clients?.cin || 'N/A'}</p>
          <p className="ml-4 text-sm">Permis : {assistance.clients?.permis_conduire || 'N/A'}</p>
          <p className="ml-4 text-sm">Téléphone : {assistance.clients?.telephone || 'N/A'}</p>
          <p className="ml-4 text-sm">Adresse : {assistance.clients?.adresse || 'N/A'}</p>
        </div>

        <div>
          <p className="font-semibold">D'AUTRE PART,</p>
        </div>
      </div>

      {/* Assurance */}
      <div className="mb-6">
        <h3 className="font-bold text-lg mb-3 border-b border-gray-300 pb-1">COMPAGNIE D'ASSURANCE</h3>
        <p className="ml-4">Compagnie : {assistance.assurances?.nom || assistance.assureur_nom}</p>
        {assistance.assurances?.contact_nom && (
          <p className="ml-4 text-sm">Contact : {assistance.assurances.contact_nom}</p>
        )}
        {assistance.assurances?.contact_telephone && (
          <p className="ml-4 text-sm">Téléphone : {assistance.assurances.contact_telephone}</p>
        )}
      </div>

      {/* Véhicule */}
      <div className="mb-6">
        <h3 className="font-bold text-lg mb-3 border-b border-gray-300 pb-1">VÉHICULE LOUÉ</h3>
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

      {/* Période de location */}
      <div className="mb-6">
        <h3 className="font-bold text-lg mb-3 border-b border-gray-300 pb-1">PÉRIODE DE LOCATION</h3>
        <table className="w-full text-sm">
          <tbody>
            <tr className="border-b">
              <td className="py-2 font-semibold w-1/3">Date de début :</td>
              <td className="py-2">{format(startDate, 'dd MMMM yyyy', { locale: fr })}</td>
            </tr>
            <tr className="border-b">
              <td className="py-2 font-semibold">Date de fin prévue :</td>
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
        <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded p-4">
          <h3 className="font-bold text-lg mb-3 border-b border-yellow-300 pb-1">⚠️ PROLONGATIONS DE CONTRAT</h3>
          <div className="space-y-3">
            {assistance.prolongations.map((prolongation: any, index: number) => (
              <div key={index} className="bg-white border border-yellow-200 rounded p-3">
                <p className="font-semibold text-sm mb-2">Prolongation #{index + 1}</p>
                <table className="w-full text-sm">
                  <tbody>
                    <tr className="border-b">
                      <td className="py-1 font-semibold w-1/3">Date de prolongation :</td>
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
                        <td className="py-1 font-semibold">Raison :</td>
                        <td className="py-1">{prolongation.raison}</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-600 mt-3 italic">
            Note : Le montant total ci-dessous a été recalculé en fonction des prolongations effectuées.
          </p>
        </div>
      )}

      {/* Conditions financières */}
      <div className="mb-6">
        <h3 className="font-bold text-lg mb-3 border-b border-gray-300 pb-1">CONDITIONS FINANCIÈRES</h3>
        <table className="w-full text-sm">
          <tbody>
            <tr className="border-b">
              <td className="py-2 font-semibold w-1/3">Tarif journalier :</td>
              <td className="py-2">{assistance.tarif_journalier?.toFixed(2) || '0.00'} DH</td>
            </tr>
            <tr className="border-b">
              <td className="py-2 font-semibold">Montant total :</td>
              <td className="py-2 font-bold">{(assistance.montant_facture || assistance.montant_total || 0).toFixed(2)} DH</td>
            </tr>
            <tr className="border-b">
              <td className="py-2 font-semibold">Franchise :</td>
              <td className="py-2">{assistance.franchise_montant?.toFixed(2) || '0.00'} DH</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Conditions générales */}
      <div className="mb-6">
        <h3 className="font-bold text-lg mb-3 border-b border-gray-300 pb-1">CONDITIONS GÉNÉRALES</h3>
        <div className="text-sm space-y-2">
          <p>1. Le locataire s'engage à restituer le véhicule dans l'état dans lequel il l'a reçu.</p>
          <p>2. Le locataire est responsable du véhicule pendant toute la durée de la location.</p>
          <p>3. La franchise sera retenue en cas de dommages au véhicule.</p>
          <p>4. Le paiement sera effectué par l'assurance selon les conditions convenues.</p>
          <p>5. Le locataire s'engage à respecter le code de la route et toutes les réglementations en vigueur.</p>
        </div>
      </div>

      {/* Signatures */}
      <div className="mt-12 grid grid-cols-2 gap-8">
        <div className="text-center">
          <p className="font-semibold mb-16">Le Loueur</p>
          <div className="border-t border-black pt-2">
            <p className="text-sm">Signature et cachet</p>
          </div>
        </div>
        <div className="text-center">
          <p className="font-semibold mb-16">Le Locataire</p>
          <div className="border-t border-black pt-2">
            <p className="text-sm">Signature</p>
          </div>
        </div>
      </div>

      {/* Footer */}
      {!agenceSettings?.masquer_pied_page && (
        <div className="mt-8 text-center text-xs text-gray-500 border-t pt-4">
          <p>Document généré le {format(new Date(), 'dd/MM/yyyy à HH:mm', { locale: fr })}</p>
          <p>Dossier N° {assistance.num_dossier}</p>
          {agenceSettings && (
            <p className="mt-2">
              {agenceSettings.raison_sociale}
              {agenceSettings.ice && <> | ICE: {agenceSettings.ice}</>}
              {agenceSettings.rc && <> | RC: {agenceSettings.rc}</>}
              {agenceSettings.cnss && <> | CNSS: {agenceSettings.cnss}</>}
              {agenceSettings.patente && <> | Patente: {agenceSettings.patente}</>}
              {agenceSettings.if_number && <> | IF: {agenceSettings.if_number}</>}
              {agenceSettings.adresse && <> | {agenceSettings.adresse}</>}
              {agenceSettings.telephone && <> | Tél: {agenceSettings.telephone}</>}
            </p>
          )}
        </div>
      )}
    </div>

      {/* CGV Page - Outside main contract div for proper page break */}
      {agenceSettings?.inclure_cgv && agenceSettings?.cgv_texte && (
        <div className="page-break p-8 font-sans text-[11pt] leading-normal bg-white max-w-[210mm] mx-auto min-h-screen">
          <div className="text-center mb-6 pt-8">
            <h2 className="text-[16pt] font-bold uppercase">CONDITIONS GÉNÉRALES DE VENTE</h2>
          </div>
          <div className="text-[10pt] leading-relaxed whitespace-pre-wrap text-justify">
            {agenceSettings.cgv_texte}
          </div>
        </div>
      )}
    </>
  );
}