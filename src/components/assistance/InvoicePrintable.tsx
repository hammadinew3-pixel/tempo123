import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface InvoicePrintableProps {
  assistances: any[];
  settings: any;
  isGrouped?: boolean;
  tauxTVA?: number;
}

export default function InvoicePrintable({ assistances, settings, isGrouped = false, tauxTVA }: InvoicePrintableProps) {
  const tvaTaux = tauxTVA ?? settings?.taux_tva ?? 20;
  // Convert number to French words
  const numberToFrench = (num: number): string => {
    const units = ['', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf'];
    const teens = ['dix', 'onze', 'douze', 'treize', 'quatorze', 'quinze', 'seize', 'dix-sept', 'dix-huit', 'dix-neuf'];
    const tens = ['', '', 'vingt', 'trente', 'quarante', 'cinquante', 'soixante', 'soixante-dix', 'quatre-vingt', 'quatre-vingt-dix'];
    
    if (num === 0) return 'zéro';
    
    const convertHundreds = (n: number): string => {
      let result = '';
      
      const hundred = Math.floor(n / 100);
      const remainder = n % 100;
      
      if (hundred > 0) {
        result += hundred === 1 ? 'cent' : units[hundred] + ' cent';
        if (remainder === 0 && hundred > 1) result += 's';
        if (remainder > 0) result += ' ';
      }
      
      if (remainder >= 20) {
        const ten = Math.floor(remainder / 10);
        const unit = remainder % 10;
        result += tens[ten];
        if (unit === 1 && ten < 8) {
          result += ' et un';
        } else if (unit > 0) {
          result += ten === 7 || ten === 9 ? '-' : '-';
          if (ten === 7) result += teens[unit];
          else if (ten === 9) result += teens[unit];
          else result += units[unit];
        }
        if (ten === 8 && unit === 0) result += 's';
      } else if (remainder >= 10) {
        result += teens[remainder - 10];
      } else if (remainder > 0) {
        result += units[remainder];
      }
      
      return result;
    };
    
    const intPart = Math.floor(num);
    const decPart = Math.round((num - intPart) * 100);
    
    let words = '';
    let remaining = intPart;
    
    if (remaining >= 1000000) {
      const millions = Math.floor(remaining / 1000000);
      words += (millions === 1 ? 'un million' : convertHundreds(millions) + ' millions') + ' ';
      remaining %= 1000000;
    }
    
    if (remaining >= 1000) {
      const thousands = Math.floor(remaining / 1000);
      words += (thousands === 1 ? 'mille' : convertHundreds(thousands) + ' mille') + ' ';
      remaining %= 1000;
    }
    
    if (remaining > 0) {
      words += convertHundreds(remaining);
    }
    
    words = words.trim() + ' dirhams';
    
    if (decPart > 0) {
      words += ' et ' + convertHundreds(decPart) + ' centimes';
    }
    
    return words;
  };

  const calculateTotals = () => {
    let totalHT = 0;
    const tvaMultiplier = 1 + (tvaTaux / 100);
    assistances.forEach(assistance => {
      const montant = assistance.montant_facture || assistance.montant_total || 0;
      totalHT += montant / tvaMultiplier;
    });
    const totalTVA = totalHT * (tvaTaux / 100);
    const totalTTC = totalHT + totalTVA;
    return { totalHT, totalTVA, totalTTC };
  };

  const { totalHT, totalTVA, totalTTC } = calculateTotals();
  
  const firstAssistance = assistances[0];
  const invoiceNumber = isGrouped 
    ? `FAC-GROUP-${format(new Date(), 'yyyyMMdd-HHmmss')}` 
    : `FAC-${firstAssistance.num_dossier}`;
  
  const assuranceInfo = firstAssistance.assurance || { nom: firstAssistance.assureur_nom };

  return (
      <div className="invoice-page flex flex-col">
        <div className="flex-1">

        {/* Header */}
        {!settings?.masquer_entete && (
          <div className="mb-4">
            {settings?.logo_url && (
              <div className="flex justify-center mb-3">
                {!settings?.masquer_logo ? (
                  <img 
                    src={settings.logo_url} 
                    alt="Logo" 
                    crossOrigin="anonymous"
                    className="w-auto object-contain"
                    style={{ height: '100px' }}
                  />
                ) : (
                  <div className="h-24" />
                )}
              </div>
            )}
            <div className="flex justify-between items-start mb-4">
              <div>
                <h1 className="text-xl font-bold mb-1">FACTURE</h1>
                <p className="text-xs text-gray-600">N° {invoiceNumber}</p>
                <p className="text-xs text-gray-600">
                  Date : {format(new Date(), 'dd/MM/yyyy', { locale: fr })}
                </p>
              </div>
            </div>

            <div className="border-t-2 border-gray-300 pt-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-bold mb-1 text-sm">FACTURÉ À :</h3>
                  <p className="font-semibold text-sm">{assuranceInfo.nom}</p>
                  {assuranceInfo.adresse && (
                    <p className="text-xs">{assuranceInfo.adresse}</p>
                  )}
                  {assuranceInfo.contact_telephone && (
                    <p className="text-xs">Tél : {assuranceInfo.contact_telephone}</p>
                  )}
                  {!isGrouped && firstAssistance.ordre_mission && (
                    <p className="text-xs mt-1"><strong>N° Ordre de mission :</strong> {firstAssistance.ordre_mission}</p>
                  )}
                </div>
                <div>
                  <h3 className="font-bold mb-1 text-sm">{isGrouped ? 'FACTURE GROUPÉE' : 'CLIENT BÉNÉFICIAIRE'} :</h3>
                  {isGrouped ? (
                    <p className="text-xs">{assistances.length} dossier(s) d'assistance</p>
                  ) : (
                    <>
                      <p className="font-semibold text-sm">
                        {firstAssistance.clients?.nom} {firstAssistance.clients?.prenom}
                      </p>
                      {firstAssistance.clients?.cin && (
                        <p className="text-xs">CIN : {firstAssistance.clients.cin}</p>
                      )}
                      {firstAssistance.clients?.telephone && (
                        <p className="text-xs">Tél : {firstAssistance.clients.telephone}</p>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Items table */}
        <table className="w-full mb-4 text-xs">
          <thead>
            <tr className="border-b-2 border-gray-400">
              <th className="text-left py-2 px-1">DÉSIGNATION</th>
              <th className="text-center py-2 px-1 w-12">QTÉ</th>
              <th className="text-right py-2 px-1 w-20">P.U. HT</th>
              <th className="text-right py-2 px-1 w-24">TOTAL HT</th>
            </tr>
          </thead>
          <tbody>
            {assistances.map((assistance, index) => {
              const startDate = new Date(assistance.date_debut);
              const endDate = assistance.date_fin ? new Date(assistance.date_fin) : new Date();
              const duration = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
              const montant = assistance.montant_facture || assistance.montant_total || 0;
              const tarifJournalier = assistance.tarif_journalier || 0;
              const tvaMultiplier = 1 + (tvaTaux / 100);
              const montantHT = montant / tvaMultiplier;
              
              return (
                <tr key={index} className="border-b border-gray-200">
                  <td className="py-2 px-1">
                    <p className="font-semibold text-xs">
                      Dossier {assistance.num_dossier}
                    </p>
                    <p className="text-[10px] text-gray-600">
                      Période : {format(startDate, 'dd/MM/yyyy', { locale: fr })} au {format(endDate, 'dd/MM/yyyy', { locale: fr })}
                    </p>
                    {isGrouped && (
                      <p className="text-[10px] text-gray-600">
                        Client : {assistance.clients?.nom} {assistance.clients?.prenom}
                      </p>
                    )}
                  </td>
                  <td className="text-center py-2 px-1 text-xs">{duration}</td>
                  <td className="text-right py-2 px-1 text-xs">{(tarifJournalier / tvaMultiplier).toFixed(2)} DH</td>
                  <td className="text-right py-2 px-1 font-semibold text-xs">{montantHT.toFixed(2)} DH</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Totals */}
        <div className="flex justify-end mb-2">
          <div className="w-72">
            <div className="flex justify-between py-1.5 border-b text-sm">
              <span className="font-semibold">Sous-total HT :</span>
              <span>{totalHT.toFixed(2)} DH</span>
            </div>
            <div className="flex justify-between py-1.5 border-b text-sm">
              <span className="font-semibold">TVA ({tvaTaux}%) :</span>
              <span>{totalTVA.toFixed(2)} DH</span>
            </div>
            <div className="flex justify-between py-2 border-t-2 border-gray-400 text-sm">
              <span className="font-bold">TOTAL TTC :</span>
              <span className="font-bold">{totalTTC.toFixed(2)} DH</span>
            </div>
            <div className="mt-2 pt-2 border-t border-gray-300">
              <p className="text-xs italic">
                Arrêtée la présente facture à la somme de :
              </p>
              <p className="text-xs font-semibold italic mt-0.5">
                {numberToFrench(totalTTC)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      {!settings?.masquer_pied_page && (
        <div className="text-center text-[9.5pt] text-gray-600 pt-1 border-t border-gray-400 pb-2">
          {settings?.raison_sociale && <><strong>{settings.raison_sociale}</strong></>}
          {settings?.ice && <> | ICE: {settings.ice}</>}
          {settings?.if_number && <> | IF: {settings.if_number}</>}
          {settings?.rc && <> | RC: {settings.rc}</>}
          {settings?.cnss && <> | CNSS: {settings.cnss}</>}
          {settings?.patente && <> | Patente: {settings.patente}</>}
          <br/>
          {settings?.adresse && <>Adresse: {settings.adresse}</>}
          {settings?.telephone && <> | Tél: {settings.telephone}</>}
          {settings?.email && <> | Email: {settings.email}</>}
        </div>
      )}
    </div>
  );
}