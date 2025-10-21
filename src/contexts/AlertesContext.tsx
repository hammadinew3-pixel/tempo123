import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { differenceInDays, parseISO } from "date-fns";
import { groupBy, getLatestByGroup } from "@/lib/arrayUtils";

interface AlertesContextType {
  totalAlerts: number;
  refreshAlerts: () => Promise<void>;
}

const AlertesContext = createContext<AlertesContextType | null>(null);

export const useAlertes = () => {
  const context = useContext(AlertesContext);
  if (!context) {
    throw new Error("useAlertes must be used within AlertesProvider");
  }
  return context;
};

export const AlertesProvider = ({ children }: { children: ReactNode }) => {
  const [totalAlerts, setTotalAlerts] = useState(0);

  const refreshAlerts = async () => {
    try {
      let count = 0;

      // Get all vehicles first
      const { data: vehicles } = await supabase
        .from("vehicles")
        .select("*");

      if (!vehicles || vehicles.length === 0) {
        setTotalAlerts(0);
        return;
      }

      const vehicleIds = vehicles.map(v => v.id);
      const today = new Date().toISOString().split("T")[0];

      // Execute ALL queries in parallel (7 queries instead of 4 per vehicle)
      const [
        allInsurances,
        allInspections,
        allVignettes,
        departsToday,
        returnsToday,
        checkPayments,
        allTraites
      ] = await Promise.all([
        supabase.from("vehicle_insurance").select("*").in("vehicle_id", vehicleIds),
        supabase.from("vehicle_technical_inspection").select("*").in("vehicle_id", vehicleIds),
        supabase.from("vehicle_vignette").select("*").in("vehicle_id", vehicleIds),
        supabase.from("contracts").select("id").eq("date_debut", today).in("statut", ["contrat_valide", "brouillon"]),
        supabase.from("contracts").select("id").eq("date_fin", today).eq("statut", "livre"),
        supabase.from("contract_payments").select("id, date_paiement").eq("methode", "cheque"),
        supabase.from("vehicules_traites_echeances").select("vehicle_id, date_echeance").eq("statut", "À payer").in("vehicle_id", vehicleIds)
      ]);

      // Group by vehicle_id and get latest for each
      const latestInsurances = getLatestByGroup(allInsurances.data || [], 'vehicle_id' as any, 'date_expiration' as any);
      const latestInspections = getLatestByGroup(allInspections.data || [], 'vehicle_id' as any, 'date_expiration' as any);
      const latestVignettes = getLatestByGroup(allVignettes.data || [], 'vehicle_id' as any, 'date_expiration' as any);

      // Calculate alerts in memory
      for (const vehicle of vehicles) {
        const insurance = latestInsurances[vehicle.id];
        const inspection = latestInspections[vehicle.id];
        const vignette = latestVignettes[vehicle.id];

        // Check insurance
        if (!insurance) {
          count++;
        } else if (insurance.date_expiration) {
          const daysUntilExpiry = differenceInDays(parseISO(insurance.date_expiration), new Date());
          if (daysUntilExpiry <= 30) count++;
        }

        // Check technical inspection
        if (!inspection) {
          count++;
        } else if (inspection.date_expiration) {
          const daysUntilExpiry = differenceInDays(parseISO(inspection.date_expiration), new Date());
          if (daysUntilExpiry <= 30) count++;
        }

        // Check vignette
        if (!vignette) {
          count++;
        } else if (vignette.date_expiration) {
          const daysUntilExpiry = differenceInDays(parseISO(vignette.date_expiration), new Date());
          if (daysUntilExpiry <= 30) count++;
        }

        // Check oil change
        if (vehicle.kilometrage && vehicle.prochain_kilometrage_vidange) {
          const kmUntilOilChange = vehicle.prochain_kilometrage_vidange - vehicle.kilometrage;
          if (kmUntilOilChange <= 1000) count++;
        } else if (!vehicle.dernier_kilometrage_vidange) {
          count++;
        }
      }

      // Contract alerts are not included in the header notification count
      // They are displayed separately in the Dashboard reservations widget

      // Check old payments
      if (checkPayments.data) {
        const checkAlerts = checkPayments.data.filter((payment: any) => {
          const daysFromPayment = differenceInDays(new Date(), parseISO(payment.date_paiement));
          return daysFromPayment > 30;
        });
        count += checkAlerts.length;
      }

      // Check traites bancaires
      if (allTraites.data) {
        const traiteAlerts = allTraites.data.filter((traite: any) => {
          const daysUntilEcheance = differenceInDays(parseISO(traite.date_echeance), new Date());
          // Count if overdue or due within 7 days
          return daysUntilEcheance <= 7;
        });
        count += traiteAlerts.length;
      }

      setTotalAlerts(count);
    } catch (error) {
      console.error('Error refreshing alerts:', error);
      setTotalAlerts(0);
    }
  };

  useEffect(() => {
    // Initial load only - no auto-refresh
    refreshAlerts();
  }, []);

  return (
    <AlertesContext.Provider value={{ totalAlerts, refreshAlerts }}>
      {children}
    </AlertesContext.Provider>
  );
};
