import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { differenceInDays, parseISO } from "date-fns";

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
    let count = 0;

    // Count vehicle alerts
    const { data: vehicles } = await supabase
      .from("vehicles")
      .select("*");

    if (vehicles) {
      for (const vehicle of vehicles) {
        // Check insurance
        const { data: insurances } = await supabase
          .from("vehicle_insurance")
          .select("*")
          .eq("vehicle_id", vehicle.id)
          .order("date_expiration", { ascending: false })
          .limit(1);

        if (!insurances || insurances.length === 0) {
          count++;
        } else {
          const daysUntilExpiry = differenceInDays(
            parseISO(insurances[0].date_expiration),
            new Date()
          );
          if (daysUntilExpiry <= 30) {
            count++;
          }
        }

        // Check technical inspection
        const { data: inspections } = await supabase
          .from("vehicle_technical_inspection")
          .select("*")
          .eq("vehicle_id", vehicle.id)
          .order("date_expiration", { ascending: false })
          .limit(1);

        if (!inspections || inspections.length === 0) {
          count++;
        } else {
          const daysUntilExpiry = differenceInDays(
            parseISO(inspections[0].date_expiration),
            new Date()
          );
          if (daysUntilExpiry <= 30) {
            count++;
          }
        }

        // Check vignette
        const { data: vignettes } = await supabase
          .from("vehicle_vignette")
          .select("*")
          .eq("vehicle_id", vehicle.id)
          .order("date_expiration", { ascending: false })
          .limit(1);

        if (!vignettes || vignettes.length === 0) {
          count++;
        } else {
          const daysUntilExpiry = differenceInDays(
            parseISO(vignettes[0].date_expiration),
            new Date()
          );
          if (daysUntilExpiry <= 30) {
            count++;
          }
        }

        // Check oil change alerts
        if (vehicle.kilometrage && vehicle.prochain_kilometrage_vidange) {
          const kmUntilOilChange = vehicle.prochain_kilometrage_vidange - vehicle.kilometrage;
          
          // Alert if within 1000 km or overdue
          if (kmUntilOilChange <= 1000) {
            count++;
          }
        } else if (!vehicle.dernier_kilometrage_vidange) {
          // No oil change recorded
          count++;
        }
      }
    }

    // Count contract alerts (departures and returns today)
    const today = new Date().toISOString().split("T")[0];
    
    const { data: departsToday } = await supabase
      .from("contracts")
      .select("id")
      .eq("date_debut", today)
      .in("statut", ["contrat_valide", "brouillon"]);

    const { data: returnsToday } = await supabase
      .from("contracts")
      .select("id")
      .eq("date_fin", today)
      .eq("statut", "livre");

    count += (departsToday?.length || 0) + (returnsToday?.length || 0);

    // Count check alerts
    const { data: payments } = await supabase
      .from("contract_payments")
      .select("id, date_paiement")
      .eq("methode", "cheque");

    if (payments) {
      const checkAlerts = payments.filter((payment) => {
        const daysFromPayment = differenceInDays(new Date(), parseISO(payment.date_paiement));
        return daysFromPayment > 30;
      });
      count += checkAlerts.length;
    }

    setTotalAlerts(count);
  };

  useEffect(() => {
    refreshAlerts();
    
    // Refresh every 5 minutes
    const interval = setInterval(refreshAlerts, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <AlertesContext.Provider value={{ totalAlerts, refreshAlerts }}>
      {children}
    </AlertesContext.Provider>
  );
};
