import { useEffect, useState } from 'react';
import { useTenant } from '@/contexts/TenantContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Building2, Car, DollarSign, FileText, Filter } from 'lucide-react';
import { Database } from '@/integrations/supabase/types';
import { Navigate } from 'react-router-dom';

type Tenant = Database['public']['Tables']['tenants']['Row'];

export default function Admin() {
  const { isSuperAdmin, loading: tenantLoading } = useTenant();
  const { toast } = useToast();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [stats, setStats] = useState({
    totalAgencies: 0,
    activeVehicles: 0,
    monthlyRevenue: 0,
    totalInvoices: 0,
  });

  useEffect(() => {
    if (isSuperAdmin) {
      loadTenants();
      loadStats();
    }
  }, [isSuperAdmin]);

  const loadTenants = async () => {
    try {
      let query = supabase.from('tenants').select('*').order('date_inscription', { ascending: false });

      if (filter !== 'all') {
        if (filter === 'actif') {
          query = query.eq('actif', true);
        } else if (filter === 'inactif') {
          query = query.eq('actif', false);
        } else {
          query = query.eq('plan', filter as 'essentiel' | 'standard' | 'premium');
        }
      }

      const { data, error } = await query;

      if (error) throw error;
      setTenants(data || []);
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      // Count total agencies
      const { count: totalAgencies } = await supabase
        .from('tenants')
        .select('*', { count: 'exact', head: true });

      // Count active vehicles across all tenants
      const { count: activeVehicles } = await supabase
        .from('vehicles')
        .select('*', { count: 'exact', head: true })
        .eq('statut', 'disponible');

      // Get total invoices
      const { count: totalInvoices } = await supabase
        .from('invoices')
        .select('*', { count: 'exact', head: true });

      // Calculate monthly revenue (current month, paid invoices)
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { data: invoicesData } = await supabase
        .from('invoices')
        .select('montant_ttc')
        .eq('payee', true)
        .gte('date_emission', startOfMonth.toISOString().split('T')[0]);

      const monthlyRevenue = invoicesData?.reduce((sum, inv) => sum + Number(inv.montant_ttc), 0) || 0;

      setStats({
        totalAgencies: totalAgencies || 0,
        activeVehicles: activeVehicles || 0,
        monthlyRevenue,
        totalInvoices: totalInvoices || 0,
      });
    } catch (error: any) {
      console.error('Error loading stats:', error);
    }
  };

  const toggleTenantStatus = async (tenantId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('tenants')
        .update({ actif: !currentStatus })
        .eq('id', tenantId);

      if (error) throw error;

      toast({
        title: 'Succès',
        description: `Agence ${!currentStatus ? 'activée' : 'suspendue'}`,
      });

      loadTenants();
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const validatePayment = async (tenantId: string) => {
    try {
      const { error } = await supabase
        .from('tenants')
        .update({ paiement_valide: true })
        .eq('id', tenantId);

      if (error) throw error;

      toast({
        title: 'Succès',
        description: 'Paiement validé',
      });

      loadTenants();
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const changePlan = async (tenantId: string, newPlan: 'essentiel' | 'standard' | 'premium') => {
    try {
      const { error } = await supabase
        .from('tenants')
        .update({ plan: newPlan })
        .eq('id', tenantId);

      if (error) throw error;

      toast({
        title: 'Succès',
        description: 'Plan modifié',
      });

      loadTenants();
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  if (tenantLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Chargement...</p>
      </div>
    );
  }

  if (!isSuperAdmin) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Administration Plateforme</h1>
        <p className="text-muted-foreground">Gestion des agences et statistiques globales</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Agences</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalAgencies}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Véhicules Actifs</CardTitle>
            <Car className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeVehicles}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">CA Mensuel</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.monthlyRevenue.toFixed(2)} MAD</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Factures</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalInvoices}</div>
          </CardContent>
        </Card>
      </div>

      {/* Tenants List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Liste des Agences</CardTitle>
              <CardDescription>Gérer les agences de la plateforme</CardDescription>
            </div>
            <Select value={filter} onValueChange={(value) => { setFilter(value); loadTenants(); }}>
              <SelectTrigger className="w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filtrer" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
                <SelectItem value="actif">Actifs</SelectItem>
                <SelectItem value="inactif">Inactifs</SelectItem>
                <SelectItem value="essentiel">Essentiel</SelectItem>
                <SelectItem value="standard">Standard</SelectItem>
                <SelectItem value="premium">Premium</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center text-muted-foreground">Chargement...</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Agence</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Paiement</TableHead>
                  <TableHead>Date Inscription</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tenants.map((tenant) => (
                  <TableRow key={tenant.id}>
                    <TableCell className="font-medium">{tenant.nom_agence}</TableCell>
                    <TableCell>{tenant.email_contact}</TableCell>
                    <TableCell>
                      <Select
                        value={tenant.plan}
                        onValueChange={(value) => changePlan(tenant.id, value as 'essentiel' | 'standard' | 'premium')}
                      >
                        <SelectTrigger className="w-[130px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="essentiel">Essentiel</SelectItem>
                          <SelectItem value="standard">Standard</SelectItem>
                          <SelectItem value="premium">Premium</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Badge variant={tenant.actif ? 'default' : 'destructive'}>
                        {tenant.actif ? 'Actif' : 'Suspendu'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={tenant.paiement_valide ? 'default' : 'secondary'}>
                        {tenant.paiement_valide ? 'Validé' : 'En attente'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(tenant.date_inscription).toLocaleDateString('fr-MA')}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant={tenant.actif ? 'destructive' : 'default'}
                          onClick={() => toggleTenantStatus(tenant.id, tenant.actif)}
                        >
                          {tenant.actif ? 'Suspendre' : 'Activer'}
                        </Button>
                        {!tenant.paiement_valide && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => validatePayment(tenant.id)}
                          >
                            Valider
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
