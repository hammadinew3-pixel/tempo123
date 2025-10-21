import { Alert, AlertDescription } from "@/components/ui/alert";
import { InfoIcon } from "lucide-react";
import { format, addMonths, isBefore, isAfter } from "date-fns";
import { fr } from "date-fns/locale";

interface TraitesHeatmapProps {
  traite: any;
  echeances: any[];
  onPayEcheance?: (echeance: any) => void;
}

const MONTHS = ['Janv.', 'Fev.', 'Mars', 'Avr.', 'Mai', 'Juin', 'Juil.', 'Aout', 'Sept.', 'Oct.', 'Nov.', 'Dec.'];

export function TraitesHeatmap({ traite, echeances, onPayEcheance }: TraitesHeatmapProps) {
  if (!traite?.date_debut || !traite?.nombre_traites) {
    return null;
  }

  const startDate = new Date(traite.date_debut);
  const endDate = addMonths(startDate, parseInt(traite.nombre_traites));
  
  const startYear = startDate.getFullYear();
  const endYear = endDate.getFullYear();
  const years = Array.from({ length: endYear - startYear + 1 }, (_, i) => startYear + i);

  // Calculate statistics
  const paidEcheances = echeances.filter(e => e.statut === 'Payée');
  const totalPaid = paidEcheances.reduce((sum, e) => sum + parseFloat(e.montant || 0), 0);
  const monthsPaid = paidEcheances.length;
  const monthsRemaining = parseInt(traite.nombre_traites) - monthsPaid;
  const montantRestant = parseFloat(traite.montant_total || 0) - parseFloat(traite.avance_paye || 0) - totalPaid;
  const montantMensuel = parseFloat(traite.montant_mensuel || 0);
  const lastPaymentDate = endDate;

  const getMonthStatus = (year: number, monthIndex: number) => {
    const monthDate = new Date(year, monthIndex, 1);
    const today = new Date();
    
    // Before start date
    if (isBefore(monthDate, new Date(startDate.getFullYear(), startDate.getMonth(), 1))) {
      return { status: 'inactive', color: 'bg-transparent', label: 'Avant le début', echeance: null };
    }
    
    // After end date
    if (isAfter(monthDate, new Date(endDate.getFullYear(), endDate.getMonth(), 1))) {
      return { status: 'inactive', color: 'bg-transparent', label: 'Après la fin', echeance: null };
    }
    
    // Find corresponding echeance
    const echeance = echeances.find(e => {
      const echeanceDate = new Date(e.date_echeance);
      return echeanceDate.getFullYear() === year && echeanceDate.getMonth() === monthIndex;
    });
    
    if (!echeance) {
      // Month in range but no echeance yet
      if (isBefore(monthDate, new Date(today.getFullYear(), today.getMonth(), 1))) {
        return { status: 'overdue', color: 'bg-red-500', label: 'Mois non payé', echeance: null };
      }
      return { status: 'pending', color: 'bg-yellow-400', label: 'Mois restant', echeance: null };
    }
    
    if (echeance.statut === 'Payée') {
      // Check if paid in advance
      const echeanceDate = new Date(echeance.date_echeance);
      const paymentDate = echeance.date_paiement ? new Date(echeance.date_paiement) : null;
      if (paymentDate && isBefore(paymentDate, echeanceDate)) {
        return { status: 'prepaid', color: 'bg-gray-200', label: 'Mois prépayé', echeance };
      }
      return { status: 'paid', color: 'bg-green-500', label: 'Mois payé', echeance };
    }
    
    // Not paid
    const echeanceDate = new Date(echeance.date_echeance);
    if (isBefore(echeanceDate, today)) {
      return { status: 'overdue', color: 'bg-red-500', label: 'Mois non payé', echeance };
    }
    
    return { status: 'pending', color: 'bg-yellow-400', label: 'Mois restant', echeance };
  };

  return (
    <div className="space-y-4">
      <Alert>
        <InfoIcon className="h-4 w-4" />
        <AlertDescription>
          Les traites bancaires sont automatiquement ajoutées chaque mois à partir de la date de début jusqu'à la fin de la durée spécifiée.
        </AlertDescription>
      </Alert>

      {/* Calendrier annuel des échéances */}
      <div className="overflow-x-auto">
        <div className="min-w-max">
          {/* En-tête des mois */}
          <div className="grid grid-cols-[60px_repeat(12,50px)] gap-1 mb-1">
            <div></div>
            {MONTHS.map((month, idx) => (
              <div key={idx} className="text-center text-xs text-muted-foreground font-medium">
                {month}
              </div>
            ))}
          </div>

          {/* Lignes par année */}
          {years.map((year) => (
            <div key={year} className="grid grid-cols-[60px_repeat(12,50px)] gap-1 mb-1">
              <div className="text-sm font-medium flex items-center">{year}</div>
              {Array.from({ length: 12 }, (_, monthIdx) => {
                const { color, label, echeance } = getMonthStatus(year, monthIdx);
                return (
                  <div
                    key={monthIdx}
                    className={`h-10 rounded cursor-pointer transition-opacity hover:opacity-80 ${color}`}
                    title={`${MONTHS[monthIdx]} ${year}: ${label}`}
                    onClick={() => {
                      if (echeance && echeance.statut !== 'Payée' && onPayEcheance) {
                        onPayEcheance(echeance);
                      }
                    }}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Légende */}
      <div className="flex items-center justify-center gap-4 text-xs pt-2">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-green-500" />
          <span>Mois payé</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-gray-200" />
          <span>Mois prépayé</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-yellow-400" />
          <span>Mois restant</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-red-500" />
          <span>Mois non payé</span>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-2 gap-4 pt-4 border-t">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Date du premier traite</span>
            <span className="font-medium">
              {format(new Date(traite.date_debut), 'dd MMM yyyy', { locale: fr })}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Prix d'achat</span>
            <span className="font-medium">{parseFloat(traite.montant_total || 0).toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Durée/Mois</span>
            <span className="font-medium">{traite.nombre_traites}</span>
          </div>
          <div className="flex justify-between text-sm p-2 bg-green-50 rounded">
            <span className="font-semibold">Avance payé</span>
            <span className="font-bold">{parseFloat(traite.avance_paye || 0).toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm p-2 bg-green-50 rounded">
            <span className="font-semibold">Mois payés</span>
            <span className="font-bold">{monthsPaid}</span>
          </div>
          <div className="flex justify-between text-sm p-2 bg-green-50 rounded">
            <span className="font-semibold">Montant payé</span>
            <span className="font-bold">{totalPaid.toFixed(2)}</span>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Date de la dernière traite</span>
            <span className="font-medium">
              {format(lastPaymentDate, 'dd MMM yyyy', { locale: fr })}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Prix/Mois</span>
            <span className="font-medium">{parseFloat(traite.montant_mensuel || 0).toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Mois restants</span>
            <span className="font-medium">{monthsRemaining}</span>
          </div>
          <div className="flex justify-between text-sm p-2 bg-red-50 rounded">
            <span className="font-semibold">Montant restant</span>
            <span className="font-bold">{montantRestant.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
