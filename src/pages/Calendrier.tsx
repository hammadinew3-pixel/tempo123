import { ChevronLeft, ChevronRight, Plus, Search, Car, ArrowRight, Calendar as CalendarIcon, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format, isSameDay, isWithinInterval, parseISO, differenceInDays, startOfDay } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";

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
  duration?: number;
  daily_rate?: number;
  total_amount?: number;
  start_time?: string;
  end_time?: string;
  delivery_km?: number;
  return_km?: number;
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
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [showContractDetails, setShowContractDetails] = useState(false);
  const [rangeStartDate, setRangeStartDate] = useState<Date | null>(null);
  const [rangeEndDate, setRangeEndDate] = useState<Date | null>(null);
  const [availStartOpen, setAvailStartOpen] = useState(false);
  const [availEndOpen, setAvailEndOpen] = useState(false);

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

  const checkAvailability = async (startDate?: string, endDate?: string) => {
    const start = startDate || availabilityDates.start;
    const end = endDate || availabilityDates.end;

    if (!start || !end) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner les dates",
        variant: "destructive"
      });
      return;
    }

    setCheckingAvailability(true);
    setShowAvailabilityDialog(true);
    
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
        .lte('date_debut', end)
        .gte('date_fin', start)
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

  const handleDayClick = (day: number) => {
    const clickedDate = new Date(currentYear, currentMonth, day);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Don't allow selecting dates in the past
    if (clickedDate < today) {
      toast({
        title: "Date invalide",
        description: "Impossible de sélectionner une date passée",
        variant: "destructive"
      });
      return;
    }
    
    // If no range start, set it
    if (!rangeStartDate) {
      setRangeStartDate(clickedDate);
      setRangeEndDate(null);
      setSelectedDay(clickedDate);
      return;
    }
    
    // If we have a start date, set end date and trigger search
    if (rangeStartDate && !rangeEndDate) {
      // Ensure end is after start
      if (clickedDate < rangeStartDate) {
        setRangeStartDate(clickedDate);
        setRangeEndDate(rangeStartDate);
      } else {
        setRangeEndDate(clickedDate);
      }
      
      const start = clickedDate < rangeStartDate ? clickedDate : rangeStartDate;
      const end = clickedDate < rangeStartDate ? rangeStartDate : clickedDate;
      
      const startStr = format(start, 'yyyy-MM-dd');
      const endStr = format(end, 'yyyy-MM-dd');
      
      setAvailabilityDates({
        start: startStr,
        end: endStr
      });
      
      // Automatically trigger availability check
      checkAvailability(startStr, endStr);
      
      return;
    }
    
    // If both dates are set, reset and start over
    if (rangeStartDate && rangeEndDate) {
      setRangeStartDate(clickedDate);
      setRangeEndDate(null);
      setSelectedDay(clickedDate);
    }
  };

  const getContractsForDay = (day: number) => {
    const date = new Date(currentYear, currentMonth, day);
    date.setHours(0, 0, 0, 0);
    
    return contracts.filter(contract => {
      const [startYear, startMonth, startDay] = contract.date_debut.split('-').map(Number);
      const [endYear, endMonth, endDay] = contract.date_fin.split('-').map(Number);
      const start = new Date(startYear, startMonth - 1, startDay);
      const end = new Date(endYear, endMonth - 1, endDay);
      start.setHours(0, 0, 0, 0);
      end.setHours(0, 0, 0, 0);
      
      return date >= start && date <= end;
    });
  };

  // Calculate contract bars for continuous display
  const getContractBars = () => {
    const bars: Array<{
      contract: Contract;
      startCol: number;
      width: number;
      row: number;
    }> = [];

    const monthStart = new Date(currentYear, currentMonth, 1);
    const monthEnd = new Date(currentYear, currentMonth + 1, 0);

    contracts.forEach((contract) => {
      const [cStartYear, cStartMonth, cStartDay] = contract.date_debut.split('-').map(Number);
      const [cEndYear, cEndMonth, cEndDay] = contract.date_fin.split('-').map(Number);
      const contractStart = new Date(cStartYear, cStartMonth - 1, cStartDay);
      const contractEnd = new Date(cEndYear, cEndMonth - 1, cEndDay);
      contractStart.setHours(0, 0, 0, 0);
      contractEnd.setHours(0, 0, 0, 0);

      // Skip if contract doesn't overlap with current month
      if (contractEnd < monthStart || contractStart > monthEnd) return;

      // Calculate start position (which day of month, accounting for firstDayOfMonth offset)
      const displayStart = contractStart < monthStart ? monthStart : contractStart;
      const displayEnd = contractEnd > monthEnd ? monthEnd : contractEnd;
      
      const barStartDay = displayStart.getDate();
      const barEndDay = displayEnd.getDate();
      const duration = barEndDay - barStartDay + 1;

      // Calculate column position using actual grid index to avoid offset errors
      const cellIndex = days.findIndex((d) => d === barStartDay);
      const startCol = cellIndex >= 0 ? cellIndex : (firstDayOfMonth + barStartDay - 1);
      
      // Find available row for this contract
      let row = 0;
      const conflictingBars = bars.filter(bar => {
        const barEndCol = bar.startCol + bar.width - 1;
        const thisEndCol = startCol + duration - 1;
        return !(barEndCol < startCol || bar.startCol > thisEndCol);
      });
      
      if (conflictingBars.length > 0) {
        const usedRows = new Set(conflictingBars.map(b => b.row));
        while (usedRows.has(row)) row++;
      }

      bars.push({
        contract,
        startCol,
        width: duration,
        row
      });
    });

    return bars;
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

  // Calculate contract bars after firstDayOfMonth is defined
  const contractBars = getContractBars();

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
              <div className="relative">
                {/* Calendar grid */}
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
                    const dayDate = day ? new Date(currentYear, currentMonth, day) : null;
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    const isPast = dayDate && dayDate < today;
                    
                    const isToday = day === new Date().getDate() && 
                                    currentMonth === new Date().getMonth() && 
                                    currentYear === new Date().getFullYear();
                    
                    const isRangeStart = dayDate && rangeStartDate && 
                                        dayDate.getTime() === rangeStartDate.getTime();
                    const isRangeEnd = dayDate && rangeEndDate && 
                                      dayDate.getTime() === rangeEndDate.getTime();
                    const isInRange = dayDate && rangeStartDate && rangeEndDate &&
                                     dayDate > rangeStartDate && dayDate < rangeEndDate;
                    
                    return (
                      <div
                        key={index}
                        className={`
                          min-h-[80px] md:min-h-[100px] p-1 md:p-2 border rounded-lg transition-colors
                          ${day ? (isPast ? 'bg-muted/50 cursor-not-allowed opacity-50' : 'bg-card hover:bg-muted cursor-pointer') : 'bg-transparent border-transparent'}
                          ${isToday ? 'border-primary bg-primary/10' : 'border-border'}
                          ${isRangeStart || isRangeEnd ? 'bg-primary/20 border-primary' : ''}
                          ${isInRange ? 'bg-primary/10' : ''}
                        `}
                        onClick={() => day && !isPast && handleDayClick(day)}
                      >
                        {day && (
                          <div className={`text-xs md:text-sm font-medium ${isPast ? 'text-muted-foreground' : 'text-foreground'}`}>
                            {day}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Contract bars overlay */}
                <div className="absolute top-[70px] md:top-[80px] left-0 right-0 pointer-events-none">
                  <div className="grid grid-cols-7 gap-1 md:gap-2">
                    {contractBars.map((bar, idx) => {
                      const rowOffset = bar.row * 32; // 32px per row for spacing
                      const colIndex = bar.startCol % 7;
                      const weekRow = Math.floor(bar.startCol / 7);
                      
                      return (
                        <div
                          key={`${bar.contract.id}-${idx}`}
                          className="pointer-events-auto cursor-pointer mb-1"
                          style={{
                            gridColumn: `${colIndex + 1} / span ${Math.min(bar.width, 7 - colIndex)}`,
                            gridRow: weekRow + 1,
                            marginTop: `${rowOffset + 5}px`,
                            zIndex: 10 + bar.row
                          }}
                          onClick={() => {
                            setSelectedContract(bar.contract);
                            setShowContractDetails(true);
                          }}
                        >
                          <div className="bg-red-500/50 text-red-900 rounded px-2 py-1 text-[10px] md:text-xs font-medium border border-red-300 hover:bg-red-500/60 transition-colors">
                            <div className="truncate">
                              {bar.contract.vehicles?.immatriculation} - Rés. {bar.contract.numero_contrat} - {bar.contract.clients?.nom} {bar.contract.clients?.prenom} - {bar.contract.vehicles?.marque} {bar.contract.vehicles?.modele}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
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
              <div className="space-y-2">
                <Label>Date de début</Label>
                <Popover open={availStartOpen} onOpenChange={setAvailStartOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal h-12",
                        !availabilityDates.start && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {availabilityDates.start ? (
                        format(new Date(availabilityDates.start), "dd/MM/yyyy", { locale: fr })
                      ) : (
                        <span>Sélectionner une date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={availabilityDates.start ? new Date(availabilityDates.start) : undefined}
                      onSelect={(date) => {
                        if (date) {
                          setAvailabilityDates({
                            ...availabilityDates, 
                            start: format(date, 'yyyy-MM-dd')
                          });
                          setAvailStartOpen(false);
                        }
                      }}
                      disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label>Date de fin</Label>
                <Popover open={availEndOpen} onOpenChange={setAvailEndOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal h-12",
                        !availabilityDates.end && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {availabilityDates.end ? (
                        format(new Date(availabilityDates.end), "dd/MM/yyyy", { locale: fr })
                      ) : (
                        <span>Sélectionner une date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={availabilityDates.end ? new Date(availabilityDates.end) : undefined}
                      onSelect={(date) => {
                        if (date) {
                          const endDate = format(date, 'yyyy-MM-dd');
                          setAvailabilityDates({
                            ...availabilityDates, 
                            end: endDate
                          });
                          setAvailEndOpen(false);
                          // Lancer automatiquement la vérification si date de début existe
                          if (availabilityDates.start) {
                            checkAvailability(availabilityDates.start, endDate);
                          }
                        }
                      }}
                      disabled={(date) => {
                        const today = new Date(new Date().setHours(0, 0, 0, 0));
                        const startDate = availabilityDates.start ? new Date(availabilityDates.start) : today;
                        return date < today || date < startDate;
                      }}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <Button 
              onClick={() => checkAvailability()}
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

      {/* Contract Details Sheet */}
      <Sheet open={showContractDetails} onOpenChange={setShowContractDetails}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          {selectedContract && (
            <>
              <SheetHeader>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground uppercase tracking-wide">
                    Location Courte Durée
                  </p>
                  <SheetTitle className="text-xl">
                    Rés. {selectedContract.numero_contrat} par {selectedContract.clients?.nom} {selectedContract.clients?.prenom}
                  </SheetTitle>
                </div>
              </SheetHeader>

              <div className="mt-6 space-y-4">
                {/* État */}
                <div className="flex items-center justify-between py-3 border-b">
                  <span className="text-sm text-muted-foreground">État</span>
                  <Badge 
                    variant={selectedContract.statut === 'livre' ? 'default' : 'secondary'}
                    className="text-sm"
                  >
                    {selectedContract.statut === 'livre' ? 'Livrée' : 
                     selectedContract.statut === 'contrat_valide' ? 'Validé' : 
                     selectedContract.statut}
                  </Badge>
                </div>

                {/* Client */}
                <div className="flex items-center justify-between py-3 border-b">
                  <span className="text-sm text-muted-foreground">Client</span>
                  <span className="text-sm font-medium">
                    {selectedContract.clients?.nom} {selectedContract.clients?.prenom}
                  </span>
                </div>

                {/* Véhicule */}
                <div className="flex items-center justify-between py-3 border-b">
                  <span className="text-sm text-muted-foreground">Véhicule</span>
                  <div className="flex items-center gap-2">
                    <Car className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium">
                      {selectedContract.vehicles?.marque} - {selectedContract.vehicles?.modele} - {selectedContract.vehicles?.immatriculation}
                    </span>
                  </div>
                </div>

                {/* Date de départ */}
                <div className="flex items-center justify-between py-3 border-b">
                  <span className="text-sm text-muted-foreground">Date de départ</span>
                  <span className="text-sm font-medium">
                    {format(parseISO(selectedContract.date_debut), 'dd/MM/yyyy', { locale: fr })}
                    {selectedContract.start_time && ` ${selectedContract.start_time}`}
                  </span>
                </div>

                {/* Date de retour */}
                <div className="flex items-center justify-between py-3 border-b">
                  <span className="text-sm text-muted-foreground">Date de retour</span>
                  <span className="text-sm font-medium">
                    {format(parseISO(selectedContract.date_fin), 'dd/MM/yyyy', { locale: fr })}
                    {selectedContract.end_time && ` ${selectedContract.end_time}`}
                  </span>
                </div>

                {/* Durée */}
                {selectedContract.duration && (
                  <div className="flex items-center justify-between py-3 border-b">
                    <span className="text-sm text-muted-foreground">Durée</span>
                    <span className="text-sm font-medium">
                      {selectedContract.duration} Jour{selectedContract.duration > 1 ? 's' : ''}
                    </span>
                  </div>
                )}

                {/* Prix/Jr */}
                {selectedContract.daily_rate && (
                  <div className="flex items-center justify-between py-3 border-b">
                    <span className="text-sm text-muted-foreground">Prix/Jr</span>
                    <span className="text-sm font-medium">
                      {selectedContract.daily_rate.toFixed(2)} Dh
                    </span>
                  </div>
                )}

                {/* Total à payer */}
                {selectedContract.total_amount && (
                  <div className="flex items-center justify-between py-3 border-b">
                    <span className="text-sm text-muted-foreground">Total à payer</span>
                    <span className="text-sm font-medium">
                      {selectedContract.total_amount.toFixed(2)} Dh
                    </span>
                  </div>
                )}

                {/* Kilométrage */}
                {(selectedContract.delivery_km || selectedContract.return_km) && (
                  <div className="flex items-center justify-between py-3 border-b">
                    <span className="text-sm text-muted-foreground">Kilométrage</span>
                    <span className="text-sm font-medium">
                      {selectedContract.delivery_km || '—'} / {selectedContract.return_km || '—'} Kms
                    </span>
                  </div>
                )}

                {/* Button to view full details */}
                <Button 
                  className="w-full mt-6"
                  onClick={() => {
                    setShowContractDetails(false);
                    navigate(`/locations/${selectedContract.id}`);
                  }}
                >
                  Page de réservation
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
