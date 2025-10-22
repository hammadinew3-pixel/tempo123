import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface Contract {
  id: string;
  numero_contrat: string;
  date_debut: string;
  date_fin: string;
  tarif_journalier: number;
  caution: number;
  montant_total: number;
  avance: number;
  remaining_amount: number;
  clients: {
    id: string;
    nom: string;
    prenom: string;
    telephone: string;
    cin: string;
    adresse: string;
  };
  vehicles: {
    immatriculation: string;
    marque: string;
    modele: string;
  };
}

interface TenantSettings {
  nom_agence?: string;
  adresse?: string;
  telephone?: string;
  email?: string;
  logo_url?: string;
  tva_taux?: number;
  raison_sociale?: string;
  ice?: string;
  if_number?: string;
  rc?: string;
  cnss?: string;
  patente?: string;
  masquer_entete?: boolean;
  masquer_logo?: boolean;
  masquer_pied_page?: boolean;
}

interface Props {
  contract: Contract;
  settings: TenantSettings | null;
}

function numberToFrench(num: number): string {
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
}

function amountToWords(amount: number): string {
  const integerPart = Math.floor(amount);
  const decimalPart = Math.round((amount - integerPart) * 100);

  let words = numberToFrench(integerPart) + ' dirhams';
  if (decimalPart > 0) {
    words += ' et ' + numberToFrench(decimalPart) + ' centimes';
  }

  return words.charAt(0).toUpperCase() + words.slice(1);
}

function calculateDuration(dateDebut: string, dateFin: string): number {
  const debut = new Date(dateDebut);
  const fin = new Date(dateFin);
  const diffTime = Math.abs(fin.getTime() - debut.getTime());
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

export default function InvoicePrintable({ contract, settings }: Props) {
  const duration = calculateDuration(contract.date_debut, contract.date_fin);
  const tj = Number(contract.tarif_journalier || 0);
  const montantLocation = duration * tj;
  const tvaTaux = settings?.tva_taux || 20;
  const montantHT = montantLocation / 1.2;
  const montantTVA = montantHT * 0.2;
  const montantTTC = montantHT + montantTVA;

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
                <p className="text-sm text-gray-600">N° {contract.numero_contrat}</p>
                <p className="text-sm text-gray-600">
                  Date : {format(new Date(), 'dd/MM/yyyy', { locale: fr })}
                </p>
              </div>
            </div>

            <div className="border-t-2 border-gray-300 pt-4">
              <div className="grid grid-cols-2 gap-8">
                <div>
                  <h3 className="font-bold mb-2">FACTURÉ À :</h3>
                  <p className="font-semibold">{contract.clients.nom} {contract.clients.prenom}</p>
                  {contract.clients.cin && (
                    <p className="text-sm">CIN : {contract.clients.cin}</p>
                  )}
                  {contract.clients.telephone && (
                    <p className="text-sm">Tél : {contract.clients.telephone}</p>
                  )}
                  {contract.clients.adresse && (
                    <p className="text-sm">{contract.clients.adresse}</p>
                  )}
                </div>
                <div>
                  <h3 className="font-bold mb-2">DÉTAILS LOCATION :</h3>
                  <p className="font-semibold">
                    {contract.vehicles.marque} {contract.vehicles.modele}
                  </p>
                  <p className="text-sm">Immatriculation : {contract.vehicles.immatriculation}</p>
                  <p className="text-sm mt-2">
                    Période : {format(new Date(contract.date_debut), 'dd/MM/yyyy', { locale: fr })} 
                    {' au '} 
                    {format(new Date(contract.date_fin), 'dd/MM/yyyy', { locale: fr })}
                  </p>
                  <p className="text-sm">Durée : {duration} jour{duration > 1 ? 's' : ''}</p>
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
            <tr className="border-b border-gray-200">
              <td className="py-4 px-2">
                <p className="font-semibold">Location véhicule</p>
                <p className="text-sm text-gray-600">
                  {contract.vehicles.marque} {contract.vehicles.modele} - {contract.vehicles.immatriculation}
                </p>
                <p className="text-sm text-gray-600">
                  Période : {format(new Date(contract.date_debut), 'dd/MM/yyyy', { locale: fr })} 
                  {' au '} 
                  {format(new Date(contract.date_fin), 'dd/MM/yyyy', { locale: fr })}
                </p>
              </td>
              <td className="text-center py-4 px-2">{duration}</td>
              <td className="text-right py-4 px-2">{(tj / 1.2).toFixed(2)} DH</td>
              <td className="text-right py-4 px-2 font-semibold">{montantHT.toFixed(2)} DH</td>
            </tr>
          </tbody>
        </table>

        {/* Totals */}
        <div className="flex justify-end mb-4">
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
              <span className="font-bold text-lg">{montantTTC.toFixed(2)} DH</span>
            </div>
            {contract.caution > 0 && (
              <div className="flex justify-between py-2 border-t border-gray-300 mt-2">
                <span className="font-semibold">Caution (remboursable) :</span>
                <span className="font-semibold">{contract.caution.toFixed(2)} DH</span>
              </div>
            )}
            {contract.avance > 0 && (
              <div className="flex justify-between py-2 border-b">
                <span className="font-semibold">Avance payée :</span>
                <span>{contract.avance.toFixed(2)} DH</span>
              </div>
            )}
            {contract.remaining_amount > 0 && (
              <div className="flex justify-between py-2 border-b">
                <span className="font-bold text-red-600">Reste à payer :</span>
                <span className="font-bold text-red-600">{contract.remaining_amount.toFixed(2)} DH</span>
              </div>
            )}
            <div className="mt-3 pt-3 border-t border-gray-300">
              <p className="text-sm italic">
                Arrêtée la présente facture à la somme de :
              </p>
              <p className="text-sm font-semibold italic mt-1">
                {amountToWords(montantTTC)}
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
