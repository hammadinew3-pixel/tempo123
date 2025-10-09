import { ChevronLeft, ChevronRight, Plus, Search, Car } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format, isSameDay, isWithinInterval, parseISO } from "date-fns";
import { fr } from "date-fns/locale";

const daysOfWeek = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];
const months = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
];

type Contract = {
  id: string;
  date_debut: string;
  date_fin: string;
  statut: string;
  numero_contrat: string;
  vehicle_id: string;
  vehicles?: {
    immatriculation: string;
    marque: string;
    modele: string;
  };
  clients?: {
    nom: string;
    prenom: string;
  };
};

export default function Calendrier() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAvailabilityDialog, setShowAvailabilityDialog] = useState(false);
  const [availabilityDates, setAvailabilityDates] = useState({
    start: '',
    end: ''
  });
  const [availableVehicles, setAvailableVehicles] = useState<any[]>([]);
  const [checkingAvailability, setCheckingAvailability] = useState(false);

  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  useEffect(() => {
    loadContracts();
  }, [currentMonth, currentYear]);

  const loadContracts = async () => {
    try {
      const startOfMonth = new Date(currentYear, currentMonth, 1);
      const endOfMonth = new Date(currentYear, currentMonth + 1, 0);

      const { data, error } = await supabase
        .from('contracts')
        .select(`
          *,
          vehicles (immatriculation, marque, modele),
          clients (nom, prenom)
        `)
        .gte('date_fin', startOfMonth.toISOString().split('T')[0])
        .lte('date_debut', endOfMonth.toISOString().split('T')[0])
        .in('statut', ['contrat_valide', 'livre']);

      if (error) throw error;
      setContracts(data || []);
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: "Impossible de charger les réservations",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const checkAvailability = async () => {
    if (!availabilityDates.start || !availabilityDates.end) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner les dates",
        variant: "destructive"
      });
      return;
    }

    setCheckingAvailability(true);
    try {
      // Get all vehicles
      const { data: allVehicles, error: vehiclesError } = await supabase
        .from('vehicles')
        .select('*')
        .eq('statut', 'disponible');

      if (vehiclesError) throw vehiclesError;

      // Get contracts that overlap with the selected dates
      const { data: overlappingContracts, error: contractsError } = await supabase
        .from('contracts')
        .select('vehicle_id')
        .lte('date_debut', availabilityDates.end)
        .gte('date_fin', availabilityDates.start)
        .in('statut', ['contrat_valide', 'livre']);

      if (contractsError) throw contractsError;

      const reservedVehicleIds = new Set(overlappingContracts?.map(c => c.vehicle_id) || []);
      const available = allVehicles?.filter(v => !reservedVehicleIds.has(v.id)) || [];

      setAvailableVehicles(available);
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setCheckingAvailability(false);
    }
  };

  const getContractsForDay = (day: number) => {
    const date = new Date(currentYear, currentMonth, day);
    return contracts.filter(contract => {
      const start = parseISO(contract.date_debut);
      const end = parseISO(contract.date_fin);
      return isWithinInterval(date, { start, end }) || isSameDay(date, start) || isSameDay(date, end);
    });
  };

  const handlePreviousMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1));
  };

  // Calculate days in month
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();

  const days = [];
  for (let i = 0; i < firstDayOfMonth; i++) {
    days.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }

  const selectedDayContracts = selectedDay ? getContractsForDay(selectedDay.getDate()) : [];

  return (
    <div className="p-3 md:p-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4 md:mb-6">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-foreground">Calendrier</h1>
          <p className="text-xs md:text-sm text-muted-foreground">Visualisez vos réservations</p>
        </div>
        <div className="flex gap-2">
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => setShowAvailabilityDialog(true)}
            className="flex-1 md:flex-none"
          >
            <Search className="w-4 h-4 mr-2" />
            Check disponibilité
          </Button>
          <Button 
            size="sm"
            onClick={() => navigate('/locations/nouveau')}
            className="flex-1 md:flex-none"
          >
            <Plus className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Nouvelle réservation</span>
            <span className="sm:hidden">Nouveau</span>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="p-4 md:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <CardTitle className="text-lg md:text-2xl">
              {months[currentMonth]} {currentYear}
            </CardTitle>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm" onClick={handlePreviousMonth}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setCurrentDate(new Date())}
              >
                Aujourd'hui
              </Button>
              <Button variant="outline" size="sm" onClick={handleNextMonth}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-2 md:p-6">
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Chargement...</div>
          ) : (
            <>
              <div className="grid grid-cols-7 gap-1 md:gap-2">
                {daysOfWeek.map((day) => (
                  <div
                    key={day}
                    className="text-center text-xs md:text-sm font-medium text-muted-foreground py-2"
                  >
                    {day}
                  </div>
                ))}
                {days.map((day, index) => {
                  const dayContracts = day ? getContractsForDay(day) : [];
                  const isToday = day === new Date().getDate() && 
                                  currentMonth === new Date().getMonth() && 
                                  currentYear === new Date().getFullYear();
                  
                  return (
                    <div
                      key={index}
                      className={`
                        min-h-[60px] md:min-h-[80px] p-1 md:p-2 border rounded-lg transition-colors
                        ${day ? 'bg-card hover:bg-muted cursor-pointer' : 'bg-transparent border-transparent'}
                        ${isToday ? 'border-primary bg-primary/10' : 'border-border'}
                      `}
                      onClick={() => day && setSelectedDay(new Date(currentYear, currentMonth, day))}
                    >
                      {day && (
                        <>
                          <div className="text-xs md:text-sm font-medium text-foreground mb-1">
                            {day}
                          </div>
                          <div className="space-y-0.5">
                            {dayContracts.slice(0, 2).map((contract) => (
                              <div
                                key={contract.id}
                                className="text-[10px] md:text-xs px-1 py-0.5 bg-primary/20 text-primary rounded truncate"
                                title={`${contract.vehicles?.immatriculation} - ${contract.clients?.nom}`}
                              >
                                {contract.vehicles?.immatriculation}
                              </div>
                            ))}
                            {dayContracts.length > 2 && (
                              <div className="text-[10px] text-muted-foreground">
                                +{dayContracts.length - 2}
                              </div>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="mt-4 md:mt-6 pt-4 md:pt-6 border-t">
                <h3 className="text-sm md:text-base font-medium text-foreground mb-3">
                  {selectedDay ? 
                    `Réservations du ${format(selectedDay, 'd MMMM yyyy', { locale: fr })}` : 
                    'Réservations du jour'}
                </h3>
                {selectedDayContracts.length === 0 ? (
                  <div className="text-center py-6 md:py-8 text-sm text-muted-foreground">
                    Aucune réservation pour cette date
                  </div>
                ) : (
                  <div className="space-y-2 md:space-y-3">
                    {selectedDayContracts.map((contract) => (
                      <Card 
                        key={contract.id}
                        className="cursor-pointer hover:shadow-md transition-shadow"
                        onClick={() => navigate(`/locations/${contract.id}`)}
                      >
                        <CardContent className="p-3 md:p-4">
                          <div className="flex items-center justify-between flex-wrap gap-2">
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                <Car className="w-5 h-5 text-primary" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="font-semibold text-sm md:text-base truncate">
                                  {contract.vehicles?.marque} {contract.vehicles?.modele}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {contract.vehicles?.immatriculation} - {contract.clients?.nom} {contract.clients?.prenom}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge variant="outline" className="text-xs">
                                {contract.numero_contrat}
                              </Badge>
                              <Badge 
                                variant={
                                  contract.statut === 'livre' ? 'default' : 
                                  contract.statut === 'contrat_valide' ? 'secondary' : 
                                  'outline'
                                }
                                className="text-xs"
                              >
                                {contract.statut === 'livre' ? 'En cours' : 
                                 contract.statut === 'contrat_valide' ? 'Validé' : 
                                 contract.statut}
                              </Badge>
                            </div>
                          </div>
                          <div className="mt-2 text-xs text-muted-foreground">
                            Du {format(parseISO(contract.date_debut), 'dd/MM/yyyy')} au {format(parseISO(contract.date_fin), 'dd/MM/yyyy')}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Availability Check Dialog */}
      <Dialog open={showAvailabilityDialog} onOpenChange={setShowAvailabilityDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Vérifier la disponibilité</DialogTitle>
            <DialogDescription>
              Sélectionnez une période pour voir les véhicules disponibles
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="start-date">Date de début</Label>
                <Input
                  id="start-date"
                  type="date"
                  value={availabilityDates.start}
                  onChange={(e) => setAvailabilityDates({...availabilityDates, start: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="end-date">Date de fin</Label>
                <Input
                  id="end-date"
                  type="date"
                  value={availabilityDates.end}
                  onChange={(e) => setAvailabilityDates({...availabilityDates, end: e.target.value})}
                />
              </div>
            </div>

            <Button 
              onClick={checkAvailability}
              disabled={checkingAvailability}
              className="w-full"
            >
              {checkingAvailability ? 'Vérification...' : 'Vérifier la disponibilité'}
            </Button>

            {availableVehicles.length > 0 && (
              <div className="mt-6">
                <h3 className="font-semibold mb-3">
                  {availableVehicles.length} véhicule(s) disponible(s)
                </h3>
                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  {availableVehicles.map((vehicle) => (
                    <Card 
                      key={vehicle.id}
                      className="cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => {
                        setShowAvailabilityDialog(false);
                        navigate(`/vehicules/${vehicle.id}`);
                      }}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                              <Car className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                              <div className="font-semibold">
                                {vehicle.marque} {vehicle.modele}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {vehicle.immatriculation}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold text-primary">
                              {vehicle.tarif_journalier} DH/jour
                            </div>
                            <Badge variant="outline" className="text-xs mt-1">
                              Cat. {vehicle.categorie || 'A'}
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {!checkingAvailability && availableVehicles.length === 0 && availabilityDates.start && availabilityDates.end && (
              <div className="text-center py-8 text-muted-foreground">
                Aucun véhicule disponible pour cette période
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
