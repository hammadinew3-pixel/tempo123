import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { CheckCircle2, AlertCircle } from "lucide-react";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { differenceInDays, parseISO } from "date-fns";

interface VehicleAlert {
  vehicleId: string;
  vehicleName: string;
  message: string;
  severity: "warning" | "critical" | "missing";
  type: "assurance" | "visite_technique" | "vignette" | "vidange" | "traite";
  actionText: string;
}

const Alertes = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [vehicleAlerts, setVehicleAlerts] = useState<VehicleAlert[]>([]);
  const [chequeAlerts, setChequeAlerts] = useState<any[]>([]);
  const [departAlerts, setDepartAlerts] = useState<any[]>([]);
  const [recuperationAlerts, setRecuperationAlerts] = useState<any[]>([]);

  useEffect(() => {
    loadAllAlerts();
  }, []);

  const loadAllAlerts = async () => {
    setLoading(true);
    await Promise.all([
      loadVehicleAlerts(),
      loadChequeAlerts(),
      loadContractAlerts(),
    ]);
    setLoading(false);
  };

  const loadVehicleAlerts = async () => {
    const { data: vehicles } = await supabase
      .from("vehicles")
      .select("id, marque, modele, immatriculation, immatriculation_provisoire, kilometrage, prochain_kilometrage_vidange, dernier_kilometrage_vidange")
      .order("marque");

    if (!vehicles) return;

    const alerts: VehicleAlert[] = [];

    for (const vehicle of vehicles) {
      const vehicleName = `${vehicle.marque} ${vehicle.modele} (${vehicle.immatriculation || vehicle.immatriculation_provisoire})`;

      // Insurance alerts
      const { data: insurances } = await supabase
        .from("vehicle_insurance")
        .select("*")
        .eq("vehicle_id", vehicle.id)
        .order("date_expiration", { ascending: false })
        .limit(1);

      if (!insurances || insurances.length === 0) {
        // No insurance found
        alerts.push({
          vehicleId: vehicle.id,
          vehicleName,
          message: "aucune assurance enregistrée",
          severity: "missing",
          type: "assurance",
          actionText: "AJOUTER ASSURANCE",
        });
      } else {
        const insurance = insurances[0];
        const daysUntilExpiry = differenceInDays(
          parseISO(insurance.date_expiration),
          new Date()
        );

        if (daysUntilExpiry <= 30 && daysUntilExpiry >= 0) {
          alerts.push({
            vehicleId: vehicle.id,
            vehicleName,
            message: `assurance expirant le ${new Date(insurance.date_expiration).toLocaleDateString("fr-FR")}`,
            severity: daysUntilExpiry <= 7 ? "critical" : "warning",
            type: "assurance",
            actionText: "RENOUVELER ASSURANCE",
          });
        } else if (daysUntilExpiry < 0) {
          alerts.push({
            vehicleId: vehicle.id,
            vehicleName,
            message: `assurance expirée depuis le ${new Date(insurance.date_expiration).toLocaleDateString("fr-FR")}`,
            severity: "critical",
            type: "assurance",
            actionText: "RENOUVELER ASSURANCE",
          });
        }
      }

      // Technical inspection alerts
      const { data: inspections } = await supabase
        .from("vehicle_technical_inspection")
        .select("*")
        .eq("vehicle_id", vehicle.id)
        .order("date_expiration", { ascending: false })
        .limit(1);

      if (!inspections || inspections.length === 0) {
        // No inspection found
        alerts.push({
          vehicleId: vehicle.id,
          vehicleName,
          message: "aucune visite technique enregistrée",
          severity: "missing",
          type: "visite_technique",
          actionText: "AJOUTER VISITE TECHNIQUE",
        });
      } else {
        const inspection = inspections[0];
        const daysUntilExpiry = differenceInDays(
          parseISO(inspection.date_expiration),
          new Date()
        );

        if (daysUntilExpiry <= 30 && daysUntilExpiry >= 0) {
          alerts.push({
            vehicleId: vehicle.id,
            vehicleName,
            message: `visite technique expirant le ${new Date(inspection.date_expiration).toLocaleDateString("fr-FR")}`,
            severity: daysUntilExpiry <= 7 ? "critical" : "warning",
            type: "visite_technique",
            actionText: "RENOUVELER",
          });
        } else if (daysUntilExpiry < 0) {
          alerts.push({
            vehicleId: vehicle.id,
            vehicleName,
            message: `visite technique expirée depuis le ${new Date(inspection.date_expiration).toLocaleDateString("fr-FR")}`,
            severity: "critical",
            type: "visite_technique",
            actionText: "RENOUVELER",
          });
        }
      }

      // Vignette alerts
      const { data: vignettes } = await supabase
        .from("vehicle_vignette")
        .select("*")
        .eq("vehicle_id", vehicle.id)
        .order("date_expiration", { ascending: false })
        .limit(1);

      if (!vignettes || vignettes.length === 0) {
        // No vignette found
        alerts.push({
          vehicleId: vehicle.id,
          vehicleName,
          message: "aucune vignette enregistrée",
          severity: "missing",
          type: "vignette",
          actionText: "AJOUTER VIGNETTE",
        });
      } else {
        const vignette = vignettes[0];
        const daysUntilExpiry = differenceInDays(
          parseISO(vignette.date_expiration),
          new Date()
        );

        if (daysUntilExpiry <= 30 && daysUntilExpiry >= 0) {
          alerts.push({
            vehicleId: vehicle.id,
            vehicleName,
            message: `vignette expirant le ${new Date(vignette.date_expiration).toLocaleDateString("fr-FR")}`,
            severity: daysUntilExpiry <= 7 ? "critical" : "warning",
            type: "vignette",
            actionText: "RENOUVELER",
          });
        } else if (daysUntilExpiry < 0) {
          alerts.push({
            vehicleId: vehicle.id,
            vehicleName,
            message: `vignette expirée depuis le ${new Date(vignette.date_expiration).toLocaleDateString("fr-FR")}`,
            severity: "critical",
            type: "vignette",
            actionText: "RENOUVELER",
          });
        }
      }

      // Oil change alerts
      if (vehicle.kilometrage && vehicle.prochain_kilometrage_vidange) {
        const kmUntilOilChange = vehicle.prochain_kilometrage_vidange - vehicle.kilometrage;
        
        if (kmUntilOilChange <= 300) {
          alerts.push({
            vehicleId: vehicle.id,
            vehicleName,
            message: kmUntilOilChange <= 0 
              ? `vidange en retard de ${Math.abs(kmUntilOilChange)} km`
              : `vidange critique - ${kmUntilOilChange} km restants`,
            severity: "critical",
            type: "vidange",
            actionText: "FAIRE VIDANGE",
          });
        } else if (kmUntilOilChange <= 1000) {
          alerts.push({
            vehicleId: vehicle.id,
            vehicleName,
            message: `vidange à faire dans ${kmUntilOilChange} km`,
            severity: "warning",
            type: "vidange",
            actionText: "PLANIFIER VIDANGE",
          });
        }
      } else if (!vehicle.dernier_kilometrage_vidange) {
        alerts.push({
          vehicleId: vehicle.id,
          vehicleName,
          message: "aucune vidange enregistrée",
          severity: "missing",
          type: "vidange",
          actionText: "AJOUTER VIDANGE",
        });
      }

      // Traite bancaire alerts
      const { data: echeances } = await supabase
        .from("vehicules_traites_echeances")
        .select("*")
        .eq("vehicle_id", vehicle.id)
        .eq("statut", "À payer")
        .order("date_echeance", { ascending: true });

      if (echeances && echeances.length > 0) {
        for (const echeance of echeances) {
          const daysUntilEcheance = differenceInDays(
            parseISO(echeance.date_echeance),
            new Date()
          );

          if (daysUntilEcheance < 0) {
            // Échéance en retard
            alerts.push({
              vehicleId: vehicle.id,
              vehicleName,
              message: `traite en retard de ${Math.abs(daysUntilEcheance)} jour(s) - ${echeance.montant ? parseFloat(echeance.montant.toString()).toFixed(2) : '0.00'} DH`,
              severity: "critical",
              type: "traite",
              actionText: "PAYER TRAITE",
            });
          } else if (daysUntilEcheance <= 7) {
            // Échéance dans moins de 7 jours
            alerts.push({
              vehicleId: vehicle.id,
              vehicleName,
              message: `traite à payer dans ${daysUntilEcheance} jour(s) - ${echeance.montant ? parseFloat(echeance.montant.toString()).toFixed(2) : '0.00'} DH`,
              severity: "warning",
              type: "traite",
              actionText: "PAYER TRAITE",
            });
          }
        }
      }
    }

    setVehicleAlerts(alerts);
  };

  const loadChequeAlerts = async () => {
    // Load checks that are near their due dates or overdue
    const { data: payments } = await supabase
      .from("contract_payments")
      .select("*, contracts(numero_contrat, clients(nom, prenom))")
      .eq("methode", "cheque")
      .order("date_paiement", { ascending: true });

    if (payments) {
      const alerts = payments.filter((payment) => {
        const daysFromPayment = differenceInDays(new Date(), parseISO(payment.date_paiement));
        // Alert if check is older than 30 days (might need to be cashed)
        return daysFromPayment > 30;
      });
      setChequeAlerts(alerts);
    }
  };

  const loadContractAlerts = async () => {
    const today = new Date().toISOString().split("T")[0];
    
    // Load contracts starting today
    const { data: departsToday } = await supabase
      .from("contracts")
      .select("*, vehicles(marque, modele, immatriculation), clients(nom, prenom)")
      .eq("date_debut", today)
      .in("statut", ["contrat_valide", "brouillon"]);

    // Load contracts ending today
    const { data: returnsToday } = await supabase
      .from("contracts")
      .select("*, vehicles(marque, modele, immatriculation), clients(nom, prenom)")
      .eq("date_fin", today)
      .eq("statut", "livre");

    setDepartAlerts(departsToday || []);
    setRecuperationAlerts(returnsToday || []);
  };

  const groupAlertsByVehicle = () => {
    const grouped = new Map<string, { vehicleName: string; alerts: VehicleAlert[] }>();
    
    vehicleAlerts.forEach((alert) => {
      if (!grouped.has(alert.vehicleId)) {
        grouped.set(alert.vehicleId, {
          vehicleName: alert.vehicleName,
          alerts: []
        });
      }
      grouped.get(alert.vehicleId)!.alerts.push(alert);
    });
    
    return Array.from(grouped.entries()).map(([vehicleId, data]) => ({
      vehicleId,
      vehicleName: data.vehicleName,
      alerts: data.alerts
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Chargement des alertes...</p>
      </div>
    );
  }

  const groupedVehicles = groupAlertsByVehicle();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Alertes & notifications</h1>
        <Breadcrumb className="mt-2">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/">Tableau de bord</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Alertes</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      {/* Réservations Section */}
      <div className="bg-card rounded-lg border shadow-sm">
        <div className="p-4 border-b bg-gradient-to-r from-card to-secondary/20">
          <h2 className="text-lg font-semibold text-foreground">Réservations</h2>
        </div>
        <Accordion type="multiple" className="w-full">
          <AccordionItem value="departs" className="border-0">
            <AccordionTrigger className="px-4 hover:no-underline hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-3">
                {departAlerts.length === 0 ? (
                  <CheckCircle2 className="w-5 h-5 text-success" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-info" />
                )}
                <span className="font-medium">Les départs prévus ce jour</span>
                <span className="text-sm text-muted-foreground ml-auto">
                  {departAlerts.length === 0
                    ? "Aucun départ trouvé pour aujourd'hui"
                    : `${departAlerts.length} départ(s) prévu(s)`}
                </span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              {departAlerts.length === 0 ? (
                <div className="flex items-center gap-2 p-4 bg-success/10 rounded-lg border border-success/20">
                  <CheckCircle2 className="w-4 h-4 text-success" />
                  <p className="text-sm text-success">Aucun départ prévu aujourd'hui</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {departAlerts.map((contract) => (
                    <div
                      key={contract.id}
                      className="flex items-center justify-between p-4 bg-info/10 rounded-lg border border-info/20 hover:bg-info/20 transition-colors"
                    >
                      <span className="text-sm font-medium">
                        Contrat {contract.numero_contrat} -{" "}
                        {contract.vehicles?.marque} {contract.vehicles?.modele}
                      </span>
                      <Button
                        size="sm"
                        className="bg-info hover:bg-info/90 text-white"
                        onClick={() => navigate(`/locations/${contract.id}`)}
                      >
                        LIVRER
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="recuperations" className="border-0">
            <AccordionTrigger className="px-4 hover:no-underline hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-3">
                {recuperationAlerts.length === 0 ? (
                  <CheckCircle2 className="w-5 h-5 text-success" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-info" />
                )}
                <span className="font-medium">Les récupérations prévues ce jour</span>
                <span className="text-sm text-muted-foreground ml-auto">
                  {recuperationAlerts.length === 0
                    ? "Aucune récupération trouvée pour aujourd'hui"
                    : `${recuperationAlerts.length} récupération(s) prévue(s)`}
                </span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              {recuperationAlerts.length === 0 ? (
                <div className="flex items-center gap-2 p-4 bg-success/10 rounded-lg border border-success/20">
                  <CheckCircle2 className="w-4 h-4 text-success" />
                  <p className="text-sm text-success">Aucune récupération prévue aujourd'hui</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {recuperationAlerts.map((contract) => (
                    <div
                      key={contract.id}
                      className="flex items-center justify-between p-4 bg-info/10 rounded-lg border border-info/20 hover:bg-info/20 transition-colors"
                    >
                      <span className="text-sm font-medium">
                        Contrat {contract.numero_contrat} -{" "}
                        {contract.vehicles?.marque} {contract.vehicles?.modele}
                      </span>
                      <Button
                        size="sm"
                        className="bg-info hover:bg-info/90 text-white"
                        onClick={() => navigate(`/locations/${contract.id}`)}
                      >
                        RÉCUPÉRER
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>

      {/* Véhicules Section */}
      <div className="bg-card rounded-lg border shadow-sm">
        <div className="p-4 border-b bg-gradient-to-r from-card to-secondary/20">
          <h2 className="text-lg font-semibold text-foreground">Véhicules</h2>
        </div>
        <Accordion type="multiple" className="w-full">
          {groupedVehicles.length === 0 ? (
            <div className="p-4">
              <div className="flex items-center gap-2 p-4 bg-success/10 rounded-lg border border-success/20">
                <CheckCircle2 className="w-4 h-4 text-success" />
                <p className="text-sm text-success">Aucune alerte de véhicule</p>
              </div>
            </div>
          ) : (
            groupedVehicles.map((vehicle) => {
              const hasCritical = vehicle.alerts.some(a => a.severity === "critical");
              const hasWarning = vehicle.alerts.some(a => a.severity === "warning");
              const iconColor = hasCritical ? "text-destructive" : hasWarning ? "text-warning" : "text-muted-foreground";
              
              return (
                <AccordionItem key={vehicle.vehicleId} value={vehicle.vehicleId} className="border-0">
                  <AccordionTrigger className="px-4 hover:no-underline hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-3 w-full">
                      <AlertCircle className={`w-5 h-5 ${iconColor}`} />
                      <span className="font-medium flex-1 text-left">{vehicle.vehicleName}</span>
                      <span className="text-sm text-muted-foreground">
                        {vehicle.alerts.length} alerte(s)
                      </span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-4">
                    <div className="space-y-2">
                      {vehicle.alerts.map((alert, index) => (
                        <div
                          key={index}
                          className={`flex items-center justify-between p-4 rounded-lg border transition-colors ${
                            alert.severity === "critical"
                              ? "bg-destructive/10 border-destructive/20 hover:bg-destructive/20"
                              : alert.severity === "warning"
                              ? "bg-warning/10 border-warning/20 hover:bg-warning/20"
                              : "bg-muted/50 border-muted hover:bg-muted"
                          }`}
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-semibold uppercase text-muted-foreground">
                                {alert.type === "assurance" && "Assurance"}
                                {alert.type === "visite_technique" && "Visite technique"}
                                {alert.type === "vignette" && "Vignette"}
                              </span>
                            </div>
                            <p className="text-sm">{alert.message}</p>
                          </div>
                          <Button
                            size="sm"
                            className={`ml-4 ${
                              alert.severity === "critical"
                                ? "bg-destructive hover:bg-destructive/90 text-white"
                                : alert.severity === "warning"
                                ? "bg-warning hover:bg-warning/90 text-white"
                                : "bg-primary hover:bg-primary/90"
                            }`}
                            onClick={() => navigate(`/vehicules/${alert.vehicleId}`)}
                          >
                            {alert.actionText}
                          </Button>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              );
            })
          )}
        </Accordion>
      </div>

      {/* Chèques Section */}
      <div className="bg-card rounded-lg border shadow-sm">
        <div className="p-4 border-b bg-gradient-to-r from-card to-secondary/20">
          <h2 className="text-lg font-semibold text-foreground">Chèques</h2>
        </div>
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="cheques" className="border-0">
            <AccordionTrigger className="px-4 hover:no-underline hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-3">
                {chequeAlerts.length === 0 ? (
                  <CheckCircle2 className="w-5 h-5 text-success" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-warning" />
                )}
                <span className="font-medium">Les alertes chèques</span>
                <span className="text-sm text-muted-foreground ml-auto">
                  {chequeAlerts.length === 0
                    ? "Aucune alerte trouvée"
                    : `${chequeAlerts.length} alerte(s) trouvée(s)`}
                </span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              {chequeAlerts.length === 0 ? (
                <div className="flex items-center gap-2 p-4 bg-success/10 rounded-lg border border-success/20">
                  <CheckCircle2 className="w-4 h-4 text-success" />
                  <p className="text-sm text-success">Aucune alerte de chèque</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {chequeAlerts.map((alert) => (
                    <div
                      key={alert.id}
                      className="flex items-center justify-between p-4 bg-warning/10 rounded-lg border border-warning/20 hover:bg-warning/20 transition-colors"
                    >
                      <span className="text-sm font-medium">
                        Chèque n°{alert.numero_cheque} du contrat{" "}
                        {alert.contracts?.numero_contrat}
                      </span>
                      <Button size="sm" className="bg-warning hover:bg-warning/90 text-white">
                        ENCAISSER
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </div>
  );
};

export default Alertes;
