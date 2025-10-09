import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ChevronRight, ArrowDownToLine, ArrowUpFromLine, Calendar, Edit, MoreVertical, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";

type Vehicle = Database['public']['Tables']['vehicles']['Row'];

export default function VehiculeDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("resume");
  const [activeInterventionTab, setActiveInterventionTab] = useState("assurance");

  useEffect(() => {
    if (id) {
      loadVehicle();
    }
  }, [id]);

  const loadVehicle = async () => {
    try {
      const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setVehicle(data);
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: "Impossible de charger les détails du véhicule",
        variant: "destructive"
      });
      navigate('/vehicules');
    } finally {
      setLoading(false);
    }
  };

  const getAlerts = () => {
    const alerts = [];
    const today = new Date();
    
    if (!vehicle?.assurance_expire_le) {
      alerts.push({
        message: "Véhicule sans assurance ajoutée.",
        action: "CRÉER ASSURANCE"
      });
    } else if (new Date(vehicle.assurance_expire_le) < today) {
      alerts.push({
        message: "Assurance expirée.",
        action: "CRÉER ASSURANCE"
      });
    }

    if (!vehicle?.visite_technique_expire_le) {
      alerts.push({
        message: "Véhicule sans visite technique ajoutée.",
        action: "CRÉER VISITE"
      });
    } else if (new Date(vehicle.visite_technique_expire_le) < today) {
      alerts.push({
        message: "Visite technique expirée.",
        action: "CRÉER VISITE"
      });
    }

    if (!vehicle?.vignette_expire_le) {
      alerts.push({
        message: "Véhicule sans autorisation ajoutée.",
        action: "CRÉER AUTORISATION"
      });
    } else if (new Date(vehicle.vignette_expire_le) < today) {
      alerts.push({
        message: "Autorisation expirée.",
        action: "CRÉER AUTORISATION"
      });
    }

    // Check for vidange (oil change) - we can use kilometrage
    if (vehicle && vehicle.kilometrage > 10000) {
      alerts.push({
        message: "Véhicule sans vidange ajoutée.",
        action: "CRÉER VIDANGE"
      });
    }

    return alerts;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Chargement...</p>
      </div>
    );
  }

  if (!vehicle) {
    return null;
  }

  const alerts = getAlerts();
  const statusBadge = vehicle.statut === 'disponible' ? 'Libre' : 
                     vehicle.statut === 'loue' ? 'Loué' : 
                     vehicle.statut === 'reserve' ? 'Réservé' : 'En panne';
  const statusColor = vehicle.statut === 'disponible' ? 'bg-green-100 text-green-800' : 
                     vehicle.statut === 'loue' ? 'bg-blue-100 text-blue-800' : 
                     vehicle.statut === 'reserve' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800';

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Fiche véhicule Mat. N° {vehicle.immatriculation}</h1>
          <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
            <Link to="/" className="hover:text-foreground">Tableau de bord</Link>
            <ChevronRight className="w-4 h-4" />
            <Link to="/vehicules" className="hover:text-foreground">Véhicules</Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-foreground">Véhicule Mat. {vehicle.immatriculation}</span>
          </div>
        </div>
        <Button className="bg-primary">
          <Edit className="w-4 h-4 mr-2" />
          MODIFIER LE VÉHICULE
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="bg-green-50 border-green-100">
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-green-700 font-medium">REVENU TOTAL</p>
                <p className="text-3xl font-bold text-green-900">0,00<span className="text-lg">DH</span></p>
              </div>
              <div className="bg-green-200 p-3 rounded-lg">
                <ArrowDownToLine className="w-6 h-6 text-green-700" />
              </div>
            </div>
            <Button variant="link" className="text-green-700 p-0 h-auto mt-2">
              → CONSULTER LES DÉTAILS
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-red-50 border-red-100">
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-red-700 font-medium">DÉPENSE TOTALE</p>
                <p className="text-3xl font-bold text-red-900">0,00<span className="text-lg">DH</span></p>
              </div>
              <div className="bg-red-200 p-3 rounded-lg">
                <ArrowUpFromLine className="w-6 h-6 text-red-700" />
              </div>
            </div>
            <Button variant="link" className="text-red-700 p-0 h-auto mt-2">
              → CONSULTER LES DÉTAILS
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-blue-50 border-blue-100">
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-blue-700 font-medium">RÉSERVATIONS</p>
                <p className="text-3xl font-bold text-blue-900">00</p>
              </div>
              <div className="bg-blue-200 p-3 rounded-lg">
                <Calendar className="w-6 h-6 text-blue-700" />
              </div>
            </div>
            <Button variant="link" className="text-blue-700 p-0 h-auto mt-2">
              ↓ PLUS DE DÉTAILS
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Left Column - Informations */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full" />
              <CardTitle className="text-base">Informations</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon">
                <Edit className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="resume">RÉSUMÉ</TabsTrigger>
                <TabsTrigger value="info">INFO DE BASE</TabsTrigger>
                <TabsTrigger value="details">PLUS DE DÉTAILS</TabsTrigger>
              </TabsList>
              
              <TabsContent value="resume" className="mt-6">
                <div className="flex flex-col items-center space-y-4">
                  <div className="w-32 h-32 rounded-full bg-muted flex items-center justify-center text-6xl font-bold">
                    {vehicle.marque?.charAt(0) || 'V'}
                  </div>
                  <h3 className="text-xl font-semibold">{vehicle.marque}</h3>
                  <Badge className={statusColor}>{statusBadge}</Badge>
                  
                  <div className="grid grid-cols-4 gap-4 w-full mt-6">
                    <div className="text-center">
                      <div className="text-blue-500 text-2xl font-bold">#</div>
                      <p className="text-xs text-muted-foreground mt-1">Matricule</p>
                      <p className="font-semibold mt-1">{vehicle.immatriculation}</p>
                    </div>
                    <div className="text-center">
                      <div className="text-blue-500 text-2xl font-bold">⊙</div>
                      <p className="text-xs text-muted-foreground mt-1">Kilométrage</p>
                      <p className="font-semibold mt-1">{vehicle.kilometrage.toLocaleString()} Km</p>
                    </div>
                    <div className="text-center">
                      <div className="text-blue-500 text-2xl font-bold">$</div>
                      <p className="text-xs text-muted-foreground mt-1">Prix location</p>
                      <p className="font-semibold mt-1">{vehicle.tarif_journalier.toLocaleString()} Dh</p>
                    </div>
                    <div className="text-center">
                      <div className="text-blue-500 text-2xl font-bold">⛽</div>
                      <p className="text-xs text-muted-foreground mt-1">Carburant</p>
                      <p className="font-semibold mt-1">Diesel</p>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="info">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Marque</p>
                      <p className="font-semibold">{vehicle.marque}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Modèle</p>
                      <p className="font-semibold">{vehicle.modele}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Année</p>
                      <p className="font-semibold">{vehicle.annee}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Valeur d'achat</p>
                      <p className="font-semibold">{vehicle.valeur_achat?.toLocaleString() || 'N/A'} Dh</p>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="details">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Assurance expire le</p>
                      <p className="font-semibold">{vehicle.assurance_expire_le || 'Non défini'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Visite technique expire le</p>
                      <p className="font-semibold">{vehicle.visite_technique_expire_le || 'Non défini'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Vignette expire le</p>
                      <p className="font-semibold">{vehicle.vignette_expire_le || 'Non défini'}</p>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Right Column - Alerts */}
        <Collapsible defaultOpen>
          <Card>
            <CollapsibleTrigger className="w-full">
              <CardHeader className="flex flex-row items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-orange-500" />
                  <CardTitle className="text-base">
                    {alerts.length.toString().padStart(2, '0')} alertes trouvées pour ce véhicule
                  </CardTitle>
                </div>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="space-y-3">
                {alerts.map((alert, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-orange-500" />
                      <span className="text-sm">{alert.message}</span>
                    </div>
                    <Button variant="link" className="text-orange-700 text-xs h-auto p-0">
                      {alert.action}
                    </Button>
                  </div>
                ))}
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      </div>

      {/* Interventions Section */}
      <Collapsible defaultOpen>
        <Card>
          <CollapsibleTrigger className="w-full">
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full" />
                <CardTitle className="text-base">Assurances, Interventions,...</CardTitle>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent>
              <Tabs value={activeInterventionTab} onValueChange={setActiveInterventionTab}>
                <TabsList className="w-full justify-start">
                  <TabsTrigger value="assurance">ASSURANCE</TabsTrigger>
                  <TabsTrigger value="visite">VISITE TECHNIQUE</TabsTrigger>
                  <TabsTrigger value="vidange">VIDANGE</TabsTrigger>
                  <TabsTrigger value="autorisation">AUTORISATION</TabsTrigger>
                  <TabsTrigger value="vignette">VIGNETTE</TabsTrigger>
                  <TabsTrigger value="reparation">RÉPARATION</TabsTrigger>
                  <TabsTrigger value="infraction">INFRACTION</TabsTrigger>
                  <TabsTrigger value="incident">INCIDENT</TabsTrigger>
                </TabsList>
                
                <TabsContent value={activeInterventionTab} className="mt-4">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Actions</TableHead>
                        <TableHead>N° d'order</TableHead>
                        <TableHead>Assureur</TableHead>
                        <TableHead>Date début</TableHead>
                        <TableHead>Date d'expiration</TableHead>
                        <TableHead>Jours restant</TableHead>
                        <TableHead>Montant</TableHead>
                        <TableHead>Date création</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell colSpan={8}>
                          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                            <div className="w-16 h-16 bg-muted rounded-lg mb-4" />
                            <p>Aucun résultat</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                  
                  <Button variant="link" className="text-primary mt-4">
                    ⊕ AJOUTER ASSURANCE
                  </Button>
                </TabsContent>
              </Tabs>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Purchase Info Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Infos d'achat / Les traites</CardTitle>
          <p className="text-sm text-muted-foreground mt-2">
            La création des infos d'achat vous permet de gérer et de suivre facilement les traites bancaires de ce véhicule
          </p>
        </CardHeader>
        <CardContent>
          <Button variant="link" className="text-primary">
            ⊕ AJOUTER
          </Button>
        </CardContent>
      </Card>

      {/* Rental Situation Section */}
      <Collapsible defaultOpen>
        <Card>
          <CollapsibleTrigger className="w-full">
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full" />
                <CardTitle className="text-base">Situation des locations</CardTitle>
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type location</TableHead>
                    <TableHead className="text-center">En attente</TableHead>
                    <TableHead className="text-center">Livrée</TableHead>
                    <TableHead className="text-center">Récupérée</TableHead>
                    <TableHead className="text-center">Annulée</TableHead>
                    <TableHead className="text-center">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell>Courte durée</TableCell>
                    <TableCell className="text-center">00</TableCell>
                    <TableCell className="text-center">00</TableCell>
                    <TableCell className="text-center">00</TableCell>
                    <TableCell className="text-center">00</TableCell>
                    <TableCell className="text-center">00</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Longue durée</TableCell>
                    <TableCell className="text-center">00</TableCell>
                    <TableCell className="text-center">00</TableCell>
                    <TableCell className="text-center">00</TableCell>
                    <TableCell className="text-center">00</TableCell>
                    <TableCell className="text-center">00</TableCell>
                  </TableRow>
                  <TableRow className="font-semibold">
                    <TableCell>Total</TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary" className="bg-orange-100 text-orange-800">00</Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary" className="bg-blue-100 text-blue-800">00</Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary" className="bg-green-100 text-green-800">00</Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary" className="bg-red-100 text-red-800">00</Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary">00</Badge>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
              
              <div className="mt-4 space-y-2">
                <div className="flex items-start gap-2 text-sm text-muted-foreground">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5" />
                  <p>Cliquez ici pour consulter toutes les locations courtes durées de ce véhicule.</p>
                </div>
                <div className="flex items-start gap-2 text-sm text-muted-foreground">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5" />
                  <p>Cliquez ici pour consulter toutes les locations longues durées de ce véhicule.</p>
                </div>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Delete Button */}
      <div>
        <Button variant="destructive" className="bg-red-600 hover:bg-red-700">
          🗑 SUPPRIMER CE VÉHICULE
        </Button>
      </div>
    </div>
  );
}
