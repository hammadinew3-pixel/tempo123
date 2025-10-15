import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import vehicleInspectionDiagram from '@/assets/vehicle-inspection-diagram.png';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export default function ContractTemplate() {
  const [searchParams] = useSearchParams();
  const contractId = searchParams.get('id');
  const downloadMode = searchParams.get('download') === 'true';
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
      if (downloadMode) {
        setTimeout(async () => {
          const element = document.getElementById('contract-content');
          if (!element) return;

          try {
            const canvas = await html2canvas(element, {
              scale: 2,
              useCORS: true,
              allowTaint: true,
              logging: false,
              backgroundColor: '#ffffff'
            });

            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF({
              orientation: 'portrait',
              unit: 'mm',
              format: 'a4'
            });

            const pageWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();
            const imgWidth = pageWidth - 20; // marges de 10mm de chaque côté
            const imgHeight = (canvas.height * imgWidth) / canvas.width;

            let position = 10;
            let heightLeft = imgHeight;

            pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
            heightLeft -= pageHeight - 20; // soustraire la hauteur de page moins les marges

            while (heightLeft > 0) {
              position = -(imgHeight - heightLeft) + 10;
              pdf.addPage();
              pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
              heightLeft -= pageHeight - 20;
            }

            pdf.save(`Contrat_${contract.numero_contrat || contractId}.pdf`);

            setTimeout(() => {
              if (window.parent !== window) {
                window.parent.document.querySelector('iframe')?.remove();
              }
            }, 1000);
          } catch (error) {
            console.error('Erreur génération PDF:', error);
          }
        }, 500);
      } else {
        setTimeout(() => window.print(), 500);
      }
    }
  }, [loading, contract, downloadMode, contractId]);

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
        #contract-content {
          width: 100%;
          max-width: 190mm;
          margin: auto;
          overflow: hidden;
        }
      `}</style>
      
      <div id="contract-content" className="bg-white w-[190mm] mx-auto print:p-0"
           style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}>
        
        {/* Page 1 - Contrat */}
        <div className="min-h-[297mm] flex flex-col p-8">
          {!agenceSettings?.masquer_entete && (
            <div className="mb-6 pb-3 border-b-2 border-black">
              <div className="flex justify-between items-start">
                {!agenceSettings?.masquer_logo && agenceSettings?.logo_url && (
                  <div className="w-1/4">
                    <img 
                      src={agenceSettings.logo_url} 
                      alt="Logo" 
                      className="h-20 w-auto object-contain" 
                      crossOrigin="anonymous"
                    />
                  </div>
                )}
                <div className={`flex-1 text-center ${!agenceSettings?.masquer_logo && agenceSettings?.logo_url ? '' : 'w-full'}`}>
                  <h1 className="text-[16pt] font-bold mb-1">CONTRAT DE LOCATION</h1>
                  <p className="text-[12pt] font-semibold">N° {contract.numero_contrat}</p>
                </div>
                {!agenceSettings?.masquer_logo && agenceSettings?.logo_url && (
                  <div className="w-1/4 text-right text-[9pt] text-gray-600">
                    {format(new Date(), 'dd/MM/yyyy')}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Informations principales */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            {/* Locataire */}
            <div className="border-2 border-black">
              <div className="bg-gray-200 border-b-2 border-black p-2 text-center">
                <strong className="text-[11pt]">LOCATAIRE</strong>
              </div>
              <div className="p-3 space-y-1 text-[9pt]">
                <div><strong>Nom & Prénom:</strong> {client?.nom} {client?.prenom}</div>
                <div><strong>CIN:</strong> {client?.cin}</div>
                <div><strong>Permis:</strong> {client?.permis_conduire}</div>
                <div><strong>Adresse:</strong> {client?.adresse}</div>
                <div><strong>Téléphone:</strong> {client?.telephone}</div>
              </div>
            </div>

            {/* 2ème conducteur */}
            <div className="border-2 border-black">
              <div className="bg-gray-200 border-b-2 border-black p-2 text-center">
                <strong className="text-[11pt]">2ÈME CONDUCTEUR</strong>
              </div>
              <div className="p-3 space-y-1 text-[9pt]">
                <div><strong>Nom & Prénom:</strong> {secondaryDriver?.nom || ''} {secondaryDriver?.prenom || ''}</div>
                <div><strong>CIN:</strong> {secondaryDriver?.cin || ''}</div>
                <div><strong>Permis:</strong> {secondaryDriver?.permis_conduire || ''}</div>
              </div>
            </div>
          </div>

          {/* Véhicule et Location */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            {/* Véhicule */}
            <div className="border-2 border-black">
              <div className="bg-gray-200 border-b-2 border-black p-2 text-center">
                <strong className="text-[11pt]">VÉHICULE</strong>
              </div>
              <div className="p-3 space-y-1 text-[9pt]">
                <div><strong>Marque/Modèle:</strong> {vehicle?.marque} {vehicle?.modele}</div>
                <div><strong>Immatriculation:</strong> {vehicle?.immatriculation}</div>
                <div><strong>Km départ:</strong> {contract.delivery_km || vehicle?.kilometrage}</div>
              </div>
            </div>

            {/* Location */}
            <div className="border-2 border-black">
              <div className="bg-gray-200 border-b-2 border-black p-2 text-center">
                <strong className="text-[11pt]">LOCATION</strong>
              </div>
              <div className="p-3 space-y-1 text-[9pt]">
                <div><strong>Départ:</strong> {contract.date_debut ? format(new Date(contract.date_debut), 'dd/MM/yyyy') : ''}</div>
                <div><strong>Retour:</strong> {contract.date_fin ? format(new Date(contract.date_fin), 'dd/MM/yyyy') : ''}</div>
                <div><strong>Durée:</strong> {contract.duration} jour(s)</div>
                <div><strong>Prix TTC:</strong> {contract.total_amount?.toFixed(2)} DH</div>
                <div><strong>Caution:</strong> {contract.caution_montant?.toFixed(2)} DH</div>
              </div>
            </div>
          </div>

          {/* Prolongations */}
          {contract.prolongations && contract.prolongations.length > 0 && (
            <div className="border-2 border-yellow-500 bg-yellow-50 mb-4">
              <div className="bg-yellow-200 border-b-2 border-yellow-500 p-2 text-center">
                <strong className="text-[10pt]">⚠️ PROLONGATION(S)</strong>
              </div>
              <div className="p-3">
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
                          <strong>Prolongation #{i + 1}:</strong> Du {format(ancienneDate, 'dd/MM/yyyy')} au {format(nouvelleDate, 'dd/MM/yyyy')} - {duree} jour(s) - {montant.toFixed(2)} DH
                          {p.raison && <span className="text-gray-700"> ({p.raison})</span>}
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Changements de véhicule */}
          {vehicleChanges && vehicleChanges.length > 0 && (
            <div className="border-2 border-orange-500 bg-orange-50 mb-4">
              <div className="bg-orange-200 border-b-2 border-orange-500 p-2 text-center">
                <strong className="text-[10pt]">CHANGEMENT(S) DE VÉHICULE</strong>
              </div>
              <div className="p-3">
                {vehicleChanges.map((change: any, idx: number) => (
                  <div key={change.id} className="text-[9pt] mb-1">
                    <strong>#{idx + 1}:</strong> {change.old_vehicle?.immatriculation} → {change.new_vehicle?.immatriculation} - {formatReason(change.reason)}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* État du véhicule */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="border-2 border-black">
              <div className="bg-gray-200 border-b-2 border-black p-2 text-center">
                <strong className="text-[10pt]">ÉTAT DU VÉHICULE</strong>
              </div>
              <div className="p-3 flex items-center justify-center">
                <img src={vehicleInspectionDiagram} alt="Schéma inspection" className="w-full h-auto max-h-32 object-contain" />
              </div>
            </div>

            <div className="border-2 border-black">
              <div className="bg-gray-200 border-b-2 border-black p-2 text-center">
                <strong className="text-[10pt]">OBSERVATIONS</strong>
              </div>
              <div className="p-3 text-[9pt] min-h-32">
                {contract.delivery_notes || contract.notes || ''}
              </div>
            </div>
          </div>

          {/* Note CGV */}
          <div className="text-center text-[9pt] italic my-3">
            * En signant le contrat, le client accepte les conditions générales de location.
          </div>

          {/* Signatures */}
          <div className="mt-auto">
            <div className="grid grid-cols-3 gap-6">
              <div className="text-center">
                <div className="h-16 mb-2 flex items-center justify-center">
                  {agenceSettings?.signature_agence_url && (
                    <img 
                      src={agenceSettings.signature_agence_url} 
                      alt="Signature agence" 
                      className="max-h-16 w-auto object-contain"
                      crossOrigin="anonymous"
                    />
                  )}
                </div>
                <div className="border-t-2 border-black pt-1">
                  <strong className="text-[9pt]">Signature Agence</strong>
                </div>
              </div>
              
              <div className="text-center">
                <div className="h-16 mb-2"></div>
                <div className="border-t-2 border-black pt-1">
                  <strong className="text-[9pt]">Signature Locataire</strong>
                </div>
              </div>
              
              <div className="text-center">
                <div className="h-16 mb-2"></div>
                <div className="border-t-2 border-black pt-1">
                  <strong className="text-[9pt]">Signature 2ème Conducteur</strong>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          {!agenceSettings?.masquer_pied_page && (
            <div className="text-center text-[8pt] text-gray-600 mt-4 pt-3 border-t border-gray-400">
              {agenceSettings?.raison_sociale && <><strong>{agenceSettings.raison_sociale}</strong></>}
              {agenceSettings?.ice && <> | ICE: {agenceSettings.ice}</>}
              {agenceSettings?.rc && <> | RC: {agenceSettings.rc}</>}
              <br/>
              {agenceSettings?.adresse && <>Adresse: {agenceSettings.adresse}</>}
              {agenceSettings?.telephone && <> | Tél: {agenceSettings.telephone}</>}
              {agenceSettings?.email && <> | Email: {agenceSettings.email}</>}
            </div>
          )}
        </div>

        {/* Page 2 - CGV */}
        {agenceSettings?.inclure_cgv && agenceSettings?.cgv_texte && (
          <div className="page-break min-h-[297mm] p-8"
               style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}>
            <div className="text-center mb-6">
              <h2 className="text-[14pt] font-bold uppercase">CONDITIONS GÉNÉRALES DE LOCATION</h2>
            </div>
            <div className="text-[10pt] leading-relaxed whitespace-pre-wrap text-justify">
              {agenceSettings.cgv_texte}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
