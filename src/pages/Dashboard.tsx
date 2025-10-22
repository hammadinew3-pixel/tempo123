import { useEffect, useState, useCallback, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Car, Calendar, Users, TrendingUp, FileText, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useTenantPlan } from "@/hooks/useTenantPlan";
interface DashboardStats {
  vehiclesCount: number;
  reservationsCount: number;
  clientsCount: number;
  availableVehicles: number;
  rentedVehicles: number;
  maintenanceVehicles: number;
  immobilizedVehicles: number;
  outOfServiceVehicles: number;
  sinistresTotal: number;
  sinistresOuverts: number;
  sinistresEnCours: number;
  sinistresClos: number;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const {
    hasModuleAccess
  } = useTenantPlan();
  const [lastDashboardLoad, setLastDashboardLoad] = useState<Date | null>(null);
  const DASHBOARD_CACHE = 30 * 1000; // 30 secondes de cache
  
  const [stats, setStats] = useState<DashboardStats>({
    vehiclesCount: 0,
    reservationsCount: 0,
    clientsCount: 0,
    availableVehicles: 0,
    rentedVehicles: 0,
    maintenanceVehicles: 0,
    immobilizedVehicles: 0,
    outOfServiceVehicles: 0,
    sinistresTotal: 0,
    sinistresOuverts: 0,
    sinistresEnCours: 0,
    sinistresClos: 0
  });
  const [recentReservations, setRecentReservations] = useState<any[]>([]);
  const [recentAssistance, setRecentAssistance] = useState<any[]>([]);
  const [departures, setDepartures] = useState<any[]>([]);
  const [returns, setReturns] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'departures' | 'returns'>('departures');
  const [loading, setLoading] = useState(true);
  const [reservationType, setReservationType] = useState<'standard' | 'assistance'>('standard');

