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
  severity: "warning" | "critical";
  type: "assurance" | "visite_technique" | "vignette" | "vidange";
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
      .select("*")
      .order("marque");

    if (!vehicles) return;

    const alerts: VehicleAlert[] = [];

    for (const vehicle of vehicles) {
      const vehicleName = `${vehicle.marque} ${vehicle.modele} (${vehicle.immatriculation})`;

      // Insurance alerts
      const { data: insurances } = await supabase
        .from("vehicle_insurance")
        .select("*")
        .eq("vehicle_id", vehicle.id)
        .order("date_expiration", { ascending: false })
        .limit(1);

      if (insurances && insurances.length > 0) {
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
          });
        } else if (daysUntilExpiry < 0) {
          alerts.push({
            vehicleId: vehicle.id,
            vehicleName,
            message: `assurance expirée depuis le ${new Date(insurance.date_expiration).toLocaleDateString("fr-FR")}`,
            severity: "critical",
            type: "assurance",
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

      if (inspections && inspections.length > 0) {
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
          });
        } else if (daysUntilExpiry < 0) {
          alerts.push({
            vehicleId: vehicle.id,
            vehicleName,
            message: `visite technique expirée depuis le ${new Date(inspection.date_expiration).toLocaleDateString("fr-FR")}`,
            severity: "critical",
            type: "visite_technique",
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

      if (vignettes && vignettes.length > 0) {
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
          });
        } else if (daysUntilExpiry < 0) {
          alerts.push({
            vehicleId: vehicle.id,
            vehicleName,
            message: `vignette expirée depuis le ${new Date(vignette.date_expiration).toLocaleDateString("fr-FR")}`,
            severity: "critical",
            type: "vignette",
          });
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

  const groupAlertsByType = (type: "assurance" | "visite_technique" | "vignette" | "vidange") => {
    return vehicleAlerts.filter((alert) => alert.type === type);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Chargement des alertes...</p>
      </div>
    );
  }

  const assuranceAlerts = groupAlertsByType("assurance");
  const visiteTechniqueAlerts = groupAlertsByType("visite_technique");
  const vignetteAlerts = groupAlertsByType("vignette");

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

      {/* Chèques Section */}
      <div className="bg-card rounded-lg border">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold">Chèques</h2>
        </div>
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="cheques" className="border-0">
            <AccordionTrigger className="px-4 hover:no-underline">
              <div className="flex items-center gap-2">
                {chequeAlerts.length === 0 ? (
                  <CheckCircle2 className="w-5 h-5 text-success" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-warning" />
                )}
                <span className="font-medium">Les alertes chèques</span>
                <span className="text-sm text-muted-foreground">
                  {chequeAlerts.length === 0
                    ? "Aucune alerte trouvée"
                    : `${chequeAlerts.length} alerte(s) trouvée(s)`}
                </span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              {chequeAlerts.length === 0 ? (
                <p className="text-sm text-muted-foreground">Aucune alerte</p>
              ) : (
                <div className="space-y-2">
                  {chequeAlerts.map((alert) => (
                    <div
                      key={alert.id}
                      className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                    >
                      <span className="text-sm">
                        Chèque n°{alert.numero_cheque} du contrat{" "}
                        {alert.contracts?.numero_contrat}
                      </span>
                      <Button size="sm" variant="outline">
                        AGIR
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>

      {/* Réservations Section */}
      <div className="bg-card rounded-lg border">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold">Réservations</h2>
        </div>
        <Accordion type="multiple" className="w-full">
          <AccordionItem value="departs" className="border-0">
            <AccordionTrigger className="px-4 hover:no-underline">
              <div className="flex items-center gap-2">
                {departAlerts.length === 0 ? (
                  <CheckCircle2 className="w-5 h-5 text-success" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-warning" />
                )}
                <span className="font-medium">Les départ prévu ce jour</span>
                <span className="text-sm text-muted-foreground">
                  {departAlerts.length === 0
                    ? "Aucun départ trouvé pour aujourd'hui"
                    : `${departAlerts.length} départ(s) prévu(s)`}
                </span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              {departAlerts.length === 0 ? (
                <p className="text-sm text-muted-foreground">Aucun départ aujourd'hui</p>
              ) : (
                <div className="space-y-2">
                  {departAlerts.map((contract) => (
                    <div
                      key={contract.id}
                      className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                    >
                      <span className="text-sm">
                        Contrat {contract.numero_contrat} -{" "}
                        {contract.vehicles?.marque} {contract.vehicles?.modele}
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => navigate(`/locations/${contract.id}`)}
                      >
                        AGIR
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="recuperations" className="border-0">
            <AccordionTrigger className="px-4 hover:no-underline">
              <div className="flex items-center gap-2">
                {recuperationAlerts.length === 0 ? (
                  <CheckCircle2 className="w-5 h-5 text-success" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-warning" />
                )}
                <span className="font-medium">Les récupérations prévu ce jour</span>
                <span className="text-sm text-muted-foreground">
                  {recuperationAlerts.length === 0
                    ? "Aucune récupération trouvée pour aujourd'hui"
                    : `${recuperationAlerts.length} récupération(s) prévue(s)`}
                </span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              {recuperationAlerts.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Aucune récupération aujourd'hui
                </p>
              ) : (
                <div className="space-y-2">
                  {recuperationAlerts.map((contract) => (
                    <div
                      key={contract.id}
                      className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                    >
                      <span className="text-sm">
                        Contrat {contract.numero_contrat} -{" "}
                        {contract.vehicles?.marque} {contract.vehicles?.modele}
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => navigate(`/locations/${contract.id}`)}
                      >
                        AGIR
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
      <div className="bg-card rounded-lg border">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold">Véhicules</h2>
        </div>
        <Accordion type="multiple" className="w-full">
          <AccordionItem value="assurances" className="border-0">
            <AccordionTrigger className="px-4 hover:no-underline">
              <div className="flex items-center gap-2">
                {assuranceAlerts.length === 0 ? (
                  <CheckCircle2 className="w-5 h-5 text-success" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-warning" />
                )}
                <span className="font-medium">Les alertes assurances</span>
                <span className="text-sm text-muted-foreground">
                  {assuranceAlerts.length === 0
                    ? "Aucune alertes trouvée"
                    : `${assuranceAlerts.length} alerte(s) trouvée(s)`}
                </span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              {assuranceAlerts.length === 0 ? (
                <p className="text-sm text-muted-foreground">Aucune alerte</p>
              ) : (
                <div className="space-y-2">
                  {assuranceAlerts.map((alert, index) => (
                    <div
                      key={index}
                      className={`flex items-center justify-between p-3 rounded-lg ${
                        alert.severity === "critical"
                          ? "bg-destructive/10"
                          : "bg-warning/10"
                      }`}
                    >
                      <span className="text-sm">
                        Véhicule{" "}
                        <button
                          onClick={() => navigate(`/vehicules/${alert.vehicleId}`)}
                          className="text-primary hover:underline font-medium"
                        >
                          {alert.vehicleName}
                        </button>{" "}
                        {alert.message}
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => navigate(`/vehicules/${alert.vehicleId}`)}
                      >
                        AGIR
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="visites" className="border-0">
            <AccordionTrigger className="px-4 hover:no-underline">
              <div className="flex items-center gap-2">
                {visiteTechniqueAlerts.length === 0 ? (
                  <CheckCircle2 className="w-5 h-5 text-success" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-warning" />
                )}
                <span className="font-medium">Les alertes visites techniques</span>
                <span className="text-sm text-muted-foreground">
                  {visiteTechniqueAlerts.length === 0
                    ? "Aucune alertes trouvée"
                    : `${visiteTechniqueAlerts.length} alerte(s) trouvée(s)`}
                </span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              {visiteTechniqueAlerts.length === 0 ? (
                <p className="text-sm text-muted-foreground">Aucune alerte</p>
              ) : (
                <div className="space-y-2">
                  {visiteTechniqueAlerts.map((alert, index) => (
                    <div
                      key={index}
                      className={`flex items-center justify-between p-3 rounded-lg ${
                        alert.severity === "critical"
                          ? "bg-destructive/10"
                          : "bg-warning/10"
                      }`}
                    >
                      <span className="text-sm">
                        Véhicule{" "}
                        <button
                          onClick={() => navigate(`/vehicules/${alert.vehicleId}`)}
                          className="text-primary hover:underline font-medium"
                        >
                          {alert.vehicleName}
                        </button>{" "}
                        {alert.message}
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => navigate(`/vehicules/${alert.vehicleId}`)}
                      >
                        AGIR
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="vignettes" className="border-0">
            <AccordionTrigger className="px-4 hover:no-underline">
              <div className="flex items-center gap-2">
                {vignetteAlerts.length === 0 ? (
                  <CheckCircle2 className="w-5 h-5 text-success" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-warning" />
                )}
                <span className="font-medium">Les alertes vignettes</span>
                <span className="text-sm text-muted-foreground">
                  {vignetteAlerts.length === 0
                    ? "Aucune alertes trouvée"
                    : `${vignetteAlerts.length} alerte(s) trouvée(s)`}
                </span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              {vignetteAlerts.length === 0 ? (
                <p className="text-sm text-muted-foreground">Aucune alerte</p>
              ) : (
                <div className="space-y-2">
                  {vignetteAlerts.map((alert, index) => (
                    <div
                      key={index}
                      className={`flex items-center justify-between p-3 rounded-lg ${
                        alert.severity === "critical"
                          ? "bg-destructive/10"
                          : "bg-warning/10"
                      }`}
                    >
                      <span className="text-sm">
                        Véhicule{" "}
                        <button
                          onClick={() => navigate(`/vehicules/${alert.vehicleId}`)}
                          className="text-primary hover:underline font-medium"
                        >
                          {alert.vehicleName}
                        </button>{" "}
                        {alert.message}
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => navigate(`/vehicules/${alert.vehicleId}`)}
                      >
                        AGIR
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
