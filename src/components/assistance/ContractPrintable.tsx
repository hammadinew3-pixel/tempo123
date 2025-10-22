import { format } from "date-fns";
import vehicleInspectionDiagram from '@/assets/vehicle-inspection-diagram.png';

interface ContractPrintableProps {
  assistance: any;
  agenceSettings: any;
}

export default function ContractPrintable({ assistance, agenceSettings }: ContractPrintableProps) {
  const client = assistance.clients;
  const vehicle = assistance.vehicles;
  const hasCgvPage = Boolean(
    agenceSettings?.inclure_cgv &&
    agenceSettings?.cgv_texte &&
    agenceSettings.cgv_texte.trim().length > 0
  );

  return (
    <>
      {/* Page 1 - Contrat */}
      <div className="contract-page flex flex-col p-6"
           style={{ height: '277mm', overflow: 'hidden' }}>
        {!agenceSettings?.masquer_entete && (
          <div className="mb-4 pb-2 border-b-2 border-black">
            <div className="flex justify-between items-start">
              {!agenceSettings?.masquer_logo && agenceSettings?.logo_url && (
                <div className="w-1/4">
                  <img 
                    src={agenceSettings.logo_url} 
                    alt="Logo" 
                    className="h-16 w-auto object-contain" 
                    crossOrigin="anonymous"
                  />
                </div>
              )}
              <div className={`flex-1 text-center ${!agenceSettings?.masquer_logo && agenceSettings?.logo_url ? '' : 'w-full'}`}>
                <h1 className="text-[14pt] font-bold mb-1">CONTRAT DE LOCATION</h1>
                <p className="text-[11pt] font-semibold">N° {assistance.num_dossier}</p>
              </div>
              {!agenceSettings?.masquer_logo && agenceSettings?.logo_url && (
                <div className="w-1/4 text-right text-[8pt] text-gray-600">
                  {format(new Date(), 'dd/MM/yyyy')}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Informations principales */}
        <div className="grid grid-cols-2 gap-3 mb-3">
          {/* Bénéficiaire (Client) */}
          <div className="border-2 border-black">
            <div className="bg-gray-200 border-b-2 border-black p-2 text-center">
              <strong className="text-[11pt]">BÉNÉFICIAIRE</strong>
            </div>
            <div className="p-3 space-y-1 text-[9pt]">
              <div><strong>Nom & Prénom:</strong> {client?.nom} {client?.prenom}</div>
              <div><strong>CIN:</strong> {client?.cin}</div>
              <div><strong>Permis:</strong> {client?.permis_conduire}</div>
              <div><strong>Adresse:</strong> {client?.adresse}</div>
              <div><strong>Téléphone:</strong> {client?.telephone}</div>
            </div>
          </div>

          {/* Assurance */}
          <div className="border-2 border-black">
            <div className="bg-gray-200 border-b-2 border-black p-2 text-center">
              <strong className="text-[11pt]">ASSURANCE</strong>
            </div>
            <div className="p-3 space-y-1 text-[9pt]">
              <div><strong>Compagnie:</strong> {assistance.assurance?.nom || assistance.assureur_nom || ''}</div>
              <div><strong>Ordre de mission:</strong> {assistance.ordre_mission || 'N/A'}</div>
            </div>
          </div>
        </div>

        {/* Véhicule et Location */}
        <div className="grid grid-cols-2 gap-3 mb-3">
          {/* Véhicule */}
          <div className="border-2 border-black">
            <div className="bg-gray-200 border-b-2 border-black p-2 text-center">
              <strong className="text-[11pt]">VÉHICULE</strong>
            </div>
            <div className="p-3 space-y-1 text-[9pt]">
              <div><strong>Marque/Modèle:</strong> {vehicle?.marque} {vehicle?.modele}</div>
              <div><strong>Immatriculation:</strong> {vehicle?.immatriculation}</div>
              <div><strong>Catégorie:</strong> {vehicle?.categorie || vehicle?.categories?.[0] || ''}</div>
              <div><strong>Km départ:</strong> {assistance.kilometrage_depart || vehicle?.kilometrage}</div>
            </div>
          </div>

          {/* Location */}
          <div className="border-2 border-black">
            <div className="bg-gray-200 border-b-2 border-black p-2 text-center">
              <strong className="text-[11pt]">LOCATION</strong>
            </div>
            <div className="p-3 space-y-1 text-[9pt]">
              <div><strong>Départ:</strong> {assistance.date_debut ? format(new Date(assistance.date_debut), 'dd/MM/yyyy') : ''}</div>
              <div><strong>Retour:</strong> {assistance.date_fin ? format(new Date(assistance.date_fin), 'dd/MM/yyyy') : ''}</div>
              <div><strong>Durée:</strong> {Math.floor((new Date(assistance.date_fin || new Date()).getTime() - new Date(assistance.date_debut).getTime()) / (1000 * 60 * 60 * 24))} jour(s)</div>
            </div>
          </div>
        </div>

        {/* Prolongations */}
        {assistance.prolongations && assistance.prolongations.length > 0 && (
          <div className="border-2 border-yellow-500 bg-yellow-50 mb-3">
            <div className="bg-yellow-200 border-b-2 border-yellow-500 p-2 text-center">
              <strong className="text-[10pt]">⚠️ PROLONGATION(S)</strong>
            </div>
            <div className="p-3">
              {assistance.prolongations.map((p: any, i: number) => {
                const ancienneDate = p.ancienne_date_fin ? new Date(p.ancienne_date_fin) : null;
                const nouvelleDate = p.nouvelle_date_fin ? new Date(p.nouvelle_date_fin) : null;
                const duree = ancienneDate && nouvelleDate 
                  ? Math.ceil((nouvelleDate.getTime() - ancienneDate.getTime()) / (1000 * 60 * 60 * 24))
                  : 0;
                
                return (
                  <div key={i} className="text-[9pt] mb-1">
                    {ancienneDate && nouvelleDate && (
                      <>
                        <strong>Prolongation #{i + 1}:</strong> Du {format(ancienneDate, 'dd/MM/yyyy')} au {format(nouvelleDate, 'dd/MM/yyyy')} - {duree} jour(s)
                        {p.raison && <span className="text-gray-700"> ({p.raison})</span>}
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* État du véhicule */}
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div className="border-2 border-black">
            <div className="bg-gray-200 border-b-2 border-black p-2 text-center">
              <strong className="text-[10pt]">ÉTAT DU VÉHICULE</strong>
            </div>
            <div className="p-2 flex items-center justify-center min-h-40">
              <img src={vehicleInspectionDiagram} alt="Schéma inspection" className="w-full h-auto max-h-36 object-contain" />
            </div>
          </div>

          <div className="border-2 border-black">
            <div className="bg-gray-200 border-b-2 border-black p-2 text-center">
              <strong className="text-[10pt]">OBSERVATIONS</strong>
            </div>
            <div className="p-2 text-[9pt] min-h-40">
              {assistance.etat_vehicule_depart || assistance.remarques || ''}
            </div>
          </div>
        </div>

        {/* Note CGV */}
        <div className="text-center text-[8pt] italic my-2">
          * En signant le contrat, le client accepte les conditions générales de location.
        </div>

        {/* Signatures */}
        <div className="mt-auto mb-3">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="h-12 mb-1 flex items-center justify-center overflow-visible">
                {agenceSettings?.signature_agence_url && (
                  <img 
                    src={agenceSettings.signature_agence_url} 
                    alt="Signature agence" 
                    style={{ height: '14.4px', width: 'auto', transform: 'scale(1.2)', transformOrigin: 'center' }}
                    crossOrigin="anonymous"
                  />
                )}
              </div>
              <div className="border-t-2 border-black pt-1">
                <strong className="text-[9pt]">Signature Agence</strong>
              </div>
            </div>
            
            <div className="text-center">
              <div className="h-12 mb-1"></div>
              <div className="border-t-2 border-black pt-1">
                <strong className="text-[9pt]">Signature Locataire</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        {!agenceSettings?.masquer_pied_page && (
          <div className="text-center text-[10pt] text-gray-600 mt-1 pt-2 border-t border-gray-400">
            {agenceSettings?.raison_sociale && <><strong>{agenceSettings.raison_sociale}</strong></>}
            {agenceSettings?.ice && <> | ICE: {agenceSettings.ice}</>}
            {agenceSettings?.if_number && <> | IF: {agenceSettings.if_number}</>}
            {agenceSettings?.rc && <> | RC: {agenceSettings.rc}</>}
            {agenceSettings?.cnss && <> | CNSS: {agenceSettings.cnss}</>}
            {agenceSettings?.patente && <> | Patente: {agenceSettings.patente}</>}
            <br/>
            {agenceSettings?.adresse && <>Adresse: {agenceSettings.adresse}</>}
            {agenceSettings?.telephone && <> | Tél: {agenceSettings.telephone}</>}
            {agenceSettings?.email && <> | Email: {agenceSettings.email}</>}
          </div>
        )}
      </div>

      {/* Page 2 - CGV */}
      {hasCgvPage && (
        <div className="page-break-before cgv-page p-4"
             style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}>
          <div className="text-center mb-3">
            <h2 className="text-[13pt] font-bold uppercase">CONDITIONS GÉNÉRALES DE LOCATION</h2>
          </div>
          <div className="whitespace-pre-wrap text-justify"
               style={{ fontSize: '9.5pt', lineHeight: '1.4' }}>
            {agenceSettings.cgv_texte}
          </div>
        </div>
      )}
    </>
  );
}