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
import { format, isSameDay, isWithinInterval, parseISO, differenceInDays, startOfMonth, endOfMonth, getDay } from "date-fns";
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

  // Calculate contract positions for continuous display
  const getContractBars = () => {
    const monthStart = new Date(currentYear, currentMonth, 1);
    const monthEnd = new Date(currentYear, currentMonth + 1, 0);
    
    return contracts.map(contract => {
      const start = parseISO(contract.date_debut);
      const end = parseISO(contract.date_fin);
      
      // Adjust start and end to month boundaries
      const displayStart = start < monthStart ? monthStart : start;
      const displayEnd = end > monthEnd ? monthEnd : end;
      
      const startDay = displayStart.getDate();
      const dayOfWeek = getDay(displayStart);
      const duration = differenceInDays(displayEnd, displayStart) + 1;
      
      // Calculate grid position
      const row = Math.floor((firstDayOfMonth + startDay - 1) / 7) + 2; // +2 for header row
      const col = ((firstDayOfMonth + startDay - 1) % 7) + 1;
      
      return {
        ...contract,
        startDay,
        duration,
        row,
        col,
        displayStart,
        displayEnd
      };
    });
  };

  const contractBars = getContractBars();

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
    <div className="p-3 md:p-6 space-y-4 md:space-y-6">
      {/* Header with gradient */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent rounded-lg border border-primary/20">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-foreground flex items-center gap-2">
            📅 Calendrier de réservations
          </h1>
          <p className="text-xs md:text-sm text-muted-foreground mt-1">
            Gérez et visualisez toutes vos locations en un coup d'œil
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => setShowAvailabilityDialog(true)}
            className="flex-1 md:flex-none bg-background/80 backdrop-blur-sm hover:bg-background"
          >
            <Search className="w-4 h-4 mr-2" />
            Disponibilité
          </Button>
          <Button 
            size="sm"
            onClick={() => navigate('/locations/nouveau')}
            className="flex-1 md:flex-none shadow-md hover:shadow-lg transition-shadow"
          >
            <Plus className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Nouvelle réservation</span>
            <span className="sm:hidden">Nouveau</span>
          </Button>
        </div>
      </div>

      {/* Calendar Card */}
      <Card className="shadow-lg border-primary/10">
        <CardHeader className="p-4 md:p-6 border-b bg-gradient-to-r from-muted/30 to-transparent">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <CardTitle className="text-lg md:text-2xl font-bold">
              {months[currentMonth]} {currentYear}
            </CardTitle>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm" onClick={handlePreviousMonth} className="hover:bg-primary/10">
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setCurrentDate(new Date())}
                className="hover:bg-primary/10"
              >
                Aujourd'hui
              </Button>
              <Button variant="outline" size="sm" onClick={handleNextMonth} className="hover:bg-primary/10">
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-2 md:p-6">
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <p className="text-muted-foreground mt-4">Chargement des réservations...</p>
            </div>
          ) : (
            <>
              {/* Calendar Grid */}
              <div className="relative">
                {/* Days of week header */}
                <div className="grid grid-cols-7 gap-1 md:gap-2 mb-2">
                  {daysOfWeek.map((day) => (
                    <div
                      key={day}
                      className="text-center text-xs md:text-sm font-semibold text-primary py-2 bg-primary/5 rounded"
                    >
                      {day}
                    </div>
                  ))}
                </div>

                {/* Calendar days */}
                <div className="grid grid-cols-7 gap-1 md:gap-2 relative">
                  {days.map((day, index) => {
                    const isToday = day === new Date().getDate() && 
                                    currentMonth === new Date().getMonth() && 
                                    currentYear === new Date().getFullYear();
                    
                    return (
                      <div
                        key={index}
                        className={`
                          min-h-[80px] md:min-h-[100px] p-2 border rounded-lg transition-all
                          ${day ? 'bg-card hover:bg-muted/50 cursor-pointer' : 'bg-muted/20 border-transparent'}
                          ${isToday ? 'border-2 border-primary bg-primary/10 shadow-md' : 'border-border'}
                        `}
                        onClick={() => day && setSelectedDay(new Date(currentYear, currentMonth, day))}
                      >
                        {day && (
                          <div className={`text-sm md:text-base font-semibold ${isToday ? 'text-primary' : 'text-foreground'}`}>
                            {day}
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* Contract bars overlay */}
                  <div className="absolute inset-0 pointer-events-none">
                    {contractBars.map((contract, idx) => {
                      const rowStart = Math.floor((firstDayOfMonth + contract.startDay - 1) / 7);
                      const colStart = ((firstDayOfMonth + contract.startDay - 1) % 7);
                      
                      // Calculate how many days fit in the current week
                      const daysRemainingInWeek = 7 - colStart;
                      const daysToShow = Math.min(contract.duration, daysRemainingInWeek);
                      
                      return (
                        <div
                          key={contract.id}
                          className="absolute pointer-events-auto cursor-pointer z-10 group"
                          style={{
                            gridRow: `${rowStart + 1}`,
                            left: `${colStart * (100/7)}%`,
                            top: `${rowStart * 84}px`,
                            width: `calc(${daysToShow * (100/7)}% - 4px)`,
                          }}
                          onClick={() => navigate(`/locations/${contract.id}`)}
                        >
                          <div className="mt-8 mx-1 p-2 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground rounded-lg shadow-md hover:shadow-lg transition-all group-hover:scale-[1.02]">
                            <div className="text-xs md:text-sm font-semibold truncate">
                              {contract.vehicles?.immatriculation}
                            </div>
                            <div className="text-[10px] md:text-xs truncate opacity-90">
                              {contract.clients?.nom} {contract.clients?.prenom}
                            </div>
                            <div className="text-[10px] truncate opacity-80">
                              {contract.vehicles?.marque} {contract.vehicles?.modele}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Selected day details */}
              <div className="mt-6 pt-6 border-t">
                <h3 className="text-base md:text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Car className="w-5 h-5 text-primary" />
                  {selectedDay ? 
                    `Réservations du ${format(selectedDay, 'd MMMM yyyy', { locale: fr })}` : 
                    'Sélectionnez un jour pour voir les détails'}
                </h3>
                {selectedDayContracts.length === 0 ? (
                  <div className="text-center py-8 px-4 bg-muted/30 rounded-lg">
                    <p className="text-sm text-muted-foreground">
                      {selectedDay ? 'Aucune réservation pour cette date' : 'Cliquez sur un jour du calendrier'}
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {selectedDayContracts.map((contract) => (
                      <Card 
                        key={contract.id}
                        className="cursor-pointer hover:shadow-lg transition-all hover:border-primary/50 group"
                        onClick={() => navigate(`/locations/${contract.id}`)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                              <Car className="w-6 h-6 text-primary-foreground" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-semibold text-foreground truncate">
                                {contract.vehicles?.marque} {contract.vehicles?.modele}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {contract.vehicles?.immatriculation}
                              </div>
                              <div className="text-xs text-muted-foreground mt-1">
                                👤 {contract.clients?.nom} {contract.clients?.prenom}
                              </div>
                              <div className="flex items-center gap-2 mt-2 flex-wrap">
                                <Badge variant="outline" className="text-xs">
                                  {contract.numero_contrat}
                                </Badge>
                                <Badge 
                                  variant={contract.statut === 'livre' ? 'default' : 'secondary'}
                                  className="text-xs"
                                >
                                  {contract.statut === 'livre' ? 'En cours' : 'Validé'}
                                </Badge>
                              </div>
                              <div className="text-xs text-muted-foreground mt-2">
                                📅 {format(parseISO(contract.date_debut), 'dd/MM')} → {format(parseISO(contract.date_fin), 'dd/MM/yyyy')}
                              </div>
                            </div>
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
            <DialogTitle className="text-xl flex items-center gap-2">
              <Search className="w-5 h-5 text-primary" />
              Vérifier la disponibilité
            </DialogTitle>
            <DialogDescription>
              Sélectionnez une période pour découvrir les véhicules disponibles
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg border border-primary/20">
              <div>
                <Label htmlFor="start-date" className="text-sm font-semibold">📅 Date de début</Label>
                <Input
                  id="start-date"
                  type="date"
                  value={availabilityDates.start}
                  onChange={(e) => setAvailabilityDates({...availabilityDates, start: e.target.value})}
                  className="mt-2"
                />
              </div>
              <div>
                <Label htmlFor="end-date" className="text-sm font-semibold">📅 Date de fin</Label>
                <Input
                  id="end-date"
                  type="date"
                  value={availabilityDates.end}
                  onChange={(e) => setAvailabilityDates({...availabilityDates, end: e.target.value})}
                  className="mt-2"
                />
              </div>
            </div>

            <Button 
              onClick={checkAvailability}
              disabled={checkingAvailability}
              className="w-full shadow-md hover:shadow-lg transition-all"
              size="lg"
            >
              {checkingAvailability ? (
                <>
                  <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Vérification en cours...
                </>
              ) : (
                <>
                  <Search className="w-4 h-4 mr-2" />
                  Vérifier la disponibilité
                </>
              )}
            </Button>

            {availableVehicles.length > 0 && (
              <div className="mt-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 rounded-lg border border-green-200 dark:border-green-800">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-green-700 dark:text-green-400">
                  <Car className="w-5 h-5" />
                  {availableVehicles.length} véhicule(s) disponible(s)
                </h3>
                <div className="space-y-3 max-h-[400px] overflow-y-auto">
                  {availableVehicles.map((vehicle) => (
                    <Card 
                      key={vehicle.id}
                      className="cursor-pointer hover:shadow-lg transition-all hover:border-primary/50 group"
                      onClick={() => {
                        setShowAvailabilityDialog(false);
                        navigate(`/vehicules/${vehicle.id}`);
                      }}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 flex-1">
                            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center group-hover:scale-110 transition-transform">
                              <Car className="w-6 h-6 text-primary-foreground" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-semibold text-foreground">
                                {vehicle.marque} {vehicle.modele}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {vehicle.immatriculation}
                              </div>
                              <div className="text-xs text-muted-foreground mt-1">
                                🏷️ Catégorie {vehicle.categorie || 'A'}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-lg text-primary">
                              {vehicle.tarif_journalier} DH
                            </div>
                            <div className="text-xs text-muted-foreground">par jour</div>
                            <Badge variant="default" className="text-xs mt-2">
                              Disponible
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
              <div className="text-center py-8 px-4 bg-muted/30 rounded-lg border border-dashed">
                <p className="text-muted-foreground">😔 Aucun véhicule disponible pour cette période</p>
                <p className="text-xs text-muted-foreground mt-2">Essayez une autre période ou contactez-nous</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
