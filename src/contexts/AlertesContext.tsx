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

    try {
      const today = new Date().toISOString().split("T")[0];

      // Fetch all data in parallel
      const [vehiclesResult, insurancesResult, inspectionsResult, vignettesResult, departsResult, returnsResult, paymentsResult] = await Promise.all([
        supabase.from("vehicles").select("*"),
        supabase.from("vehicle_insurance").select("vehicle_id, date_expiration").order("date_expiration", { ascending: false }),
        supabase.from("vehicle_technical_inspection").select("vehicle_id, date_expiration").order("date_expiration", { ascending: false }),
        supabase.from("vehicle_vignette").select("vehicle_id, date_expiration").order("date_expiration", { ascending: false }),
        supabase.from("contracts").select("id").eq("date_debut", today).in("statut", ["contrat_valide", "brouillon"]),
        supabase.from("contracts").select("id").eq("date_fin", today).eq("statut", "livre"),
        supabase.from("contract_payments").select("id, date_paiement").eq("methode", "cheque")
      ]);

      const vehicles = vehiclesResult.data || [];
      
      // Group data by vehicle_id for fast lookup
      const insurancesByVehicle = new Map();
      const inspectionsByVehicle = new Map();
      const vignettesByVehicle = new Map();

      insurancesResult.data?.forEach(item => {
        if (!insurancesByVehicle.has(item.vehicle_id)) {
          insurancesByVehicle.set(item.vehicle_id, []);
        }
        insurancesByVehicle.get(item.vehicle_id).push(item);
      });

      inspectionsResult.data?.forEach(item => {
        if (!inspectionsByVehicle.has(item.vehicle_id)) {
          inspectionsByVehicle.set(item.vehicle_id, []);
        }
        inspectionsByVehicle.get(item.vehicle_id).push(item);
      });

      vignettesResult.data?.forEach(item => {
        if (!vignettesByVehicle.has(item.vehicle_id)) {
          vignettesByVehicle.set(item.vehicle_id, []);
        }
        vignettesByVehicle.get(item.vehicle_id).push(item);
      });

      // Process each vehicle
      for (const vehicle of vehicles) {
        const insurances = insurancesByVehicle.get(vehicle.id) || [];
        const inspections = inspectionsByVehicle.get(vehicle.id) || [];
        const vignettes = vignettesByVehicle.get(vehicle.id) || [];

        // Check insurance
        if (insurances.length === 0) {
          count++;
        } else {
          const daysUntilExpiry = differenceInDays(parseISO(insurances[0].date_expiration), new Date());
          if (daysUntilExpiry <= 30) {
            count++;
          }
        }

        // Check technical inspection
        if (inspections.length === 0) {
          count++;
        } else {
          const daysUntilExpiry = differenceInDays(parseISO(inspections[0].date_expiration), new Date());
          if (daysUntilExpiry <= 30) {
            count++;
          }
        }

        // Check vignette
        if (vignettes.length === 0) {
          count++;
        } else {
          const daysUntilExpiry = differenceInDays(parseISO(vignettes[0].date_expiration), new Date());
          if (daysUntilExpiry <= 30) {
            count++;
          }
        }

        // Check oil change alerts
        if (vehicle.kilometrage && vehicle.prochain_kilometrage_vidange) {
          const kmUntilOilChange = vehicle.prochain_kilometrage_vidange - vehicle.kilometrage;
          if (kmUntilOilChange <= 1000) {
            count++;
          }
        } else if (!vehicle.dernier_kilometrage_vidange) {
          count++;
        }
      }

      // Count contract alerts
      count += (departsResult.data?.length || 0) + (returnsResult.data?.length || 0);

      // Count check alerts
      const payments = paymentsResult.data || [];
      const checkAlerts = payments.filter((payment) => {
        const daysFromPayment = differenceInDays(new Date(), parseISO(payment.date_paiement));
        return daysFromPayment > 30;
      });
      count += checkAlerts.length;

      setTotalAlerts(count);
    } catch (error) {
      console.error("Error refreshing alerts:", error);
      setTotalAlerts(0);
    }
  };

  useEffect(() => {
    // Only refresh on initial mount, no automatic refresh
    refreshAlerts();
  }, []);

  return (
    <AlertesContext.Provider value={{ totalAlerts, refreshAlerts }}>
      {children}
    </AlertesContext.Provider>
  );
};
