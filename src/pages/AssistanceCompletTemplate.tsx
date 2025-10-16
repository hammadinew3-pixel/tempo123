import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function AssistanceCompletTemplate() {
  const [searchParams] = useSearchParams();
  const id = searchParams.get('id');
  const [data, setData] = useState<any>(null);
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      if (!id) return;

      try {
        const assistanceRes = await supabase
          .from('assistance')
          .select(`
            *,
            clients (nom, prenom, telephone, email, cin, permis_conduire, adresse, cin_url, permis_url),
            vehicles (marque, modele, immatriculation, categorie)
          `)
          .eq('id', id)
          .single();

        if (assistanceRes.error) throw assistanceRes.error;

        let assistanceData: any = assistanceRes.data;
        
        // Charger l'assurance si assureur_id existe
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

        const settingsRes = await supabase.from('agence_settings').select('*').maybeSingle();
        if (settingsRes.error) throw settingsRes.error;

        setData(assistanceData);
        setSettings(settingsRes.data);
      } catch (error) {
        console.error('Erreur:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [id]);

  useEffect(() => {
    const downloadMode = searchParams.get('download') === 'true';
    if (!loading && data && !downloadMode) {
      setTimeout(() => window.print(), 500);
    }
  }, [loading, data, searchParams]);

  if (loading || !data) {
    return <div className="p-8">Chargement...</div>;
  }

  const clientName = `${data.clients?.nom || ''} ${data.clients?.prenom || ''}`.trim();
  const vehicleName = `${data.vehicles?.marque || ''} ${data.vehicles?.modele || ''}`.trim();
  const duration = data.date_fin && data.date_debut
    ? Math.ceil((new Date(data.date_fin).getTime() - new Date(data.date_debut).getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  return (
    <div className="p-8 bg-white text-black max-w-[210mm] mx-auto">
      <style>{`
        @media print {
          @page { 
            size: A4;
            margin: 15mm;
          }
          body { margin: 0; }
          .page-break { page-break-before: always; }
          .no-print { display: none; }
        }
      `}</style>

      {/* PAGE 1: ORDRE DE MISSION */}
      {data.ordre_mission_url && (
        <div className="mb-8">
          <h2 className="text-center text-2xl font-bold mb-6">ORDRE DE MISSION</h2>
          <div className="flex justify-center">
            <img 
              src={data.ordre_mission_url} 
              alt="Ordre de mission" 
              className="max-w-full h-auto"
              style={{ maxHeight: '90vh' }}
            />
          </div>
        </div>
      )}

      {/* PAGE 2: CONTRAT DE LOCATION */}
      <div className={data.ordre_mission_url ? "page-break" : "mb-8"}>
        <div className="text-center mb-6">
          {settings?.logo_url && !settings?.masquer_logo && (
            <img src={settings.logo_url} alt="Logo" className="h-20 mx-auto mb-4" />
          )}
          {!settings?.masquer_entete && (
            <div className="space-y-1 text-sm">
              <h1 className="text-xl font-bold">{settings?.raison_sociale || ''}</h1>
              <p>{settings?.adresse || ''}</p>
              <p>Tél: {settings?.telephone || ''} | Email: {settings?.email || ''}</p>
              <p>ICE: {settings?.ice || ''} | IF: {settings?.if_number || ''}</p>
            </div>
          )}
        </div>

        <h2 className="text-center text-2xl font-bold mb-6 uppercase">Contrat de Location - Assistance</h2>
        
        <div className="grid grid-cols-2 gap-6 mb-6 text-sm">
          <div className="border p-4 rounded">
            <h3 className="font-bold mb-2 text-base">Informations Client</h3>
            <p><strong>Nom:</strong> {clientName}</p>
            <p><strong>Téléphone:</strong> {data.clients?.telephone || ''}</p>
            <p><strong>Email:</strong> {data.clients?.email || ''}</p>
            <p><strong>CIN:</strong> {data.clients?.cin || ''}</p>
            <p><strong>Permis:</strong> {data.clients?.permis_conduire || ''}</p>
            <p><strong>Adresse:</strong> {data.clients?.adresse || ''}</p>
          </div>
          
          <div className="border p-4 rounded">
            <h3 className="font-bold mb-2 text-base">Informations Véhicule</h3>
            <p><strong>Véhicule:</strong> {vehicleName}</p>
            <p><strong>Immatriculation:</strong> {data.vehicles?.immatriculation || ''}</p>
            <p><strong>Catégorie:</strong> {data.vehicles?.categorie || ''}</p>
          </div>
        </div>

        <div className="border p-4 rounded mb-6 text-sm">
          <h3 className="font-bold mb-2 text-base">Détails du Dossier</h3>
          <div className="grid grid-cols-2 gap-4">
            <p><strong>N° Dossier:</strong> {data.num_dossier}</p>
            <p><strong>Assurance:</strong> {data.assureur_nom}</p>
            <p><strong>Date début:</strong> {format(new Date(data.date_debut), 'dd/MM/yyyy', { locale: fr })}</p>
            <p><strong>Date fin:</strong> {data.date_fin ? format(new Date(data.date_fin), 'dd/MM/yyyy', { locale: fr }) : 'N/A'}</p>
            <p><strong>Durée:</strong> {duration} jour(s)</p>
            <p><strong>Tarif journalier:</strong> {data.tarif_journalier?.toFixed(2) || '0.00'} DH</p>
            <p><strong>Montant total:</strong> {data.montant_total?.toFixed(2) || '0.00'} DH</p>
            <p><strong>Franchise:</strong> {data.franchise_montant?.toFixed(2) || '0.00'} DH</p>
          </div>
        </div>

        <div className="mt-12 grid grid-cols-2 gap-8 text-sm">
          <div className="text-center">
            <p className="mb-16">Signature du client</p>
            <div className="border-t border-black pt-2">Date et signature</div>
          </div>
          <div className="text-center">
            <p className="mb-16">Signature de l'agence</p>
            <div className="border-t border-black pt-2">Date et cachet</div>
          </div>
        </div>
      </div>

      {/* PAGE 3: CIN DU CLIENT */}
      {data.clients?.cin_url && (
        <div className="page-break">
          <h2 className="text-center text-2xl font-bold mb-6">COPIE CIN DU CLIENT</h2>
          <div className="mb-4">
            <p className="mb-2"><strong>Client:</strong> {clientName}</p>
            <p className="mb-4"><strong>N° CIN:</strong> {data.clients?.cin || ''}</p>
          </div>
          <div className="flex justify-center">
            <img 
              src={data.clients.cin_url} 
              alt="CIN du client" 
              className="max-w-full h-auto"
              style={{ maxHeight: '85vh' }}
            />
          </div>
        </div>
      )}

      {/* PAGE 4: PERMIS DU CLIENT */}
      {data.clients?.permis_url && (
        <div className="page-break">
          <h2 className="text-center text-2xl font-bold mb-6">COPIE PERMIS DU CLIENT</h2>
          <div className="mb-4">
            <p className="mb-2"><strong>Client:</strong> {clientName}</p>
            <p className="mb-4"><strong>N° Permis:</strong> {data.clients?.permis_conduire || ''}</p>
          </div>
          <div className="flex justify-center">
            <img 
              src={data.clients.permis_url} 
              alt="Permis de conduire du client" 
              className="max-w-full h-auto"
              style={{ maxHeight: '85vh' }}
            />
          </div>
        </div>
      )}

      {/* PAGE 5: FACTURE */}
      <div className="page-break">
        <div className="text-center mb-6">
          {settings?.logo_url && !settings?.masquer_logo && (
            <img src={settings.logo_url} alt="Logo" className="h-20 mx-auto mb-4" />
          )}
          <h2 className="text-2xl font-bold">FACTURE</h2>
          <p className="text-sm">Dossier N° {data.num_dossier}</p>
        </div>

        <div className="grid grid-cols-2 gap-6 mb-6 text-sm">
          <div>
            <h3 className="font-bold mb-2">De:</h3>
            <p>{settings?.raison_sociale || ''}</p>
            <p>{settings?.adresse || ''}</p>
            <p>ICE: {settings?.ice || ''}</p>
            <p>Tél: {settings?.telephone || ''}</p>
          </div>
          <div>
            <h3 className="font-bold mb-2">À:</h3>
            <p>{data.assureur_nom}</p>
            {data.assurances?.adresse && <p>{data.assurances.adresse}</p>}
            {data.assurances?.contact_telephone && <p>Tél: {data.assurances.contact_telephone}</p>}
          </div>
        </div>

        <table className="w-full border-collapse mb-6 text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 p-2 text-left">Description</th>
              <th className="border border-gray-300 p-2 text-center">Qté</th>
              <th className="border border-gray-300 p-2 text-right">Prix Unit. (DH)</th>
              <th className="border border-gray-300 p-2 text-right">Total (DH)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border border-gray-300 p-2">
                Location véhicule de remplacement<br/>
                <span className="text-xs text-gray-600">
                  {vehicleName} - {data.vehicles?.immatriculation}<br/>
                  Du {format(new Date(data.date_debut), 'dd/MM/yyyy', { locale: fr })} 
                  {data.date_fin && ` au ${format(new Date(data.date_fin), 'dd/MM/yyyy', { locale: fr })}`}
                </span>
              </td>
              <td className="border border-gray-300 p-2 text-center">{duration}</td>
              <td className="border border-gray-300 p-2 text-right">{data.tarif_journalier?.toFixed(2) || '0.00'}</td>
              <td className="border border-gray-300 p-2 text-right font-bold">{data.montant_total?.toFixed(2) || '0.00'}</td>
            </tr>
          </tbody>
        </table>

        <div className="flex justify-end mb-8">
          <div className="w-64 text-sm">
            <div className="flex justify-between py-2 border-b">
              <span>Sous-total HT:</span>
              <span>{((data.montant_total || 0) / 1.2).toFixed(2)} DH</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span>TVA (20%):</span>
              <span>{((data.montant_total || 0) - (data.montant_total || 0) / 1.2).toFixed(2)} DH</span>
            </div>
            <div className="flex justify-between py-2 font-bold text-base">
              <span>Total TTC:</span>
              <span>{data.montant_total?.toFixed(2) || '0.00'} DH</span>
            </div>
          </div>
        </div>

        {!settings?.masquer_pied_page && (
          <div className="text-center text-xs text-gray-600 mt-8 pt-4 border-t">
            <p>{settings?.raison_sociale} - ICE: {settings?.ice} - IF: {settings?.if_number}</p>
            <p>{settings?.adresse} - Tél: {settings?.telephone}</p>
          </div>
        )}
      </div>
    </div>
  );
}
