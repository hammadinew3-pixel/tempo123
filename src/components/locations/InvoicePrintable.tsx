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
  if (num < 0) return 'moins ' + numberToFrench(Math.abs(num));

  let result = '';

  // Millions
  if (num >= 1000000) {
    const millions = Math.floor(num / 1000000);
    result += (millions === 1 ? 'un million ' : numberToFrench(millions) + ' millions ');
    num %= 1000000;
  }

  // Milliers
  if (num >= 1000) {
    const thousands = Math.floor(num / 1000);
    result += (thousands === 1 ? 'mille ' : numberToFrench(thousands) + ' mille ');
    num %= 1000;
  }

  // Centaines
  if (num >= 100) {
    const hundreds = Math.floor(num / 100);
    result += (hundreds === 1 ? 'cent ' : units[hundreds] + ' cent ');
    num %= 100;
    if (num === 0) result = result.trim() + 's ';
  }

  // Dizaines et unités
  if (num >= 20) {
    const tensDigit = Math.floor(num / 10);
    const unitsDigit = num % 10;
    result += tens[tensDigit];
    if (unitsDigit === 1 && tensDigit !== 8) {
      result += ' et ' + units[unitsDigit];
    } else if (unitsDigit > 0) {
      result += '-' + units[unitsDigit];
    }
    if (tensDigit === 8 && unitsDigit === 0) result += 's';
  } else if (num >= 10) {
    result += teens[num - 10];
  } else if (num > 0) {
    result += units[num];
  }

  return result.trim();
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
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

