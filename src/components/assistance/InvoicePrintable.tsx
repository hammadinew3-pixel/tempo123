import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface InvoicePrintableProps {
  assistances: any[];
  settings: any;
  isGrouped?: boolean;
}

export default function InvoicePrintable({ assistances, settings, isGrouped = false }: InvoicePrintableProps) {
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
    assistances.forEach(assistance => {
      const montant = assistance.montant_facture || assistance.montant_total || 0;
      totalHT += montant / 1.2;
    });
    const totalTVA = totalHT * 0.2;
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
    <div className="invoice-page">
      <div className="flex-1 px-4 pt-4">

        {/* Header */}
        {!settings?.masquer_entete && (
          <div className="mb-6">
            {!settings?.masquer_logo && settings?.logo_url && (
              <div className="flex justify-center mb-4">
                <img 
                  src={settings.logo_url} 
                  alt="Logo" 
                  className="h-16 w-auto object-contain"
                  crossOrigin="anonymous"
                />
              </div>
            )}
            <div className="flex justify-between items-start mb-6">
              <div>
                <h1 className="text-3xl font-bold mb-2">FACTURE</h1>
                <p className="text-sm text-gray-600">N° {invoiceNumber}</p>
                <p className="text-sm text-gray-600">
                  Date : {format(new Date(), 'dd/MM/yyyy', { locale: fr })}
                </p>
              </div>
            </div>

            <div className="border-t-2 border-gray-300 pt-4">
              <div className="grid grid-cols-2 gap-8">
                <div>
                  <h3 className="font-bold mb-2">FACTURÉ À :</h3>
                  <p className="font-semibold">{assuranceInfo.nom}</p>
                  {assuranceInfo.adresse && (
                    <p className="text-sm">{assuranceInfo.adresse}</p>
                  )}
                  {assuranceInfo.contact_telephone && (
                    <p className="text-sm">Tél : {assuranceInfo.contact_telephone}</p>
                  )}
                  {!isGrouped && firstAssistance.ordre_mission && (
                    <p className="text-sm mt-2"><strong>N° Ordre de mission :</strong> {firstAssistance.ordre_mission}</p>
                  )}
                </div>
                <div>
                  <h3 className="font-bold mb-2">{isGrouped ? 'FACTURE GROUPÉE' : 'CLIENT BÉNÉFICIAIRE'} :</h3>
                  {isGrouped ? (
                    <p className="text-sm">{assistances.length} dossier(s) d'assistance</p>
                  ) : (
                    <>
                      <p className="font-semibold">
                        {firstAssistance.clients?.nom} {firstAssistance.clients?.prenom}
                      </p>
                      {firstAssistance.clients?.cin && (
                        <p className="text-sm">CIN : {firstAssistance.clients.cin}</p>
                      )}
                      {firstAssistance.clients?.telephone && (
                        <p className="text-sm">Tél : {firstAssistance.clients.telephone}</p>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

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
            {assistances.map((assistance, index) => {
              const startDate = new Date(assistance.date_debut);
              const endDate = assistance.date_fin ? new Date(assistance.date_fin) : new Date();
              const duration = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
              const montant = assistance.montant_facture || assistance.montant_total || 0;
              const tarifJournalier = assistance.tarif_journalier || 0;
              const montantHT = montant / 1.2;
              
              return (
                <tr key={index} className="border-b border-gray-200">
                  <td className="py-4 px-2">
                    <p className="font-semibold">
                      {isGrouped ? `Dossier ${assistance.num_dossier}` : `Dossier ${assistance.num_dossier}`}
                    </p>
                    <p className="text-sm text-gray-600">
                      Période : {format(startDate, 'dd/MM/yyyy', { locale: fr })} au {format(endDate, 'dd/MM/yyyy', { locale: fr })}
                    </p>
                    {isGrouped && (
                      <p className="text-sm text-gray-600">
                        Client : {assistance.clients?.nom} {assistance.clients?.prenom}
                      </p>
                    )}
                  </td>
                  <td className="text-center py-4 px-2">{duration}</td>
                  <td className="text-right py-4 px-2">{(tarifJournalier / 1.2).toFixed(2)} DH</td>
                  <td className="text-right py-4 px-2 font-semibold">{montantHT.toFixed(2)} DH</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Totals */}
        <div className="flex justify-end mb-4">
          <div className="w-80">
            <div className="flex justify-between py-2 border-b">
              <span className="font-semibold">Sous-total HT :</span>
              <span>{totalHT.toFixed(2)} DH</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="font-semibold">TVA (20%) :</span>
              <span>{totalTVA.toFixed(2)} DH</span>
            </div>
            <div className="flex justify-between py-3 border-t-2 border-gray-400">
              <span className="font-bold text-lg">TOTAL TTC :</span>
              <span className="font-bold text-lg">{totalTTC.toFixed(2)} DH</span>
            </div>
            <div className="mt-3 pt-3 border-t border-gray-300">
              <p className="text-sm italic">
                Arrêtée la présente facture à la somme de :
              </p>
              <p className="text-sm font-semibold italic mt-1">
                {numberToFrench(totalTTC)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      {!settings?.masquer_pied_page && (
        <div className="mt-auto text-center text-[10pt] text-gray-600 pt-2 border-t border-gray-400 px-4">
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