import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Car, Calendar, Users, TrendingUp, AlertCircle, FileText } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface DashboardStats {
  vehiclesCount: number;
  reservationsCount: number;
  clientsCount: number;
  availableVehicles: number;
  rentedVehicles: number;
  maintenanceVehicles: number;
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    vehiclesCount: 0,
    reservationsCount: 0,
    clientsCount: 0,
    availableVehicles: 0,
    rentedVehicles: 0,
    maintenanceVehicles: 0,
  });
  const [recentReservations, setRecentReservations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      // Load vehicles count
      const { count: vehiclesCount } = await supabase
        .from('vehicles')
        .select('*', { count: 'exact', head: true });

      // Load vehicles by status
      const { data: vehicles } = await supabase
        .from('vehicles')
        .select('statut');

      const availableVehicles = vehicles?.filter(v => v.statut === 'disponible').length || 0;
      const rentedVehicles = vehicles?.filter(v => v.statut === 'loue').length || 0;
      const maintenanceVehicles = vehicles?.filter(v => v.statut === 'en_panne' || v.statut === 'reserve').length || 0;

      // Load contracts count
      const { count: reservationsCount } = await supabase
        .from('contracts')
        .select('*', { count: 'exact', head: true });

      // Load clients count
      const { count: clientsCount } = await supabase
        .from('clients')
        .select('*', { count: 'exact', head: true });

      // Load recent reservations
      const { data: reservations } = await supabase
        .from('contracts')
        .select(`
          *,
          clients (nom, prenom),
          vehicles (marque, modele, immatriculation)
        `)
        .order('created_at', { ascending: false })
        .limit(4);

      setStats({
        vehiclesCount: vehiclesCount || 0,
        reservationsCount: reservationsCount || 0,
        clientsCount: clientsCount || 0,
        availableVehicles,
        rentedVehicles,
        maintenanceVehicles,
      });

      setRecentReservations(reservations || []);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const chartData = [
    { month: 'Août\n2025', revenus: 1500, charges: 200 },
    { month: 'Sept.\n2025', revenus: 4500, charges: 300 },
    { month: 'Oct.\n2025', revenus: 6000, charges: 400 },
  ];

  const vehicleAlerts = stats.vehiclesCount - stats.availableVehicles;
  const totalAlerts = vehicleAlerts;

  const availablePercentage = stats.vehiclesCount > 0 
    ? ((stats.availableVehicles / stats.vehiclesCount) * 100).toFixed(2)
    : '0.00';

  return (
    <div className="w-full">
      <div className="p-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="border-l-4 border-l-primary shadow-sm hover:shadow-md transition-shadow">
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

          <Card className="border-l-4 border-l-primary shadow-sm hover:shadow-md transition-shadow">
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

          <Card className="border-l-4 border-l-primary shadow-sm hover:shadow-md transition-shadow">
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

        {/* Alerts and Fleet Status in one row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Alerts Section */}
          <div className="lg:col-span-2">
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
                      <div className="flex items-center space-x-2">
                        <span className="w-3 h-3 rounded-full bg-success"></span>
                        <span className="text-sm text-foreground">00 Alertes chèques</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="w-3 h-3 rounded-full bg-success"></span>
                        <span className="text-sm text-foreground">00 Alertes réservations</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="w-3 h-3 rounded-full bg-warning"></span>
                        <span className="text-sm text-foreground">
                          {vehicleAlerts.toString().padStart(2, '0')} Alertes véhicules
                        </span>
                      </div>
                    </div>
                  </div>
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
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      stroke="#e5e7eb"
                      strokeWidth="8"
                      fill="none"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      stroke="hsl(var(--success))"
                      strokeWidth="8"
                      fill="none"
                      strokeDasharray="251.2"
                      strokeDashoffset={251.2 - (251.2 * stats.availableVehicles) / stats.vehiclesCount}
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      stroke="hsl(var(--primary))"
                      strokeWidth="8"
                      fill="none"
                      strokeDasharray="251.2"
                      strokeDashoffset={
                        251.2 - (251.2 * (stats.availableVehicles + stats.rentedVehicles)) / stats.vehiclesCount
                      }
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">
                        {stats.availableVehicles.toString().padStart(2, '0')} véhicules
                      </p>
                      <p className="text-xl font-bold text-success">Disponibles</p>
                      <p className="text-xs text-muted-foreground">{availablePercentage}%</p>
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
                  <span className="text-sm font-medium text-foreground">{stats.availableVehicles}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="w-3 h-3 rounded-full bg-primary"></span>
                    <span className="text-sm text-foreground">En circulation</span>
                  </div>
                  <span className="text-sm font-medium text-foreground">{stats.rentedVehicles}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Departures - Returns Section */}
        <Card className="mb-6 border-l-4 border-l-primary shadow-sm hover:shadow-md transition-shadow">
          <CardHeader>
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-5 h-5 text-primary" />
              <CardTitle>Départs - Récupérations</CardTitle>
            </div>
            <CardDescription>Vos départs et retours prévus pour aujourd'hui</CardDescription>
            <div className="flex space-x-8 mt-4">
              <button className="text-primary border-b-2 border-primary pb-2">
                <span className="text-sm font-medium">00 Départs</span>
              </button>
              <button className="text-muted-foreground pb-2 hover:text-foreground">
                <span className="text-sm font-medium">00 Récupérations</span>
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
                    <th className="pb-3 font-medium">Heure de dé...</th>
                    <th className="pb-3 font-medium">Date retour</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td colSpan={5} className="text-center py-12">
                      <div className="flex flex-col items-center">
                        <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center mb-4">
                          <Calendar className="w-8 h-8 text-muted-foreground" />
                        </div>
                        <p className="text-muted-foreground">Aucun résultat</p>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

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
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="revenus"
                  stroke="hsl(var(--success))"
                  strokeWidth={2}
                  name="Revenus"
                  dot={{ fill: 'hsl(var(--success))', r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="charges"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  name="Charges"
                  dot={{ fill: 'hsl(var(--primary))', r: 4 }}
                />
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
                <Button variant="ghost" size="sm" className="text-primary">
                  Courtes
                </Button>
                <Button variant="ghost" size="sm" className="text-muted-foreground">
                  Longues
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
                  {recentReservations.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="text-center py-8 text-muted-foreground">
                        Aucune réservation
                      </td>
                    </tr>
                  ) : (
                    recentReservations.map((reservation) => (
                      <tr key={reservation.id} className="border-b hover:bg-muted/50">
                        <td className="py-4">{reservation.numero_contrat}</td>
                        <td className="py-4">
                          <Badge
                            variant="secondary"
                            className={
                              reservation.statut === 'actif'
                                ? 'bg-primary/10 text-primary border-primary/20'
                                : reservation.statut === 'termine'
                                ? 'bg-muted text-muted-foreground border-muted'
                                : 'bg-warning/10 text-warning border-warning/20'
                            }
                          >
                            {reservation.statut === 'actif' ? 'Livrée' : reservation.statut}
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
                        <td className="py-4">{reservation.duration || 0} Jrs</td>
                        <td className="py-4">
                          {new Date(reservation.date_debut).toLocaleDateString('fr-FR')}
                        </td>
                        <td className="py-4">
                          {new Date(reservation.date_fin).toLocaleDateString('fr-FR')}
                        </td>
                        <td className="py-4">{reservation.total_amount?.toFixed(2)} DH</td>
                        <td className="py-4">
                          <span
                            className={
                              (reservation.remaining_amount || 0) > 0
                                ? 'text-red-600'
                                : 'text-green-600'
                            }
                          >
                            {(reservation.remaining_amount || 0) > 0 ? '-' : '+'}
                            {Math.abs(reservation.remaining_amount || 0).toFixed(2)} DH
                          </span>
                        </td>
                        <td className="py-4">{reservation.daily_rate?.toFixed(2)} DH</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <div className="text-center mt-4">
              <Link to="/locations" className="text-primary hover:underline text-sm">
                Afficher toutes les réservations →
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
