import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Car, Calendar, Users, TrendingUp, AlertCircle, FileText } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
interface DashboardStats {
  vehiclesCount: number;
  reservationsCount: number;
  clientsCount: number;
  availableVehicles: number;
  rentedVehicles: number;
  maintenanceVehicles: number;
  outOfServiceVehicles: number;
  sinistresCount: number;
  sinistresOuvert: number;
  sinistresCoutTotal: number;
  topSinistredVehicles: Array<{id: string; immatriculation: string; count: number}>;
}
interface VehicleAlert {
  vehicleId: string;
  vehicleInfo: string;
  message: string;
  severity: 'critical' | 'warning' | 'high';
}
export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>({
    vehiclesCount: 0,
    reservationsCount: 0,
    clientsCount: 0,
    availableVehicles: 0,
    rentedVehicles: 0,
    maintenanceVehicles: 0,
    outOfServiceVehicles: 0,
    sinistresCount: 0,
    sinistresOuvert: 0,
    sinistresCoutTotal: 0,
    topSinistredVehicles: [],
  });
  const [recentReservations, setRecentReservations] = useState<any[]>([]);
  const [recentAssistance, setRecentAssistance] = useState<any[]>([]);
  const [departures, setDepartures] = useState<any[]>([]);
  const [returns, setReturns] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'departures' | 'returns'>('departures');
  const [loading, setLoading] = useState(true);
  const [vehicleAlerts, setVehicleAlerts] = useState<VehicleAlert[]>([]);
  const [showAlertsDialog, setShowAlertsDialog] = useState(false);
  const [chequeAlertsCount, setChequeAlertsCount] = useState(0);
  const [reservationAlertsCount, setReservationAlertsCount] = useState(0);
  const [reservationType, setReservationType] = useState<'standard' | 'assistance'>('standard');
  useEffect(() => {
    loadDashboardData();

    // Subscribe to real-time updates for contracts and assistance
    const contractsChannel = supabase
      .channel('dashboard-contracts-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'contracts'
        },
        () => {
          loadDeparturesAndReturns();
        }
      )
      .subscribe();

    const assistanceChannel = supabase
      .channel('dashboard-assistance-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'assistance'
        },
        () => {
          loadDeparturesAndReturns();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(contractsChannel);
      supabase.removeChannel(assistanceChannel);
    };
  }, []);

  const loadDeparturesAndReturns = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Load today's departures from contracts
      const { data: todayDepartures } = await supabase
        .from('contracts')
        .select(`
          *,
          clients (nom, prenom),
          vehicles (marque, modele, immatriculation)
        `)
        .eq('date_debut', today)
        .order('start_time', { ascending: true });

      // Load today's departures from assistance
      const { data: todayAssistanceDepartures } = await supabase
        .from('assistance')
        .select(`
          *,
          clients (nom, prenom),
          vehicles (marque, modele, immatriculation)
        `)
        .eq('date_debut', today);

      // Load today's returns from contracts
      const { data: todayReturns } = await supabase
        .from('contracts')
        .select(`
          *,
          clients (nom, prenom),
          vehicles (marque, modele, immatriculation)
        `)
        .eq('date_fin', today)
        .order('end_time', { ascending: true });

      // Load today's returns from assistance
      const { data: todayAssistanceReturns } = await supabase
        .from('assistance')
        .select(`
          *,
          clients (nom, prenom),
          vehicles (marque, modele, immatriculation)
        `)
        .eq('date_fin', today);

      // Load tomorrow's returns (J+1) from contracts
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];
      
      const { data: tomorrowReturns } = await supabase
        .from('contracts')
        .select(`
          *,
          clients (nom, prenom),
          vehicles (marque, modele, immatriculation)
        `)
        .eq('date_fin', tomorrowStr)
        .order('end_time', { ascending: true });

      // Load tomorrow's returns (J+1) from assistance
      const { data: tomorrowAssistanceReturns } = await supabase
        .from('assistance')
        .select(`
          *,
          clients (nom, prenom),
          vehicles (marque, modele, immatriculation)
        `)
        .eq('date_fin', tomorrowStr);

      // Combine departures (contracts + assistance)
      const allDepartures = [
        ...(todayDepartures || []).map(d => ({ ...d, type: 'contract' })),
        ...(todayAssistanceDepartures || []).map(d => ({ ...d, type: 'assistance' }))
      ];

      // Combine returns (today's + tomorrow's, contracts + assistance)
      const allReturns = [
        ...(todayReturns || []).map(r => ({ ...r, isJ1: false, type: 'contract' })),
        ...(todayAssistanceReturns || []).map(r => ({ ...r, isJ1: false, type: 'assistance' })),
        ...(tomorrowReturns || []).map(r => ({ ...r, isJ1: true, type: 'contract' })),
        ...(tomorrowAssistanceReturns || []).map(r => ({ ...r, isJ1: true, type: 'assistance' }))
      ];

      setDepartures(allDepartures);
      setReturns(allReturns);
    } catch (error) {
      console.error('Error loading departures and returns:', error);
    }
  };
  const loadDashboardData = async () => {
    try {
      // Load vehicles count
      const {
        count: vehiclesCount
      } = await supabase.from('vehicles').select('*', {
        count: 'exact',
        head: true
      });

      // Load all vehicles with related data for alerts
      const {
        data: vehicles
      } = await supabase.from('vehicles').select('*');
      const availableVehicles = vehicles?.filter(v => v.statut === 'disponible').length || 0;
      const rentedVehicles = vehicles?.filter(v => v.statut === 'loue').length || 0;
      const maintenanceVehicles = vehicles?.filter(v => v.statut === 'en_panne' || v.statut === 'reserve').length || 0;
      const outOfServiceVehicles = vehicles?.filter(v => v.en_service === false).length || 0;

      // Load contracts count
      const {
        count: reservationsCount
      } = await supabase.from('contracts').select('*', {
        count: 'exact',
        head: true
      });

      // Load clients count
      const {
        count: clientsCount
      } = await supabase.from('clients').select('*', {
        count: 'exact',
        head: true
      });

      // Load recent reservations (contracts)
      const {
        data: reservations
      } = await supabase.from('contracts').select(`
          *,
          clients (nom, prenom),
          vehicles (marque, modele, immatriculation)
        `).order('created_at', {
        ascending: false
      }).limit(4);

      // Load recent assistance
      const {
        data: assistance
      } = await supabase.from('assistance').select(`
          *,
          clients (nom, prenom),
          vehicles (marque, modele, immatriculation)
        `).order('created_at', {
        ascending: false
      }).limit(4);

      // Load sinistres stats
      const { data: sinistres } = await supabase.from('sinistres').select('*, vehicles(immatriculation)');
      const sinistresCount = sinistres?.length || 0;
      const sinistresOuvert = sinistres?.filter(s => s.statut === 'ouvert').length || 0;
      const sinistresCoutTotal = sinistres?.reduce((sum, s) => sum + (s.cout_estime || 0), 0) || 0;
      
      // Top 3 vehicles with most sinistres
      const vehicleSinistresCount: Record<string, { id: string; immatriculation: string; count: number }> = {};
      sinistres?.forEach(s => {
        if (s.vehicle_id && s.vehicles) {
          if (!vehicleSinistresCount[s.vehicle_id]) {
            vehicleSinistresCount[s.vehicle_id] = {
              id: s.vehicle_id,
              immatriculation: s.vehicles.immatriculation,
              count: 0
            };
          }
          vehicleSinistresCount[s.vehicle_id].count++;
        }
      });
      const topSinistredVehicles = Object.values(vehicleSinistresCount)
        .sort((a, b) => b.count - a.count)
        .slice(0, 3);

      setStats({
        vehiclesCount: vehiclesCount || 0,
        reservationsCount: reservationsCount || 0,
        clientsCount: clientsCount || 0,
        availableVehicles,
        rentedVehicles,
        maintenanceVehicles,
        outOfServiceVehicles,
        sinistresCount,
        sinistresOuvert,
        sinistresCoutTotal,
        topSinistredVehicles,
      });
      setRecentReservations(reservations || []);
      setRecentAssistance(assistance || []);

      // Load departures and returns (contracts + assistance)
      await loadDeparturesAndReturns();

      // Calculate alerts for all vehicles
      if (vehicles) {
        await calculateVehicleAlerts(vehicles);
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };
  const calculateVehicleAlerts = async (vehicles: any[]) => {
    const alerts: VehicleAlert[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    for (const vehicle of vehicles) {
      // Load insurance data
      const {
        data: insurances
      } = await supabase.from('vehicle_insurance').select('*').eq('vehicle_id', vehicle.id).order('date_debut', {
        ascending: false
      });

      // Load technical inspection data
      const {
        data: technicalInspections
      } = await supabase.from('vehicle_technical_inspection').select('*').eq('vehicle_id', vehicle.id).order('date_visite', {
        ascending: false
      });

      // Load vignette data
      const {
        data: vignettes
      } = await supabase.from('vehicle_vignette').select('*').eq('vehicle_id', vehicle.id).order('annee', {
        ascending: false
      });
      const vehicleInfo = `${vehicle.marque} ${vehicle.modele} (${vehicle.immatriculation})`;

      // Check insurance alerts
      if (!insurances || insurances.length === 0) {
        alerts.push({
          vehicleId: vehicle.id,
          vehicleInfo,
          message: "Véhicule sans assurance ajoutée.",
          severity: "high"
        });
      } else {
        const latestInsurance = insurances[0];
        if (latestInsurance?.date_expiration) {
          const expirationDate = new Date(latestInsurance.date_expiration);
          expirationDate.setHours(0, 0, 0, 0);
          const daysUntilExpiration = Math.ceil((expirationDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          if (expirationDate < today) {
            alerts.push({
              vehicleId: vehicle.id,
              vehicleInfo,
              message: `Assurance expirée depuis ${Math.abs(daysUntilExpiration)} jour(s).`,
              severity: "critical"
            });
          } else if (daysUntilExpiration <= 30) {
            alerts.push({
              vehicleId: vehicle.id,
              vehicleInfo,
              message: `Assurance expire dans ${daysUntilExpiration} jour(s).`,
              severity: "warning"
            });
          }
        }
      }

      // Check technical inspection alerts
      if (!technicalInspections || technicalInspections.length === 0) {
        alerts.push({
          vehicleId: vehicle.id,
          vehicleInfo,
          message: "Véhicule sans visite technique ajoutée.",
          severity: "high"
        });
      } else {
        const latestInspection = technicalInspections[0];
        if (latestInspection?.date_expiration) {
          const expirationDate = new Date(latestInspection.date_expiration);
          expirationDate.setHours(0, 0, 0, 0);
          const daysUntilExpiration = Math.ceil((expirationDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          if (expirationDate < today) {
            alerts.push({
              vehicleId: vehicle.id,
              vehicleInfo,
              message: `Visite technique expirée depuis ${Math.abs(daysUntilExpiration)} jour(s).`,
              severity: "critical"
            });
          } else if (daysUntilExpiration <= 30) {
            alerts.push({
              vehicleId: vehicle.id,
              vehicleInfo,
              message: `Visite technique expire dans ${daysUntilExpiration} jour(s).`,
              severity: "warning"
            });
          }
        }
      }

      // Check vignette alerts
      if (!vignettes || vignettes.length === 0) {
        alerts.push({
          vehicleId: vehicle.id,
          vehicleInfo,
          message: "Véhicule sans vignette ajoutée.",
          severity: "high"
        });
      } else {
        const latestVignette = vignettes[0];
        if (latestVignette?.date_expiration) {
          const expirationDate = new Date(latestVignette.date_expiration);
          expirationDate.setHours(0, 0, 0, 0);
          const daysUntilExpiration = Math.ceil((expirationDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          if (expirationDate < today) {
            alerts.push({
              vehicleId: vehicle.id,
              vehicleInfo,
              message: `Vignette expirée depuis ${Math.abs(daysUntilExpiration)} jour(s).`,
              severity: "critical"
            });
          } else if (daysUntilExpiration <= 30) {
            alerts.push({
              vehicleId: vehicle.id,
              vehicleInfo,
              message: `Vignette expire dans ${daysUntilExpiration} jour(s).`,
              severity: "warning"
            });
          }
        }
      }
    }
    setVehicleAlerts(alerts);

    // Count check alerts (chèques older than 30 days)
    const { data: payments } = await supabase
      .from("contract_payments")
      .select("id, date_paiement")
      .eq("methode", "cheque");

    if (payments) {
      const oldChecks = payments.filter((payment) => {
        const daysFromPayment = Math.ceil(
          (today.getTime() - new Date(payment.date_paiement).getTime()) / (1000 * 60 * 60 * 24)
        );
        return daysFromPayment > 30;
      });
      setChequeAlertsCount(oldChecks.length);
    }

    // Count reservation alerts (departures and returns today)
    const todayStr = new Date().toISOString().split("T")[0];
    
    const { data: departsToday } = await supabase
      .from("contracts")
      .select("id")
      .eq("date_debut", todayStr)
      .in("statut", ["contrat_valide", "brouillon"]);

    const { data: returnsToday } = await supabase
      .from("contracts")
      .select("id")
      .eq("date_fin", todayStr)
      .eq("statut", "livre");

    setReservationAlertsCount((departsToday?.length || 0) + (returnsToday?.length || 0));
  };
  const chartData = [{
    month: 'Août\n2025',
    revenus: 1500,
    charges: 200
  }, {
    month: 'Sept.\n2025',
    revenus: 4500,
    charges: 300
  }, {
    month: 'Oct.\n2025',
    revenus: 6000,
    charges: 400
  }];
  const totalAlerts = vehicleAlerts.length + chequeAlertsCount + reservationAlertsCount;
  const availablePercentage = stats.vehiclesCount > 0 ? (stats.availableVehicles / stats.vehiclesCount * 100).toFixed(2) : '0.00';

  // Group alerts by vehicle
  const groupedAlerts = vehicleAlerts.reduce((acc, alert) => {
    if (!acc[alert.vehicleId]) {
      acc[alert.vehicleId] = {
        vehicleInfo: alert.vehicleInfo,
        alerts: []
      };
    }
    acc[alert.vehicleId].alerts.push(alert);
    return acc;
  }, {} as Record<string, {
    vehicleInfo: string;
    alerts: VehicleAlert[];
  }>);
  return <div className="w-full">
      <div className="p-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card 
            className="border-l-4 border-l-primary shadow-sm hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => navigate('/vehicules')}
          >
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                    <Car className="w-4 h-4 text-primary" />
                    <span>VÉHICULES</span>
                  </div>
                  <p className="text-3xl font-bold text-foreground">
                    {stats.vehiclesCount.toString().padStart(2, '0')}
                  </p>
                </div>
                <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center">
                  <Car className="w-7 h-7 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card 
            className="border-l-4 border-l-primary shadow-sm hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => navigate('/locations')}
          >
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                    <Calendar className="w-4 h-4 text-primary" />
                    <span>RÉSERVATIONS</span>
                  </div>
                  <p className="text-3xl font-bold text-foreground">
                    {stats.reservationsCount.toString().padStart(2, '0')}
                  </p>
                </div>
                <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center">
                  <Calendar className="w-7 h-7 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card 
            className="border-l-4 border-l-primary shadow-sm hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => navigate('/clients')}
          >
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                    <Users className="w-4 h-4 text-primary" />
                    <span>CLIENTS</span>
                  </div>
                  <p className="text-3xl font-bold text-foreground">
                    {stats.clientsCount.toString().padStart(2, '0')}
                  </p>
                </div>
                <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center">
                  <Users className="w-7 h-7 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sinistres KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card 
            className="border-l-4 border-l-destructive shadow-sm hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => navigate('/sinistres')}
          >
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Sinistres totaux</p>
                  <p className="text-2xl font-bold text-foreground">{stats.sinistresCount}</p>
                </div>
                <div className="w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-destructive" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-orange-500 shadow-sm">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">En cours</p>
                  <p className="text-2xl font-bold text-foreground">{stats.sinistresOuvert}</p>
                </div>
                <div className="w-12 h-12 bg-orange-500/10 rounded-full flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-orange-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-primary shadow-sm">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Coût total estimé</p>
                  <p className="text-2xl font-bold text-foreground">{stats.sinistresCoutTotal.toFixed(2)} DH</p>
                </div>
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-secondary shadow-sm">
            <CardContent className="pt-6">
              <div>
                <p className="text-sm text-muted-foreground mb-2">Top véhicules touchés</p>
                {stats.topSinistredVehicles.length > 0 ? (
                  <div className="space-y-1">
                    {stats.topSinistredVehicles.map((v, i) => (
                      <p key={v.id} className="text-xs">
                        {i + 1}. {v.immatriculation} ({v.count})
                      </p>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Aucun</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Alerts and Fleet Status in one row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Left column: Alerts and Departures-Returns */}
          <div className="lg:col-span-2 space-y-6">
            {/* Alerts Section */}
            <Card className="border-l-4 border-l-warning shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-warning/10 rounded-full flex items-center justify-center">
                    <AlertCircle className="w-8 h-8 text-warning" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertCircle className="w-5 h-5 text-warning" />
                      <h3 className="text-xl font-semibold text-foreground">Alertes</h3>
                      <span className="ml-2 text-2xl font-bold text-warning">
                        {totalAlerts.toString().padStart(2, '0')}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-4 mt-3">
                      <div className="flex items-center space-x-2 cursor-pointer hover:opacity-80 transition-opacity" onClick={() => navigate("/alertes")}>
                        <span className={`w-3 h-3 rounded-full ${chequeAlertsCount > 0 ? 'bg-warning' : 'bg-success'}`}></span>
                        <span className={`text-sm text-foreground ${chequeAlertsCount > 0 ? 'underline' : ''}`}>
                          {chequeAlertsCount.toString().padStart(2, '0')} Alertes chèques
                        </span>
                      </div>
                      <div className="flex items-center space-x-2 cursor-pointer hover:opacity-80 transition-opacity" onClick={() => navigate("/alertes")}>
                        <span className={`w-3 h-3 rounded-full ${reservationAlertsCount > 0 ? 'bg-info' : 'bg-success'}`}></span>
                        <span className={`text-sm text-foreground ${reservationAlertsCount > 0 ? 'underline' : ''}`}>
                          {reservationAlertsCount.toString().padStart(2, '0')} Alertes réservations
                        </span>
                      </div>
                      <div className="flex items-center space-x-2 cursor-pointer hover:opacity-80 transition-opacity" onClick={() => setShowAlertsDialog(true)}>
                        <span className={`w-3 h-3 rounded-full ${vehicleAlerts.length > 0 ? 'bg-warning' : 'bg-success'}`}></span>
                        <span className={`text-sm text-foreground ${vehicleAlerts.length > 0 ? 'underline' : ''}`}>
                          {vehicleAlerts.length.toString().padStart(2, '0')} Alertes véhicules
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Departures - Returns Section */}
            <Card className="border-l-4 border-l-primary shadow-sm hover:shadow-md transition-shadow">
          <CardHeader>
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-5 h-5 text-primary" />
              <CardTitle>Départs - Récupérations</CardTitle>
            </div>
            <CardDescription>Vos départs et retours prévus pour aujourd'hui</CardDescription>
            <div className="flex space-x-8 mt-4">
              <button onClick={() => setActiveTab('departures')} className={`pb-2 ${activeTab === 'departures' ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground hover:text-foreground'}`}>
                <span className="text-sm font-medium">{departures.length.toString().padStart(2, '0')} Départs</span>
              </button>
              <button onClick={() => setActiveTab('returns')} className={`pb-2 ${activeTab === 'returns' ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground hover:text-foreground'}`}>
                <span className="text-sm font-medium">{returns.length.toString().padStart(2, '0')} Récupérations</span>
              </button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-sm text-muted-foreground border-b">
                    <th className="pb-3 font-medium">Rés. N°</th>
                    <th className="pb-3 font-medium">Véhicule</th>
                    <th className="pb-3 font-medium">Locataire</th>
                  </tr>
                </thead>
                <tbody>
                  {(activeTab === 'departures' ? departures : returns).length === 0 ? <tr>
                      <td colSpan={3} className="text-center py-12">
                        <div className="flex flex-col items-center">
                          <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center mb-4">
                            <Calendar className="w-8 h-8 text-muted-foreground" />
                          </div>
                          <p className="text-muted-foreground">Aucun résultat</p>
                        </div>
                      </td>
                    </tr> : (activeTab === 'departures' ? departures : returns).map(item => <tr key={item.id} className="border-b last:border-0 hover:bg-muted/50">
                        <td className="py-4 font-medium text-foreground">
                          <div className="flex items-center gap-2">
                            {item.type === 'contract' ? item.numero_contrat : item.num_dossier}
                            {item.type === 'assistance' && (
                              <Badge variant="outline" className="bg-warning/10 text-warning border-warning text-xs">
                                ASS
                              </Badge>
                            )}
                            {activeTab === 'returns' && item.isJ1 && (
                              <Badge variant="outline" className="bg-info/10 text-info border-info text-xs">
                                J+1
                              </Badge>
                            )}
                          </div>
                        </td>
                        <td className="py-4 text-foreground">
                          {item.vehicles?.marque} {item.vehicles?.modele}
                          <div className="text-xs text-muted-foreground">{item.vehicles?.immatriculation}</div>
                        </td>
                        <td className="py-4 text-foreground">
                          {item.clients?.nom} {item.clients?.prenom}
                        </td>
                      </tr>)}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
          </div>

          {/* Fleet Status */}
          <Card className="border-l-4 border-l-primary shadow-sm hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Car className="w-5 h-5 text-primary" />
                <div>
                  <CardTitle>État du parc</CardTitle>
                  <CardDescription>État d'aujourd'hui</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center mb-6">
                <div className="relative w-48 h-48">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    {/* Background circle */}
                    <circle cx="50" cy="50" r="40" stroke="hsl(var(--muted))" strokeWidth="8" fill="none" />
                    
                    {/* Available vehicles (green) */}
                    <circle 
                      cx="50" 
                      cy="50" 
                      r="40" 
                      stroke="hsl(var(--success))" 
                      strokeWidth="8" 
                      fill="none" 
                      strokeDasharray="251.2" 
                      strokeDashoffset={stats.vehiclesCount > 0 ? 251.2 - (251.2 * stats.availableVehicles / stats.vehiclesCount) : 251.2} 
                    />
                    
                    {/* Rented vehicles (primary) */}
                    <circle 
                      cx="50" 
                      cy="50" 
                      r="40" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth="8" 
                      fill="none" 
                      strokeDasharray="251.2" 
                      strokeDashoffset={stats.vehiclesCount > 0 ? 251.2 - (251.2 * (stats.availableVehicles + stats.rentedVehicles) / stats.vehiclesCount) : 251.2} 
                    />
                    
                    {/* Maintenance vehicles (warning) */}
                    <circle 
                      cx="50" 
                      cy="50" 
                      r="40" 
                      stroke="hsl(var(--warning))" 
                      strokeWidth="8" 
                      fill="none" 
                      strokeDasharray="251.2" 
                      strokeDashoffset={stats.vehiclesCount > 0 ? 251.2 - (251.2 * (stats.availableVehicles + stats.rentedVehicles + stats.maintenanceVehicles) / stats.vehiclesCount) : 251.2} 
                    />
                    
                    {/* Out of service vehicles (destructive) */}
                    <circle 
                      cx="50" 
                      cy="50" 
                      r="40" 
                      stroke="hsl(var(--destructive))" 
                      strokeWidth="8" 
                      fill="none" 
                      strokeDasharray="251.2" 
                      strokeDashoffset={stats.vehiclesCount > 0 ? 251.2 - (251.2 * (stats.availableVehicles + stats.rentedVehicles + stats.maintenanceVehicles + stats.outOfServiceVehicles) / stats.vehiclesCount) : 251.2} 
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <p className="text-3xl font-bold text-foreground">
                        {stats.vehiclesCount.toString().padStart(2, '0')}
                      </p>
                      <p className="text-sm text-muted-foreground">Véhicules</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="w-3 h-3 rounded-full bg-success"></span>
                    <span className="text-sm text-foreground">Disponibles</span>
                  </div>
                  <span className="text-sm font-medium text-foreground">
                    {stats.availableVehicles} ({stats.vehiclesCount > 0 ? ((stats.availableVehicles / stats.vehiclesCount) * 100).toFixed(0) : 0}%)
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="w-3 h-3 rounded-full bg-primary"></span>
                    <span className="text-sm text-foreground">En circulation</span>
                  </div>
                  <span className="text-sm font-medium text-foreground">
                    {stats.rentedVehicles} ({stats.vehiclesCount > 0 ? ((stats.rentedVehicles / stats.vehiclesCount) * 100).toFixed(0) : 0}%)
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="w-3 h-3 rounded-full bg-warning"></span>
                    <span className="text-sm text-foreground">Maintenance</span>
                  </div>
                  <span className="text-sm font-medium text-foreground">
                    {stats.maintenanceVehicles} ({stats.vehiclesCount > 0 ? ((stats.maintenanceVehicles / stats.vehiclesCount) * 100).toFixed(0) : 0}%)
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="w-3 h-3 rounded-full bg-destructive"></span>
                    <span className="text-sm text-foreground">Hors service</span>
                  </div>
                  <span className="text-sm font-medium text-foreground">
                    {stats.outOfServiceVehicles} ({stats.vehiclesCount > 0 ? ((stats.outOfServiceVehicles / stats.vehiclesCount) * 100).toFixed(0) : 0}%)
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Volume de transactions - Full Width */}
        <Card className="mb-6 border-l-4 border-l-primary shadow-sm hover:shadow-md transition-shadow">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  <CardTitle>Volume de transactions</CardTitle>
                </div>
                <CardDescription>Basé sur l'année sélectionnée</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" className="text-primary border-b-2 border-primary">
                  2025
                </Button>
                <Button variant="ghost" size="sm" className="text-muted-foreground">
                  2024
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{
                fontSize: 12
              }} />
                <YAxis tick={{
                fontSize: 12
              }} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="revenus" stroke="hsl(var(--success))" strokeWidth={2} name="Revenus" dot={{
                fill: 'hsl(var(--success))',
                r: 4
              }} />
                <Line type="monotone" dataKey="charges" stroke="hsl(var(--primary))" strokeWidth={2} name="Charges" dot={{
                fill: 'hsl(var(--primary))',
                r: 4
              }} />
              </LineChart>
            </ResponsiveContainer>
            <div className="text-center mt-4">
              <Link to="/statistiques" className="text-primary hover:underline text-sm">
                Page de statistiques →
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Recent Reservations - Full Width */}
        <Card className="border-l-4 border-l-primary shadow-sm hover:shadow-md transition-shadow">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="w-5 h-5 text-primary" />
                  <CardTitle>Les dernières réservations</CardTitle>
                </div>
                <CardDescription>Basé sur le type sélectionné</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className={reservationType === 'standard' ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground'}
                  onClick={() => setReservationType('standard')}
                >
                  Standard
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className={reservationType === 'assistance' ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground'}
                  onClick={() => setReservationType('assistance')}
                >
                  Assurances
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-muted-foreground border-b">
                    <th className="pb-3 font-medium">Rés. N°</th>
                    <th className="pb-3 font-medium">État</th>
                    <th className="pb-3 font-medium">Véhicule</th>
                    <th className="pb-3 font-medium">Locataire</th>
                    <th className="pb-3 font-medium">Durée</th>
                    <th className="pb-3 font-medium">Date départ</th>
                    <th className="pb-3 font-medium">Date retour</th>
                    <th className="pb-3 font-medium">Total</th>
                    <th className="pb-3 font-medium">Solde</th>
                    <th className="pb-3 font-medium">Prix/Jr</th>
                  </tr>
                </thead>
                <tbody>
                  {(reservationType === 'standard' ? recentReservations : recentAssistance).length === 0 ? <tr>
                      <td colSpan={10} className="text-center py-8 text-muted-foreground">
                        Aucune réservation
                      </td>
                    </tr> : (reservationType === 'standard' ? recentReservations : recentAssistance).map(reservation => <tr key={reservation.id} className="border-b hover:bg-muted/50">
                        <td className="py-4">{reservationType === 'standard' ? reservation.numero_contrat : reservation.num_dossier || 'N/A'}</td>
                        <td className="py-4">
                          <Badge variant="secondary" className={reservation.statut === 'actif' || reservation.etat === 'livre' ? 'bg-primary/10 text-primary border-primary/20' : (reservation.statut === 'termine' || reservation.etat === 'cloture') ? 'bg-muted text-muted-foreground border-muted' : 'bg-warning/10 text-warning border-warning/20'}>
                            {reservationType === 'standard' 
                              ? (reservation.statut === 'actif' ? 'Livrée' : reservation.statut)
                              : (reservation.etat === 'livre' ? 'Livrée' : reservation.etat)
                            }
                          </Badge>
                        </td>
                        <td className="py-4">
                          <div className="flex items-center gap-2">
                            <Car className="w-4 h-4 text-muted-foreground" />
                            <span>
                              {reservation.vehicles?.marque} - {reservation.vehicles?.modele}
                            </span>
                          </div>
                        </td>
                        <td className="py-4">
                          {reservation.clients?.nom} {reservation.clients?.prenom}
                        </td>
                        <td className="py-4">
                          {reservationType === 'standard' 
                            ? `${reservation.duration || 0} Jrs`
                            : `${reservation.date_debut && reservation.date_fin 
                                ? Math.ceil((new Date(reservation.date_fin).getTime() - new Date(reservation.date_debut).getTime()) / (1000 * 60 * 60 * 24))
                                : 0} Jrs`
                          }
                        </td>
                        <td className="py-4">
                          {new Date(reservation.date_debut).toLocaleDateString('fr-FR')}
                        </td>
                        <td className="py-4">
                          {reservation.date_fin ? new Date(reservation.date_fin).toLocaleDateString('fr-FR') : 'N/A'}
                        </td>
                        <td className="py-4">
                          {reservationType === 'standard' 
                            ? `${reservation.total_amount?.toFixed(2) || 0} DH`
                            : `${reservation.montant_total?.toFixed(2) || 0} DH`
                          }
                        </td>
                        <td className="py-4">
                          <span className={
                            reservationType === 'standard'
                              ? ((reservation.remaining_amount || 0) > 0 ? 'text-red-600' : 'text-green-600')
                              : ((reservation.montant_total || 0) - (reservation.montant_paye || 0) > 0 ? 'text-red-600' : 'text-green-600')
                          }>
                            {reservationType === 'standard' 
                              ? `${(reservation.remaining_amount || 0) > 0 ? '-' : '+'}${Math.abs(reservation.remaining_amount || 0).toFixed(2)} DH`
                              : `${((reservation.montant_total || 0) - (reservation.montant_paye || 0)) > 0 ? '-' : '+'}${Math.abs((reservation.montant_total || 0) - (reservation.montant_paye || 0)).toFixed(2)} DH`
                            }
                          </span>
                        </td>
                        <td className="py-4">
                          {reservationType === 'standard'
                            ? `${reservation.daily_rate?.toFixed(2) || 0} DH`
                            : `${reservation.tarif_journalier?.toFixed(2) || 0} DH`
                          }
                        </td>
                      </tr>)}
                </tbody>
              </table>
            </div>
            <div className="text-center mt-4">
              <Link to={reservationType === 'standard' ? '/locations' : '/assistance'} className="text-primary hover:underline text-sm">
                Afficher toutes les {reservationType === 'standard' ? 'réservations' : 'assistances'} →
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Vehicle Alerts Dialog */}
      <Dialog open={showAlertsDialog} onOpenChange={setShowAlertsDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-warning">
              <AlertCircle className="w-5 h-5" />
              {vehicleAlerts.length.toString().padStart(2, '0')} alertes véhicules
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6 mt-4">
            {Object.entries(groupedAlerts).map(([vehicleId, {
            vehicleInfo,
            alerts
          }]) => <div key={vehicleId} className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg cursor-pointer hover:bg-muted transition-colors" onClick={() => {
              setShowAlertsDialog(false);
              navigate(`/vehicules/${vehicleId}`);
            }}>
                  <div className="flex items-center gap-3">
                    <Car className="w-5 h-5 text-primary" />
                    <h3 className="font-semibold text-foreground">{vehicleInfo}</h3>
                  </div>
                  <Badge variant="outline" className="bg-warning/10 text-warning border-warning">
                    {alerts.length} alerte{alerts.length > 1 ? 's' : ''}
                  </Badge>
                </div>
                <div className="pl-8 space-y-2">
                  {alerts.map((alert, index) => <Alert key={index} className={`border-l-4 ${alert.severity === 'critical' ? 'border-l-destructive bg-destructive/5' : alert.severity === 'high' ? 'border-l-warning bg-warning/5' : 'border-l-warning bg-warning/5'}`}>
                      <AlertCircle className={`h-4 w-4 ${alert.severity === 'critical' ? 'text-destructive' : 'text-warning'}`} />
                      <AlertDescription className="text-sm">
                        {alert.message}
                      </AlertDescription>
                    </Alert>)}
                </div>
              </div>)}
          </div>
        </DialogContent>
      </Dialog>
    </div>;
}