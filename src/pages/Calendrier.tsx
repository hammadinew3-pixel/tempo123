import { ChevronLeft, ChevronRight, Plus, Search, Car, Calendar as CalendarIcon, User, MapPin, CheckCircle2, AlertCircle } from "lucide-react";
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

  // Calculate contract bars for continuous display
  const getContractBars = () => {
    const bars: any[] = [];
    const monthStart = new Date(currentYear, currentMonth, 1);
    const monthEnd = new Date(currentYear, currentMonth + 1, 0);
    
    contracts.forEach((contract, idx) => {
      const contractStart = parseISO(contract.date_debut);
      const contractEnd = parseISO(contract.date_fin);
      
      // Only show contracts that overlap with current month
      if (contractEnd < monthStart || contractStart > monthEnd) return;
      
      // Calculate visible start and end (clip to month boundaries)
      const visibleStart = contractStart < monthStart ? monthStart : contractStart;
      const visibleEnd = contractEnd > monthEnd ? monthEnd : contractEnd;
      
      const startDay = visibleStart.getDate();
      const endDay = visibleEnd.getDate();
      const duration = endDay - startDay + 1;
      
      // Calculate grid position
      const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
      const startCol = (startDay + firstDayOfMonth - 1) % 7;
      const startRow = Math.floor((startDay + firstDayOfMonth - 1) / 7);
      
      bars.push({
        contract,
        startDay,
        endDay,
        duration,
        startCol,
        startRow,
        color: `hsl(${(idx * 137.5) % 360}, 70%, 50%)`,
      });
    });
    
    return bars;
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
      <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent rounded-lg border border-primary/20 p-4 md:p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-foreground flex items-center gap-2">
              <CalendarIcon className="w-6 h-6 text-primary" />
              Calendrier des Réservations
            </h1>
            <p className="text-xs md:text-sm text-muted-foreground mt-1">Visualisez toutes vos locations en cours et à venir</p>
          </div>
          <div className="flex gap-2">
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => setShowAvailabilityDialog(true)}
              className="flex-1 md:flex-none hover:bg-primary/10 hover:border-primary transition-colors"
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
      </div>

      <Card className="shadow-lg border-primary/10">
        <CardHeader className="p-4 md:p-6 border-b border-border/50">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <CardTitle className="text-lg md:text-xl font-bold text-foreground">
              {months[currentMonth]} {currentYear}
            </CardTitle>
            <div className="flex space-x-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handlePreviousMonth}
                className="hover:bg-primary/10 hover:border-primary transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setCurrentDate(new Date())}
                className="hover:bg-primary/10 hover:border-primary transition-colors"
              >
                Aujourd'hui
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleNextMonth}
                className="hover:bg-primary/10 hover:border-primary transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-2 md:p-6">
          {loading ? (
            <div className="text-center py-12 text-muted-foreground">
              <div className="animate-pulse">Chargement des réservations...</div>
            </div>
          ) : (
            <>
              {/* Calendar Grid */}
              <div className="relative">
                <div className="grid grid-cols-7 gap-1 md:gap-2 mb-2">
                  {daysOfWeek.map((day) => (
                    <div
                      key={day}
                      className="text-center text-xs md:text-sm font-semibold text-muted-foreground py-2 border-b"
                    >
                      {day}
                    </div>
                  ))}
                </div>
                
                <div className="relative" style={{ minHeight: '400px' }}>
                  {/* Calendar Days Grid */}
                  <div className="grid grid-cols-7 gap-1 md:gap-2">
                    {days.map((day, index) => {
                      const isToday = day === new Date().getDate() && 
                                      currentMonth === new Date().getMonth() && 
                                      currentYear === new Date().getFullYear();
                      
                      return (
                        <div
                          key={index}
                          className={`
                            min-h-[70px] md:min-h-[90px] p-2 border rounded-md transition-all
                            ${day ? 'bg-card/50 hover:bg-muted/50 cursor-pointer' : 'bg-transparent border-transparent'}
                            ${isToday ? 'border-primary border-2 bg-primary/5 ring-2 ring-primary/20' : 'border-border/50'}
                          `}
                          onClick={() => day && setSelectedDay(new Date(currentYear, currentMonth, day))}
                        >
                          {day && (
                            <div className={`text-xs md:text-sm font-semibold ${isToday ? 'text-primary' : 'text-foreground/70'}`}>
                              {day}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Contract Bars - Continuous Display */}
                  <div className="absolute top-0 left-0 right-0 pointer-events-none" style={{ paddingTop: '40px' }}>
                    {contractBars.map((bar, idx) => {
                      const cellWidth = 100 / 7; // percentage width of each cell
                      const gapSize = 0.5; // gap between cells in percentage
                      
                      return (
                        <div
                          key={bar.contract.id}
                          className="absolute pointer-events-auto cursor-pointer group transition-all hover:z-10"
                          style={{
                            top: `${bar.startRow * 90 + idx * 28 + 8}px`,
                            left: `${bar.startCol * cellWidth}%`,
                            width: `${bar.duration * cellWidth - gapSize}%`,
                            height: '24px',
                          }}
                          onClick={() => navigate(`/locations/${bar.contract.id}`)}
                        >
                          <div 
                            className="h-full rounded-md px-2 py-1 shadow-sm border flex items-center gap-2 overflow-hidden group-hover:shadow-lg group-hover:scale-[1.02] transition-all"
                            style={{
                              backgroundColor: `${bar.color}15`,
                              borderColor: bar.color,
                              borderWidth: '2px',
                            }}
                          >
                            <Car className="w-3 h-3 flex-shrink-0" style={{ color: bar.color }} />
                            <span className="text-xs font-semibold truncate" style={{ color: bar.color }}>
                              {bar.contract.vehicles?.immatriculation}
                            </span>
                            <span className="text-xs truncate text-foreground/80 hidden md:inline">
                              - {bar.contract.clients?.nom} {bar.contract.clients?.prenom}
                            </span>
                            <span className="text-xs truncate text-foreground/60 hidden lg:inline">
                              - {bar.contract.vehicles?.marque} {bar.contract.vehicles?.modele}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Selected Day Details */}
              <div className="mt-6 pt-6 border-t border-border/50">
                <div className="flex items-center gap-2 mb-4">
                  <CalendarIcon className="w-5 h-5 text-primary" />
                  <h3 className="text-base md:text-lg font-semibold text-foreground">
                    {selectedDay ? 
                      `Réservations du ${format(selectedDay, 'd MMMM yyyy', { locale: fr })}` : 
                      'Sélectionnez une date pour voir les détails'}
                  </h3>
                </div>
                
                {selectedDayContracts.length === 0 ? (
                  <Card className="bg-muted/30 border-dashed">
                    <CardContent className="py-8 md:py-12 text-center">
                      <Car className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
                      <p className="text-sm text-muted-foreground">
                        Aucune réservation pour cette date
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid gap-3 md:gap-4">
                    {selectedDayContracts.map((contract) => (
                      <Card 
                        key={contract.id}
                        className="cursor-pointer hover:shadow-lg transition-all border-primary/20 hover:border-primary/50 group"
                        onClick={() => navigate(`/locations/${contract.id}`)}
                      >
                        <CardContent className="p-4 md:p-5">
                          <div className="flex items-start justify-between gap-4 mb-3">
                            <div className="flex items-start gap-3 flex-1">
                              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                                <Car className="w-6 h-6 text-primary" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="font-bold text-base md:text-lg text-foreground group-hover:text-primary transition-colors">
                                  {contract.vehicles?.marque} {contract.vehicles?.modele}
                                </h4>
                                <div className="flex flex-wrap items-center gap-2 mt-1">
                                  <Badge variant="outline" className="text-xs font-mono">
                                    {contract.vehicles?.immatriculation}
                                  </Badge>
                                  <Badge variant="outline" className="text-xs">
                                    {contract.numero_contrat}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                            <Badge 
                              variant={
                                contract.statut === 'livre' ? 'default' : 
                                contract.statut === 'contrat_valide' ? 'secondary' : 
                                'outline'
                              }
                              className="text-xs whitespace-nowrap"
                            >
                              {contract.statut === 'livre' ? '🚗 En cours' : 
                               contract.statut === 'contrat_valide' ? '✓ Validé' : 
                               contract.statut}
                            </Badge>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <User className="w-4 h-4 text-primary" />
                              <span className="truncate">
                                {contract.clients?.nom} {contract.clients?.prenom}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <CalendarIcon className="w-4 h-4 text-primary" />
                              <span className="truncate">
                                {format(parseISO(contract.date_debut), 'dd/MM/yyyy')} → {format(parseISO(contract.date_fin), 'dd/MM/yyyy')}
                              </span>
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

      {/* Availability Check Dialog - Modern Style */}
      <Dialog open={showAvailabilityDialog} onOpenChange={setShowAvailabilityDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Search className="w-5 h-5 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-xl">Vérifier la disponibilité</DialogTitle>
                <DialogDescription className="text-sm">
                  Trouvez les véhicules disponibles pour votre période
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          
          <div className="space-y-5 mt-4">
            <Card className="bg-muted/30 border-primary/20">
              <CardContent className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="start-date" className="flex items-center gap-2 text-sm font-semibold">
                      <CalendarIcon className="w-4 h-4 text-primary" />
                      Date de début
                    </Label>
                    <Input
                      id="start-date"
                      type="date"
                      value={availabilityDates.start}
                      onChange={(e) => setAvailabilityDates({...availabilityDates, start: e.target.value})}
                      className="border-primary/30 focus:border-primary"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="end-date" className="flex items-center gap-2 text-sm font-semibold">
                      <CalendarIcon className="w-4 h-4 text-primary" />
                      Date de fin
                    </Label>
                    <Input
                      id="end-date"
                      type="date"
                      value={availabilityDates.end}
                      onChange={(e) => setAvailabilityDates({...availabilityDates, end: e.target.value})}
                      className="border-primary/30 focus:border-primary"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Button 
              onClick={checkAvailability}
              disabled={checkingAvailability}
              className="w-full h-11 text-base font-semibold"
            >
              {checkingAvailability ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
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
              <div className="space-y-3">
                <div className="flex items-center gap-2 p-3 bg-primary/10 rounded-lg border border-primary/20">
                  <CheckCircle2 className="w-5 h-5 text-primary" />
                  <span className="font-semibold text-primary">
                    {availableVehicles.length} véhicule{availableVehicles.length > 1 ? 's' : ''} disponible{availableVehicles.length > 1 ? 's' : ''}
                  </span>
                </div>
                
                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                  {availableVehicles.map((vehicle) => (
                    <Card 
                      key={vehicle.id}
                      className="cursor-pointer hover:shadow-lg transition-all border-primary/20 hover:border-primary/50 group"
                      onClick={() => {
                        setShowAvailabilityDialog(false);
                        navigate(`/vehicules/${vehicle.id}`);
                      }}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-3 flex-1">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center group-hover:scale-110 transition-transform">
                              <Car className="w-6 h-6 text-primary" />
                            </div>
                            <div className="flex-1">
                              <h4 className="font-bold text-base group-hover:text-primary transition-colors">
                                {vehicle.marque} {vehicle.modele}
                              </h4>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="outline" className="text-xs font-mono">
                                  {vehicle.immatriculation}
                                </Badge>
                                <Badge variant="outline" className="text-xs">
                                  Cat. {vehicle.categorie || 'A'}
                                </Badge>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-lg text-primary">
                              {vehicle.tarif_journalier} DH
                            </div>
                            <div className="text-xs text-muted-foreground">
                              par jour
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {!checkingAvailability && availableVehicles.length === 0 && availabilityDates.start && availabilityDates.end && (
              <Card className="bg-muted/30 border-dashed">
                <CardContent className="py-12 text-center">
                  <AlertCircle className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
                  <p className="text-sm text-muted-foreground">
                    Aucun véhicule disponible pour cette période
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Essayez d'autres dates
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
