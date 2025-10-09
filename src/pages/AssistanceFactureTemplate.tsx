import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export default function AssistanceFactureTemplate() {
  const [searchParams] = useSearchParams();
  const assistanceId = searchParams.get("id");
  const [assistance, setAssistance] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [assistanceId]);

  const loadData = async () => {
    if (!assistanceId) return;

    const { data, error } = await supabase
      .from("assistance")
      .select(`
        *,
        clients (nom, prenom, telephone, email, cin, adresse),
        vehicles (immatriculation, marque, modele),
        assurances (nom, adresse, contact_telephone)
      `)
      .eq("id", assistanceId)
      .single();

    if (error) {
      console.error("Error loading assistance:", error);
    } else {
      setAssistance(data);
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
  const montantTotal = assistance.montant_facture || assistance.montant_total || 0;
  const tarifJournalier = assistance.tarif_journalier || 0;
  const montantHT = montantTotal / 1.2; // Assuming 20% TVA
  const montantTVA = montantTotal - montantHT;

  // Generate invoice number based on dossier number
  const invoiceNumber = `FAC-${assistance.num_dossier}`;

  return (
    <div className="max-w-4xl mx-auto p-8 bg-white print:p-0">
      <style>{`
        @media print {
          body { margin: 0; padding: 20px; }
          @page { size: A4; margin: 15mm; }
        }
      `}</style>

      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">FACTURE</h1>
            <p className="text-sm text-gray-600">N° {invoiceNumber}</p>
            <p className="text-sm text-gray-600">
              Date : {format(new Date(), 'dd/MM/yyyy', { locale: fr })}
            </p>
          </div>
          <div className="text-right">
            <p className="font-bold text-lg">SEACAR LOCATION</p>
            <p className="text-sm">Adresse de l'entreprise</p>
            <p className="text-sm">Code postal Ville</p>
            <p className="text-sm">Téléphone : +212 XXX XXX XXX</p>
            <p className="text-sm">Email : contact@seacar.com</p>
          </div>
        </div>

        <div className="border-t-2 border-gray-300 pt-4">
          <div className="grid grid-cols-2 gap-8">
            <div>
              <h3 className="font-bold mb-2">FACTURÉ À :</h3>
              <p className="font-semibold">{assistance.assurances?.nom || assistance.assureur_nom}</p>
              {assistance.assurances?.adresse && (
                <p className="text-sm">{assistance.assurances.adresse}</p>
              )}
              {assistance.assurances?.contact_telephone && (
                <p className="text-sm">Tél : {assistance.assurances.contact_telephone}</p>
              )}
            </div>
            <div>
              <h3 className="font-bold mb-2">CLIENT BÉNÉFICIAIRE :</h3>
              <p className="font-semibold">{clientName}</p>
              {assistance.clients?.cin && (
                <p className="text-sm">CIN : {assistance.clients.cin}</p>
              )}
              {assistance.clients?.telephone && (
                <p className="text-sm">Tél : {assistance.clients.telephone}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Dossier information */}
      <div className="mb-6 bg-gray-50 p-4 rounded">
        <p className="text-sm"><span className="font-semibold">Dossier N° :</span> {assistance.num_dossier}</p>
        <p className="text-sm"><span className="font-semibold">Véhicule :</span> {vehicleName} - {assistance.vehicles?.immatriculation}</p>
        <p className="text-sm"><span className="font-semibold">Période :</span> Du {format(startDate, 'dd/MM/yyyy', { locale: fr })} au {format(endDate, 'dd/MM/yyyy', { locale: fr })}</p>
      </div>

      {/* Items table */}
      <table className="w-full mb-6">
        <thead>
          <tr className="border-b-2 border-gray-400">
            <th className="text-left py-3 px-2">DÉSIGNATION</th>
            <th className="text-center py-3 px-2">QTÉ</th>
            <th className="text-right py-3 px-2">PRIX UNIT. HT</th>
            <th className="text-right py-3 px-2">TOTAL HT</th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-b border-gray-200">
            <td className="py-4 px-2">
              <p className="font-semibold">Location véhicule de remplacement</p>
              <p className="text-sm text-gray-600">{vehicleName} - {assistance.vehicles?.immatriculation}</p>
              <p className="text-sm text-gray-600">
                Période : {format(startDate, 'dd/MM/yyyy', { locale: fr })} au {format(endDate, 'dd/MM/yyyy', { locale: fr })}
              </p>
            </td>
            <td className="text-center py-4 px-2">{duration}</td>
            <td className="text-right py-4 px-2">{(tarifJournalier / 1.2).toFixed(2)} DH</td>
            <td className="text-right py-4 px-2 font-semibold">{montantHT.toFixed(2)} DH</td>
          </tr>
          {assistance.franchise_montant > 0 && assistance.franchise_statut === 'utilisee' && (
            <tr className="border-b border-gray-200">
              <td className="py-4 px-2">
                <p className="font-semibold">Franchise</p>
                <p className="text-sm text-gray-600">Utilisée</p>
              </td>
              <td className="text-center py-4 px-2">1</td>
              <td className="text-right py-4 px-2">{(assistance.franchise_montant / 1.2).toFixed(2)} DH</td>
              <td className="text-right py-4 px-2 font-semibold">{(assistance.franchise_montant / 1.2).toFixed(2)} DH</td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Totals */}
      <div className="flex justify-end mb-8">
        <div className="w-80">
          <div className="flex justify-between py-2 border-b">
            <span className="font-semibold">Sous-total HT :</span>
            <span>{montantHT.toFixed(2)} DH</span>
          </div>
          <div className="flex justify-between py-2 border-b">
            <span className="font-semibold">TVA (20%) :</span>
            <span>{montantTVA.toFixed(2)} DH</span>
          </div>
          <div className="flex justify-between py-3 border-t-2 border-gray-400">
            <span className="font-bold text-lg">TOTAL TTC :</span>
            <span className="font-bold text-lg">{montantTotal.toFixed(2)} DH</span>
          </div>
        </div>
      </div>

      {/* Payment info */}
      <div className="mb-8 bg-gray-50 p-4 rounded">
        <h3 className="font-bold mb-2">INFORMATIONS DE PAIEMENT</h3>
        {assistance.etat_paiement === 'paye' && assistance.date_paiement_assurance ? (
          <p className="text-sm text-green-600 font-semibold">
            ✓ Facture réglée le {format(new Date(assistance.date_paiement_assurance), 'dd/MM/yyyy', { locale: fr })}
          </p>
        ) : assistance.etat_paiement === 'partiellement_paye' ? (
          <>
            <p className="text-sm text-orange-600 font-semibold">
              Partiellement payé : {assistance.montant_paye?.toFixed(2)} DH / {montantTotal.toFixed(2)} DH
            </p>
            <p className="text-sm text-gray-600">
              Reste à payer : {(montantTotal - (assistance.montant_paye || 0)).toFixed(2)} DH
            </p>
          </>
        ) : (
          <p className="text-sm text-red-600 font-semibold">
            ⏳ En attente de paiement
          </p>
        )}
      </div>

      {/* Notes */}
      <div className="mb-8 text-sm text-gray-600">
        <h3 className="font-bold mb-2">CONDITIONS :</h3>
        <p>Paiement par l'assurance selon les conditions convenues.</p>
        <p>TVA non applicable, article 293 B du CGI.</p>
      </div>

      {/* Footer */}
      <div className="border-t-2 border-gray-300 pt-4 text-center text-xs text-gray-500">
        <p>SEACAR LOCATION - RC N° XXXXX - IF N° XXXXX - ICE N° XXXXX</p>
        <p>Siège social : Adresse complète de l'entreprise</p>
        <p className="mt-2">Document généré le {format(new Date(), 'dd/MM/yyyy à HH:mm', { locale: fr })}</p>
      </div>
    </div>
  );
}