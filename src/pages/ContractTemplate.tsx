import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

export default function ContractTemplate() {
  const [searchParams] = useSearchParams();
  const contractId = searchParams.get("id");
  const [contract, setContract] = useState<any>(null);
  const [vehicleChanges, setVehicleChanges] = useState<any[]>([]);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (contractId) {
      loadData();
    }
  }, [contractId]);

  const loadData = async () => {
    const [contractRes, changesRes, driversRes, settingsRes] = await Promise.all([
      supabase.from('contracts').select('*, clients(*), vehicles(*)').eq('id', contractId).single(),
      supabase.from('vehicle_changes').select('*, old_vehicle:old_vehicle_id(*), new_vehicle:new_vehicle_id(*)').eq('contract_id', contractId),
      supabase.from('secondary_drivers').select('*').eq('contract_id', contractId),
      supabase.from('agence_settings').select('*').single()
    ]);

    setContract(contractRes.data);
    setVehicleChanges(changesRes.data || []);
    setDrivers(driversRes.data || []);
    setSettings(settingsRes.data);
    setLoading(false);
  };

  useEffect(() => {
    if (!loading && contract) {
      setTimeout(() => window.print(), 500);
    }
  }, [loading, contract]);

  if (loading || !contract) return <div>Chargement...</div>;

  const formatDate = (date: string) => date ? format(new Date(date), 'dd/MM/yyyy') : '';
  const prolongations = contract.prolongations || [];

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', fontSize: '9pt', padding: '20mm', lineHeight: 1.3 }}>
      <style>{`
        @media print {
          @page { size: A4 portrait; margin: 10mm; }
          body { margin: 0; }
        }
        .section-header {
          background: #e6e6e6;
          border: 1px solid #000;
          padding: 6px 10px;
          font-weight: bold;
          font-size: 10pt;
          margin: 10px 0 8px 0;
        }
        .row { display: flex; gap: 20px; margin-bottom: 8px; }
        .col { flex: 1; }
        .field { margin-bottom: 3px; }
        .field strong { font-weight: 600; }
        .signature-box { border: 1px solid #000; padding: 30px 20px; margin-top: 30px; }
      `}</style>

      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <h1 style={{ fontSize: '14pt', fontWeight: 'bold', margin: '0 0 5px 0' }}>CONTRAT DE LOCATION</h1>
        <div style={{ fontSize: '11pt', fontWeight: 'bold' }}>N° {contract.numero_contrat}</div>
      </div>

      <div className="section-header">CLIENT</div>
      <div className="row">
        <div className="col">
          <div className="field"><strong>Nom:</strong> {contract.clients?.nom}</div>
          <div className="field"><strong>Prénom:</strong> {contract.clients?.prenom}</div>
          <div className="field"><strong>CIN:</strong> {contract.clients?.cin}</div>
          <div className="field"><strong>Téléphone:</strong> {contract.clients?.telephone}</div>
        </div>
        {drivers[0] && (
          <div className="col">
            <div className="field"><strong>2ème Conducteur:</strong> {drivers[0].nom}</div>
            <div className="field"><strong>Prénom:</strong> {drivers[0].prenom}</div>
            <div className="field"><strong>CIN:</strong> {drivers[0].cin}</div>
            <div className="field"><strong>Permis:</strong> {drivers[0].permis_conduire}</div>
          </div>
        )}
      </div>

      <div className="section-header">VEHICULE</div>
      <div className="row">
        <div className="col"><div className="field"><strong>Marque:</strong> {contract.vehicles?.marque}</div></div>
        <div className="col"><div className="field"><strong>Modèle:</strong> {contract.vehicles?.modele}</div></div>
      </div>
      <div className="row">
        <div className="col"><div className="field"><strong>Immatriculation:</strong> {contract.vehicles?.immatriculation}</div></div>
        <div className="col"><div className="field"><strong>Kilométrage départ:</strong> {contract.delivery_km}</div></div>
      </div>

      <div className="section-header">PERIODE DE LOCATION</div>
      <div className="row">
        <div className="col"><div className="field"><strong>Date début:</strong> {formatDate(contract.date_debut)}</div></div>
        <div className="col"><div className="field"><strong>Date fin:</strong> {formatDate(contract.date_fin)}</div></div>
      </div>
      <div className="row">
        <div className="col"><div className="field"><strong>Durée:</strong> {contract.duration} jour(s)</div></div>
        <div className="col"><div className="field"><strong>Tarif journalier:</strong> {contract.daily_rate} DH</div></div>
      </div>

      {prolongations.length > 0 && (
        <>
          <div className="section-header">PROLONGATIONS</div>
          {prolongations.map((p: any, i: number) => (
            <div key={i} className="field">
              Du {formatDate(p.date_debut)} au {formatDate(p.date_fin)} - {p.duree} jour(s) - {p.montant} DH
            </div>
          ))}
        </>
      )}

      {vehicleChanges.length > 0 && (
        <>
          <div className="section-header">CHANGEMENTS DE VEHICULE</div>
          {vehicleChanges.map((c: any, i: number) => (
            <div key={i} className="field">
              {c.old_vehicle?.immatriculation} → {c.new_vehicle?.immatriculation}
            </div>
          ))}
        </>
      )}

      <div className="section-header">REGLEMENT</div>
      <div className="row">
        <div className="col"><div className="field"><strong>Montant total:</strong> {contract.total_amount} DH</div></div>
        <div className="col"><div className="field"><strong>Avance payée:</strong> {contract.advance_payment} DH</div></div>
      </div>
      <div className="row">
        <div className="col"><div className="field"><strong>Reste à payer:</strong> {contract.remaining_amount} DH</div></div>
        <div className="col"><div className="field"><strong>Caution:</strong> {contract.caution_montant} DH</div></div>
      </div>

      <div style={{ display: 'flex', gap: '20px', marginTop: '30px' }}>
        <div className="signature-box" style={{ flex: 1, textAlign: 'center' }}>
          <strong>Signature du locataire</strong>
        </div>
        <div className="signature-box" style={{ flex: 1, textAlign: 'center' }}>
          <strong>Signature de l'agence</strong>
        </div>
      </div>

      {settings?.inclure_cgv && settings?.cgv_texte && (
        <div style={{ pageBreakBefore: 'always', paddingTop: '20mm' }}>
          <h2 style={{ textAlign: 'center', fontSize: '14pt', marginBottom: '20px' }}>CONDITIONS GÉNÉRALES DE VENTE</h2>
          <div style={{ fontSize: '9pt', lineHeight: 1.5, textAlign: 'justify', whiteSpace: 'pre-wrap' }}>
            {settings.cgv_texte}
          </div>
        </div>
      )}
    </div>
  );
}
