import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { InfoIcon } from "lucide-react";
import { format, addMonths, isBefore, isAfter } from "date-fns";
import { fr } from "date-fns/locale";

interface TraitesHeatmapProps {
  traite: any;
  echeances: any[];
}

const MONTHS = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];

export function TraitesHeatmap({ traite, echeances }: TraitesHeatmapProps) {
  if (!traite?.date_debut || !traite?.duree_mois) {
    return null;
  }

  const startDate = new Date(traite.date_debut);
  const endDate = addMonths(startDate, parseInt(traite.duree_mois));
  
  const startYear = startDate.getFullYear();
  const endYear = endDate.getFullYear();
  const years = Array.from({ length: endYear - startYear + 1 }, (_, i) => startYear + i);

  // Calculate statistics
  const paidEcheances = echeances.filter(e => e.statut === 'Payée');
  const totalPaid = paidEcheances.reduce((sum, e) => sum + parseFloat(e.montant || 0), 0);
  const monthsPaid = paidEcheances.length;
  const monthsRemaining = parseInt(traite.duree_mois) - monthsPaid;
  const montantRestant = parseFloat(traite.montant_total || 0) - totalPaid;
  const montantMensuel = parseFloat(traite.montant_mensuel || 0);
  const lastPaymentDate = endDate;

  const getMonthStatus = (year: number, monthIndex: number) => {
    const monthDate = new Date(year, monthIndex, 1);
    const today = new Date();
    
    // Before start date
    if (isBefore(monthDate, new Date(startDate.getFullYear(), startDate.getMonth(), 1))) {
      return { status: 'inactive', color: 'bg-muted/30', label: 'Avant le début' };
    }
    
    // After end date
    if (isAfter(monthDate, new Date(endDate.getFullYear(), endDate.getMonth(), 1))) {
      return { status: 'inactive', color: 'bg-muted/30', label: 'Après la fin' };
    }
    
    // Find corresponding echeance
    const echeance = echeances.find(e => {
      const echeanceDate = new Date(e.date_echeance);
      return echeanceDate.getFullYear() === year && echeanceDate.getMonth() === monthIndex;
    });
    
    if (!echeance) {
      // Month in range but no echeance yet
      if (isBefore(monthDate, new Date(today.getFullYear(), today.getMonth(), 1))) {
        return { status: 'overdue', color: 'bg-destructive', label: 'Mois non payé' };
      }
      return { status: 'pending', color: 'bg-warning', label: 'Mois restant' };
    }
    
    if (echeance.statut === 'Payée') {
      // Check if paid in advance
      const echeanceDate = new Date(echeance.date_echeance);
      const paymentDate = echeance.date_paiement ? new Date(echeance.date_paiement) : null;
      if (paymentDate && isBefore(paymentDate, echeanceDate)) {
        return { status: 'prepaid', color: 'bg-secondary', label: 'Mois prépayé' };
      }
      return { status: 'paid', color: 'bg-primary', label: 'Mois payé' };
    }
    
    // Not paid
    const echeanceDate = new Date(echeance.date_echeance);
    if (isBefore(echeanceDate, today)) {
      return { status: 'overdue', color: 'bg-destructive', label: 'Mois non payé' };
    }
    
    return { status: 'pending', color: 'bg-warning', label: 'Mois restant' };
  };

  return (
    <div className="space-y-4">
      <Alert>
        <InfoIcon className="h-4 w-4" />
        <AlertDescription>
          Les traites bancaires sont automatiquement ajoutées chaque mois à partir de la date de début jusqu'à la fin de la durée spécifiée.
        </AlertDescription>
      </Alert>

      {/* Grille visuelle des mois */}
      <div className="space-y-3">
        {years.map((year) => (
          <div key={year} className="space-y-1">
            <div className="text-sm font-semibold text-muted-foreground">{year}</div>
            <div className="grid grid-cols-13 gap-1 items-center">
              {MONTHS.map((month, index) => {
                const { color, label } = getMonthStatus(year, index);
                return (
                  <div
                    key={index}
                    className={`h-8 rounded ${color} transition-all hover:opacity-80 cursor-help flex items-center justify-center`}
                    title={`${month} ${year}: ${label}`}
                  >
                    <span className="text-[10px] font-medium text-white opacity-80">{month}</span>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Légende */}
      <div className="flex flex-wrap gap-3 pb-3 border-b">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-primary"></div>
          <span className="text-xs">Mois payé</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-secondary"></div>
          <span className="text-xs">Mois prépayé</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-warning"></div>
          <span className="text-xs">Mois restant</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-destructive"></div>
          <span className="text-xs">Mois non payé</span>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Date du premier traite:</span>
          <strong>{format(startDate, 'dd MMM yyyy', { locale: fr })}</strong>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Date de la dernière traite:</span>
          <strong>{format(lastPaymentDate, 'dd MMM yyyy', { locale: fr })}</strong>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Prix d'achat:</span>
          <strong>{parseFloat(traite.prix_achat || 0).toLocaleString()}</strong>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Avance payé:</span>
          <strong>{parseFloat(traite.avance || 0).toLocaleString()}</strong>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Durée/Mois:</span>
          <strong>{traite.duree_mois}</strong>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Prix/Mois:</span>
          <strong>{montantMensuel.toLocaleString()}</strong>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Mois payés:</span>
          <strong className="text-primary">{monthsPaid}</strong>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Montant payé:</span>
          <strong className="text-primary">{totalPaid.toLocaleString()}</strong>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Mois restants:</span>
          <strong className="text-warning">{monthsRemaining}</strong>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Montant restant:</span>
          <strong className="text-warning">{montantRestant.toLocaleString()}</strong>
        </div>
      </div>
    </div>
  );
}