  // Debounce timer for realtime updates
  const debounceTimerRef = useRef<NodeJS.Timeout>();
  const debouncedLoadDeparturesAndReturns = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => {
      loadDeparturesAndReturns();
    }, 5000); // Augmentation du debounce à 5 secondes
  }, []);
  useEffect(() => {
    loadDashboardData();

    // Subscribe to real-time updates for contracts with debounce
    const contractsChannel = supabase.channel('dashboard-contracts-changes').on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'contracts'
    }, () => {
      debouncedLoadDeparturesAndReturns();
    }).subscribe();

    // Subscribe to assistance ONLY if module is accessible with debounce
    let assistanceChannel;
    if (hasModuleAccess('assistance')) {
      assistanceChannel = supabase.channel('dashboard-assistance-changes').on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'assistance'
      }, () => {
        debouncedLoadDeparturesAndReturns();
      }).subscribe();
    }
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      supabase.removeChannel(contractsChannel);
      if (assistanceChannel) {
        supabase.removeChannel(assistanceChannel);
      }
    };
  }, [hasModuleAccess, debouncedLoadDeparturesAndReturns]);
  const loadDeparturesAndReturns = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];

      // Load today's departures from contracts
      const {
        data: todayDepartures
      } = await supabase.from('contracts').select(`
          *,
          clients (nom, prenom),
          vehicles (marque, modele, immatriculation)
        `).eq('date_debut', today).order('start_time', {
        ascending: true
      });

      // Load today's departures from assistance ONLY if module is accessible
      let todayAssistanceDepartures = [];
      if (hasModuleAccess('assistance')) {
        const {
          data
        } = await supabase.from('assistance').select(`
            *,
            clients (nom, prenom),
            vehicles (marque, modele, immatriculation)
          `).eq('date_debut', today);
        todayAssistanceDepartures = data || [];
      }

      // Load today's returns from contracts
      const {
        data: todayReturns
      } = await supabase.from('contracts').select(`
          *,
          clients (nom, prenom),
          vehicles (marque, modele, immatriculation)
        `).eq('date_fin', today).order('end_time', {
        ascending: true
      });

      // Load today's returns from assistance ONLY if module is accessible
      let todayAssistanceReturns = [];
      if (hasModuleAccess('assistance')) {
        const {
          data
        } = await supabase.from('assistance').select(`
            *,
            clients (nom, prenom),
            vehicles (marque, modele, immatriculation)
          `).eq('date_fin', today);
        todayAssistanceReturns = data || [];
      }

      // Load tomorrow's returns (J+1) from contracts
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];
      const {
        data: tomorrowReturns
      } = await supabase.from('contracts').select(`
          *,
          clients (nom, prenom),
          vehicles (marque, modele, immatriculation)
        `).eq('date_fin', tomorrowStr).order('end_time', {
        ascending: true
      });

      // Load tomorrow's returns (J+1) from assistance ONLY if module is accessible
      let tomorrowAssistanceReturns = [];
      if (hasModuleAccess('assistance')) {
        const {
          data
        } = await supabase.from('assistance').select(`
            *,
            clients (nom, prenom),
            vehicles (marque, modele, immatriculation)
          `).eq('date_fin', tomorrowStr);
        tomorrowAssistanceReturns = data || [];
      }

      // Combine departures (contracts + assistance)
      const allDepartures = [...(todayDepartures || []).map(d => ({
        ...d,
        type: 'contract'
      })), ...(todayAssistanceDepartures || []).map(d => ({
        ...d,
        type: 'assistance'
      }))];

      // Combine returns (today's + tomorrow's, contracts + assistance)
      const allReturns = [...(todayReturns || []).map(r => ({
        ...r,
        isJ1: false,
        type: 'contract'
      })), ...(todayAssistanceReturns || []).map(r => ({
        ...r,
        isJ1: false,
        type: 'assistance'
      })), ...(tomorrowReturns || []).map(r => ({
        ...r,
        isJ1: true,
        type: 'contract'
      })), ...(tomorrowAssistanceReturns || []).map(r => ({
        ...r,
        isJ1: true,
        type: 'assistance'
      }))];
      setDepartures(allDepartures);
      setReturns(allReturns);
    } catch (error) {
      console.error('Error loading departures and returns:', error);
    }
  };
  const loadDashboardData = async () => {
    // Cache check - ne recharge pas si chargé récemment
    if (lastDashboardLoad && (Date.now() - lastDashboardLoad.getTime() < DASHBOARD_CACHE)) {
      console.log('[Dashboard] Using cached data');
      return;
    }

    try {
      // Execute ALL main queries in parallel
      const [vehiclesCountRes, vehiclesRes, contractsCountRes, clientsCountRes, reservationsRes, sinistresRes, assistanceRes] = await Promise.all([supabase.from('vehicles').select('*', {
        count: 'exact',
        head: true
      }).then(r => r), supabase.from('vehicles').select('*').then(r => r), supabase.from('contracts').select('*', {
        count: 'exact',
        head: true
      }).then(r => r), supabase.from('clients').select('*', {
        count: 'exact',
        head: true
      }).then(r => r), supabase.from('contracts').select(`*, clients (nom, prenom), vehicles (marque, modele, immatriculation)`).order('created_at', {
        ascending: false
      }).limit(4).then(r => r), supabase.from('sinistres').select('statut').then(r => r), hasModuleAccess('assistance') ? supabase.from('assistance').select(`*, clients (nom, prenom), vehicles (marque, modele, immatriculation)`).order('created_at', {
        ascending: false
      }).limit(4).then(r => r) : Promise.resolve({
        data: []
      })]);
      const vehicles = vehiclesRes.data || [];
      const availableVehicles = vehicles.filter(v => v.statut === 'disponible').length;
      const rentedVehicles = vehicles.filter(v => v.statut === 'loue').length;
      const maintenanceVehicles = vehicles.filter(v => v.statut === 'en_panne' || v.statut === 'reserve').length;
      const immobilizedVehicles = vehicles.filter(v => v.statut === 'immobilise').length;
      const outOfServiceVehicles = vehicles.filter(v => v.en_service === false).length;
      const sinistres = sinistresRes.data || [];
      const sinistresTotal = sinistres.length;
      const sinistresOuverts = sinistres.filter(s => s.statut === 'ouvert').length;
      const sinistresEnCours = sinistres.filter(s => s.statut === 'en_cours').length;
      const sinistresClos = sinistres.filter(s => s.statut === 'clos').length;
      setStats({
        vehiclesCount: vehiclesCountRes.count || 0,
        reservationsCount: contractsCountRes.count || 0,
        clientsCount: clientsCountRes.count || 0,
        availableVehicles,
        rentedVehicles,
        maintenanceVehicles,
        immobilizedVehicles,
        outOfServiceVehicles,
        sinistresTotal,
        sinistresOuverts,
        sinistresEnCours,
        sinistresClos
      });
      setRecentReservations(reservationsRes.data || []);
      setRecentAssistance(assistanceRes.data || []);

      // Load departures and returns
      await loadDeparturesAndReturns();
      
      setLastDashboardLoad(new Date());
      console.log('[Dashboard] Data refreshed and cached');
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
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

  return <div className="w-full">
      <div className="p-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="border-l-4 border-l-primary shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate('/vehicules')}>
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

          <Card className="border-l-4 border-l-primary shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate('/locations')}>
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

          <Card className="border-l-4 border-l-primary shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate('/clients')}>
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

          <Card className="border-l-4 border-l-warning shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate('/sinistres')}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                    <AlertTriangle className="w-4 h-4 text-warning" />
                    <span>SINISTRES</span>
                  </div>
                  <p className="text-3xl font-bold text-foreground">
                    {stats.sinistresTotal.toString().padStart(2, '0')}
                  </p>
                  <div className="flex gap-2 mt-2 text-xs">
                    <span className="text-destructive">{stats.sinistresOuverts} ouverts</span>
                    <span className="text-warning">{stats.sinistresEnCours} en cours</span>
                    <span className="text-success">{stats.sinistresClos} clos</span>
                  </div>
                </div>
                <div className="w-14 h-14 bg-warning/10 rounded-full flex items-center justify-center">
                  <AlertTriangle className="w-7 h-7 text-warning" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Alerts and Fleet Status in one row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Left column: Alerts and Departures-Returns */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            {/* Alerts Section */}
            <Card className="border-l-4 border-l-warning shadow-sm hover:shadow-md transition-shadow">
              
            </Card>

            {/* Departures - Returns Section */}
            <Card className="border-l-4 border-l-primary shadow-sm hover:shadow-md transition-shadow flex-1">
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
                        <td className="py-4">
                          <Link 
                            to={item.type === 'assistance' ? `/assistance/${item.id}` : `/locations/${item.id}`}
                            className="font-medium text-primary hover:underline"
                          >
                            {item.type === 'assistance' ? item.num_dossier : item.numero_contrat}
                          </Link>
                        </td>
                        <td className="py-4">
                          <Link 
                            to={`/vehicules/${item.vehicle_id}`}
                            className="text-foreground hover:text-primary hover:underline"
                          >
                            {item.vehicles?.marque} {item.vehicles?.modele}
                            <div className="text-xs text-muted-foreground">{item.vehicles?.immatriculation}</div>
                          </Link>
                        </td>
                        <td className="py-4">
                          <Link 
                            to={`/clients/${item.client_id}`}
                            className="text-foreground hover:text-primary hover:underline"
                          >
                            {item.clients?.nom} {item.clients?.prenom}
                          </Link>
                        </td>
                      </tr>)}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
          </div>

          {/* Fleet Status */}
          <Card className="border-l-4 border-l-primary shadow-sm hover:shadow-md transition-shadow h-full">
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
                    <circle cx="50" cy="50" r="40" stroke="hsl(var(--success))" strokeWidth="8" fill="none" strokeDasharray="251.2" strokeDashoffset={stats.vehiclesCount > 0 ? 251.2 - 251.2 * stats.availableVehicles / stats.vehiclesCount : 251.2} />
                    
                    {/* Rented vehicles (primary) */}
                    <circle cx="50" cy="50" r="40" stroke="hsl(var(--primary))" strokeWidth="8" fill="none" strokeDasharray="251.2" strokeDashoffset={stats.vehiclesCount > 0 ? 251.2 - 251.2 * (stats.availableVehicles + stats.rentedVehicles) / stats.vehiclesCount : 251.2} />
                    
                    {/* Maintenance vehicles (warning) */}
                    <circle cx="50" cy="50" r="40" stroke="hsl(var(--warning))" strokeWidth="8" fill="none" strokeDasharray="251.2" strokeDashoffset={stats.vehiclesCount > 0 ? 251.2 - 251.2 * (stats.availableVehicles + stats.rentedVehicles + stats.maintenanceVehicles) / stats.vehiclesCount : 251.2} />
                    
                    {/* Immobilized vehicles (orange/amber) */}
                    <circle cx="50" cy="50" r="40" stroke="hsl(30 100% 50%)" strokeWidth="8" fill="none" strokeDasharray="251.2" strokeDashoffset={stats.vehiclesCount > 0 ? 251.2 - 251.2 * (stats.availableVehicles + stats.rentedVehicles + stats.maintenanceVehicles + stats.immobilizedVehicles) / stats.vehiclesCount : 251.2} />
                    
                    {/* Out of service vehicles (destructive) */}
                    <circle cx="50" cy="50" r="40" stroke="hsl(var(--destructive))" strokeWidth="8" fill="none" strokeDasharray="251.2" strokeDashoffset={stats.vehiclesCount > 0 ? 251.2 - 251.2 * (stats.availableVehicles + stats.rentedVehicles + stats.maintenanceVehicles + stats.immobilizedVehicles + stats.outOfServiceVehicles) / stats.vehiclesCount : 251.2} />
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
                    {stats.availableVehicles} ({stats.vehiclesCount > 0 ? (stats.availableVehicles / stats.vehiclesCount * 100).toFixed(0) : 0}%)
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="w-3 h-3 rounded-full bg-primary"></span>
                    <span className="text-sm text-foreground">En circulation</span>
                  </div>
                  <span className="text-sm font-medium text-foreground">
                    {stats.rentedVehicles} ({stats.vehiclesCount > 0 ? (stats.rentedVehicles / stats.vehiclesCount * 100).toFixed(0) : 0}%)
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="w-3 h-3 rounded-full bg-warning"></span>
                    <span className="text-sm text-foreground">Maintenance</span>
                  </div>
                  <span className="text-sm font-medium text-foreground">
                    {stats.maintenanceVehicles} ({stats.vehiclesCount > 0 ? (stats.maintenanceVehicles / stats.vehiclesCount * 100).toFixed(0) : 0}%)
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="w-3 h-3 rounded-full" style={{
                    backgroundColor: 'hsl(30 100% 50%)'
                  }}></span>
                    <span className="text-sm text-foreground">Immobilisés</span>
                  </div>
                  <span className="text-sm font-medium text-foreground">
                    {stats.immobilizedVehicles} ({stats.vehiclesCount > 0 ? (stats.immobilizedVehicles / stats.vehiclesCount * 100).toFixed(0) : 0}%)
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="w-3 h-3 rounded-full bg-destructive"></span>
                    <span className="text-sm text-foreground">Hors service</span>
                  </div>
                  <span className="text-sm font-medium text-foreground">
                    {stats.outOfServiceVehicles} ({stats.vehiclesCount > 0 ? (stats.outOfServiceVehicles / stats.vehiclesCount * 100).toFixed(0) : 0}%)
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
              <Link to="/rapports" className="text-primary hover:underline text-sm">
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
                <Button variant="ghost" size="sm" className={reservationType === 'standard' ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground'} onClick={() => setReservationType('standard')}>
                  Standard
                </Button>
                <Button variant="ghost" size="sm" className={reservationType === 'assistance' ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground'} onClick={() => setReservationType('assistance')}>
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
                          <Badge variant="secondary" className={reservation.statut === 'actif' || reservation.etat === 'livre' ? 'bg-primary/10 text-primary border-primary/20' : reservation.statut === 'termine' || reservation.etat === 'cloture' ? 'bg-muted text-muted-foreground border-muted' : 'bg-warning/10 text-warning border-warning/20'}>
                            {reservationType === 'standard' ? reservation.statut === 'actif' ? 'Livrée' : reservation.statut : reservation.etat === 'livre' ? 'Livrée' : reservation.etat}
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
                          {reservationType === 'standard' ? `${reservation.duration || 0} Jrs` : `${reservation.date_debut && reservation.date_fin ? Math.ceil((new Date(reservation.date_fin).getTime() - new Date(reservation.date_debut).getTime()) / (1000 * 60 * 60 * 24)) : 0} Jrs`}
                        </td>
                        <td className="py-4">
                          {new Date(reservation.date_debut).toLocaleDateString('fr-FR')}
                        </td>
                        <td className="py-4">
                          {reservation.date_fin ? new Date(reservation.date_fin).toLocaleDateString('fr-FR') : 'N/A'}
                        </td>
                        <td className="py-4">
                          {reservationType === 'standard' ? `${reservation.total_amount?.toFixed(2) || 0} DH` : `${reservation.montant_total?.toFixed(2) || 0} DH`}
                        </td>
                        <td className="py-4">
                          <span className={reservationType === 'standard' ? (reservation.remaining_amount || 0) > 0 ? 'text-red-600' : 'text-green-600' : (reservation.montant_total || 0) - (reservation.montant_paye || 0) > 0 ? 'text-red-600' : 'text-green-600'}>
                            {reservationType === 'standard' ? `${(reservation.remaining_amount || 0) > 0 ? '-' : '+'}${Math.abs(reservation.remaining_amount || 0).toFixed(2)} DH` : `${(reservation.montant_total || 0) - (reservation.montant_paye || 0) > 0 ? '-' : '+'}${Math.abs((reservation.montant_total || 0) - (reservation.montant_paye || 0)).toFixed(2)} DH`}
                          </span>
                        </td>
                        <td className="py-4">
                          {reservationType === 'standard' ? `${reservation.daily_rate?.toFixed(2) || 0} DH` : `${reservation.tarif_journalier?.toFixed(2) || 0} DH`}
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

    </div>;
}