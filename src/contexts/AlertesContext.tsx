import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { differenceInDays, parseISO } from "date-fns";
import { groupBy, getLatestByGroup } from "@/lib/arrayUtils";
import { useTenant } from "@/contexts/TenantContext";

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
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes cache

  const refreshAlerts = async () => {
    // Cache check - ne recharge pas si déjà chargé récemment
    if (lastRefresh && (Date.now() - lastRefresh.getTime() < CACHE_DURATION)) {
      console.log('[Alerts] Using cached data');
      return;
    }
    try {
      let count = 0;
      
      // Get tenant settings for alert thresholds
      const { data: tenantSettings } = await supabase
        .from("tenant_settings")
        .select("alerte_assurance_jours, alerte_visite_jours, alerte_autorisation_jours, alerte_cheque_jours")
        .single();
      
      const alerteAssuranceJours = tenantSettings?.alerte_assurance_jours || 30;
      const alerteVisiteJours = tenantSettings?.alerte_visite_jours || 30;
      const alerteVignetteJours = tenantSettings?.alerte_autorisation_jours || 30;
      const alerteChequeJours = tenantSettings?.alerte_cheque_jours || 30;

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

      // Execute ALL queries in parallel
      const [
        allInsurances,
        allInspections,
        allVignettes,
        allCartesGrises,
        departsToday,
        returnsToday,
        chequesData,
        allTraites
      ] = await Promise.all([
        supabase.from("vehicle_insurance").select("*").in("vehicle_id", vehicleIds),
        supabase.from("vehicle_technical_inspection").select("*").in("vehicle_id", vehicleIds),
        supabase.from("vehicle_vignette").select("*").in("vehicle_id", vehicleIds),
        supabase.from("vehicle_carte_grise").select("vehicle_id").in("vehicle_id", vehicleIds),
        supabase.from("contracts").select("id").eq("date_debut", today).in("statut", ["contrat_valide", "brouillon"]),
        supabase.from("contracts").select("id").eq("date_fin", today).eq("statut", "livre"),
        supabase.from("cheques").select("id, date_echeance").in("statut", ["en_attente", "encours"]),
        supabase.from("vehicules_traites_echeances").select("vehicle_id, date_echeance").eq("statut", "À payer").in("vehicle_id", vehicleIds)
      ]);

      // Group by vehicle_id and get latest for each
      const latestInsurances = getLatestByGroup(allInsurances.data || [], 'vehicle_id' as any, 'date_expiration' as any);
      const latestInspections = getLatestByGroup(allInspections.data || [], 'vehicle_id' as any, 'date_expiration' as any);
      const latestVignettes = getLatestByGroup(allVignettes.data || [], 'vehicle_id' as any, 'date_expiration' as any);
      
      // Create set of vehicles with carte grise
      const vehiclesWithCarteGrise = new Set(
        (allCartesGrises.data || []).map((cg: any) => cg.vehicle_id)
      );

      // Calculate alerts in memory
      for (const vehicle of vehicles) {
        // Ignorer les véhicules en sous-location
        if (vehicle.type_vehicule === 'sous_location') {
          continue;
        }
        
        const insurance = latestInsurances[vehicle.id];
        const inspection = latestInspections[vehicle.id];
        const vignette = latestVignettes[vehicle.id];

        // Check insurance
        if (!insurance) {
          count++;
        } else if (insurance.date_expiration) {
          const daysUntilExpiry = differenceInDays(parseISO(insurance.date_expiration), new Date());
          if (daysUntilExpiry <= alerteAssuranceJours) count++;
        }

        // Check technical inspection
        if (!inspection) {
          count++;
        } else if (inspection.date_expiration) {
          const daysUntilExpiry = differenceInDays(parseISO(inspection.date_expiration), new Date());
          if (daysUntilExpiry <= alerteVisiteJours) count++;
        }

        // Check vignette
        if (!vignette) {
          count++;
        } else if (vignette.date_expiration) {
          const daysUntilExpiry = differenceInDays(parseISO(vignette.date_expiration), new Date());
          if (daysUntilExpiry <= alerteVignetteJours) count++;
        }

        // Check oil change
        if (vehicle.kilometrage && vehicle.prochain_kilometrage_vidange) {
          const kmUntilOilChange = vehicle.prochain_kilometrage_vidange - vehicle.kilometrage;
          if (kmUntilOilChange <= 1000) count++;
        } else if (!vehicle.dernier_kilometrage_vidange) {
          count++;
        }

        // Check carte grise
        if (!vehiclesWithCarteGrise.has(vehicle.id)) {
          count++;
        }
      }

      // Contract alerts are not included in the header notification count
      // They are displayed separately in the Dashboard reservations widget

      // Check cheques near due date or overdue
      if (chequesData.data) {
        const chequeAlerts = chequesData.data.filter((cheque: any) => {
          const daysUntilDue = differenceInDays(parseISO(cheque.date_echeance), new Date());
          // Count if due within configured days or overdue
          return daysUntilDue <= alerteChequeJours;
        });
        count += chequeAlerts.length;
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
      setLastRefresh(new Date());
      console.log('[Alerts] Data refreshed and cached');
    } catch (error) {
      console.error('Error refreshing alerts:', error);
      setTotalAlerts(0);
    }
  };

  // NE PAS charger automatiquement au démarrage - seulement quand l'utilisateur clique
  // Suppression du useEffect initial pour optimisation des performances

  return (
    <AlertesContext.Provider value={{ totalAlerts, refreshAlerts }}>
      {children}
    </AlertesContext.Provider>
  );
};