export default function InvoicePrintable({ contract, settings }: Props) {
  const duration = calculateDuration(contract.date_debut, contract.date_fin);
  const tj = Number(contract.tarif_journalier || 0);
  const montantLocation = duration * tj;
  const tvaTaux = settings?.tva_taux || 0;
  const montantHT = montantLocation;
  const montantTVA = montantHT * (tvaTaux / 100);
  const montantTTC = montantHT + montantTVA;

  return (
    <div className="bg-white p-8 max-w-4xl mx-auto" style={{ fontFamily: 'Arial, sans-serif' }}>
      {/* En-tête */}
      <div className="flex justify-between items-start mb-8 pb-4 border-b-2 border-gray-300">
        <div>
          {settings?.logo_url && (
            <img 
              src={settings.logo_url} 
              alt="Logo" 
              className="h-16 mb-2"
            />
          )}
          <h1 className="text-2xl font-bold text-gray-800">{settings?.nom_agence || 'Agence de Location'}</h1>
          <p className="text-sm text-gray-600">{settings?.adresse}</p>
          <p className="text-sm text-gray-600">Tél: {settings?.telephone}</p>
          <p className="text-sm text-gray-600">Email: {settings?.email}</p>
        </div>
        <div className="text-right">
          <h2 className="text-3xl font-bold text-gray-800 mb-2">FACTURE</h2>
          <p className="text-sm"><span className="font-semibold">N°:</span> {contract.numero_contrat}</p>
          <p className="text-sm"><span className="font-semibold">Date:</span> {format(new Date(), 'dd/MM/yyyy', { locale: fr })}</p>
        </div>
      </div>

      {/* Informations client */}
      <div className="mb-6">
        <h3 className="text-lg font-bold text-gray-800 mb-2">Client</h3>
        <div className="bg-gray-50 p-4 rounded">
          <p className="font-semibold">{contract.clients.nom} {contract.clients.prenom}</p>
          <p className="text-sm text-gray-600">CIN: {contract.clients.cin}</p>
          <p className="text-sm text-gray-600">Adresse: {contract.clients.adresse || 'Non spécifiée'}</p>
          <p className="text-sm text-gray-600">Tél: {contract.clients.telephone}</p>
        </div>
      </div>

      {/* Informations véhicule */}
      <div className="mb-6">
        <h3 className="text-lg font-bold text-gray-800 mb-2">Véhicule Loué</h3>
        <div className="bg-gray-50 p-4 rounded">
          <p className="font-semibold">{contract.vehicles.marque} {contract.vehicles.modele}</p>
          <p className="text-sm text-gray-600">Immatriculation: {contract.vehicles.immatriculation}</p>
        </div>
      </div>

      {/* Période de location */}
      <div className="mb-6">
        <h3 className="text-lg font-bold text-gray-800 mb-2">Période de Location</h3>
        <div className="bg-gray-50 p-4 rounded">
          <p className="text-sm">
            <span className="font-semibold">Du:</span> {format(new Date(contract.date_debut), 'dd/MM/yyyy', { locale: fr })}
            {' '}
            <span className="font-semibold">au:</span> {format(new Date(contract.date_fin), 'dd/MM/yyyy', { locale: fr })}
          </p>
          <p className="text-sm font-semibold mt-1">Durée totale: {duration} jour{duration > 1 ? 's' : ''}</p>
        </div>
      </div>

      {/* Détails de facturation */}
      <table className="w-full mb-6 border-collapse">
        <thead>
          <tr className="bg-gray-800 text-white">
            <th className="p-3 text-left">Description</th>
            <th className="p-3 text-center">Quantité</th>
            <th className="p-3 text-right">Prix Unitaire</th>
            <th className="p-3 text-right">Montant</th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-b border-gray-300">
            <td className="p-3">Location véhicule</td>
            <td className="p-3 text-center">{duration} jour{duration > 1 ? 's' : ''}</td>
            <td className="p-3 text-right">{tj.toFixed(2)} DH</td>
            <td className="p-3 text-right font-semibold">{montantLocation.toFixed(2)} DH</td>
          </tr>
          {contract.caution > 0 && (
            <tr className="border-b border-gray-300 bg-blue-50">
              <td className="p-3" colSpan={3}>Caution (remboursable)</td>
              <td className="p-3 text-right font-semibold">{contract.caution.toFixed(2)} DH</td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Totaux */}
      <div className="flex justify-end mb-6">
        <div className="w-1/2">
          <div className="flex justify-between py-2 border-b border-gray-300">
            <span className="font-semibold">Montant HT:</span>
            <span>{montantHT.toFixed(2)} DH</span>
          </div>
          {tvaTaux > 0 && (
            <div className="flex justify-between py-2 border-b border-gray-300">
              <span className="font-semibold">TVA ({tvaTaux}%):</span>
              <span>{montantTVA.toFixed(2)} DH</span>
            </div>
          )}
          <div className="flex justify-between py-2 border-b-2 border-gray-800">
            <span className="font-bold text-lg">Total TTC:</span>
            <span className="font-bold text-lg">{montantTTC.toFixed(2)} DH</span>
          </div>
          {contract.caution > 0 && (
            <div className="flex justify-between py-2 border-b border-gray-300 bg-blue-50 px-2">
              <span className="font-semibold">Caution:</span>
              <span className="font-semibold">+ {contract.caution.toFixed(2)} DH</span>
            </div>
          )}
          <div className="flex justify-between py-2 border-b-2 border-gray-800 bg-gray-100 px-2">
            <span className="font-bold text-lg">Total à payer:</span>
            <span className="font-bold text-lg">{(montantTTC + (contract.caution || 0)).toFixed(2)} DH</span>
          </div>
          {contract.avance > 0 && (
            <div className="flex justify-between py-2 border-b border-gray-300">
              <span className="font-semibold">Avance payée:</span>
              <span>{contract.avance.toFixed(2)} DH</span>
            </div>
          )}
          {contract.remaining_amount > 0 && (
            <div className="flex justify-between py-2 bg-yellow-50 px-2">
              <span className="font-bold text-red-600">Reste à payer:</span>
              <span className="font-bold text-red-600">{contract.remaining_amount.toFixed(2)} DH</span>
            </div>
          )}
        </div>
      </div>

      {/* Montant en lettres */}
      <div className="mb-6 p-4 bg-gray-50 rounded">
        <p className="text-sm">
          <span className="font-semibold">Arrêté la présente facture à la somme de: </span>
          <span className="italic">{amountToWords(montantTTC + (contract.caution || 0))}</span>
        </p>
      </div>

      {/* Pied de page */}
      <div className="text-center text-xs text-gray-600 mt-8 pt-4 border-t border-gray-300">
        <p className="font-semibold">{settings?.nom_agence}</p>
        <p>{settings?.adresse}</p>
        <p>Tél: {settings?.telephone} | Email: {settings?.email}</p>
        <p className="mt-2 italic">Merci de votre confiance</p>
      </div>
    </div>
  );
}
