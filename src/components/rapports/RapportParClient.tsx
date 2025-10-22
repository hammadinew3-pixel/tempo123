import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { Download, Users, DollarSign, FileText } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { exportToExcel } from '@/lib/exportUtils';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface ClientData {
  id: string;
  nom_complet: string;
  type: string;
  telephone: string;
  nombre_contrats: number;
  nombre_assistances: number;
  montant_total_contrats: number;
  montant_paye_contrats: number;
  montant_restant_contrats: number;
  montant_total_assistances: number;
  montant_paye_assistances: number;
}

interface Props {
  dateRange: { startDate: string; endDate: string };
}

export default function RapportParClient({ dateRange }: Props) {
  const [clients, setClients] = useState<ClientData[]>([]);
  const [filteredData, setFilteredData] = useState<ClientData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => {
    loadClients();
  }, [dateRange]);

  useEffect(() => {
    applyFilters();
  }, [clients, searchTerm]);

  const loadClients = async () => {
    setLoading(true);
    try {
      // Charger tous les clients
      const { data: allClients } = await supabase
        .from('clients')
        .select('*')
        .order('nom', { ascending: true });

      if (!allClients) {
        setClients([]);
        setChartData([]);
        setLoading(false);
        return;
      }

      // Charger les contrats avec paiements
      const { data: contracts } = await supabase
        .from('contracts')
        .select(`
          id,
          client_id,
          date_debut,
          total_amount,
          daily_rate,
          date_fin,
          vehicle_id,
          vehicles(tarif_journalier)
        `)
        .gte('date_debut', dateRange.startDate)
        .lte('date_debut', dateRange.endDate)
        .neq('statut', 'annule');

      // Charger tous les paiements de contrats depuis contract_payments
      const contractIds = contracts?.map(c => c.id) || [];
      const { data: payments } = contractIds.length > 0
        ? await supabase
            .from('contract_payments')
            .select('contract_id, montant')
            .in('contract_id', contractIds)
        : { data: [] };

      // Charger également les paiements depuis la table revenus (filtrés par plage de dates)
      const { data: revenusPayments } = contractIds.length > 0
        ? await supabase
            .from('revenus')
            .select('client_id, contract_id, montant, date_encaissement')
            .eq('source_revenu', 'contrat')
            .in('contract_id', contractIds)
            .gte('date_encaissement', dateRange.startDate)
            .lte('date_encaissement', dateRange.endDate)
        : { data: [] };

      // Charger les véhicules pour les tarifs
      const vehicleIds = [...new Set(contracts?.map(c => c.vehicle_id).filter(Boolean) || [])];
      const { data: vehicles } = vehicleIds.length > 0
        ? await supabase
            .from('vehicles')
            .select('id, tarif_journalier')
            .in('id', vehicleIds)
        : { data: [] };

      const vehiclesMap = (vehicles || []).reduce((acc, v) => {
        acc[v.id] = { tarif_journalier: v.tarif_journalier };
        return acc;
      }, {} as Record<string, { tarif_journalier: number }>);

      // Calculer les statistiques par client
      const data: ClientData[] = allClients.map((client: any) => {
        // Contrats du client
        const clientContracts = contracts?.filter(c => c.client_id === client.id) || [];
        
        // Calcul montants contrats
        let montant_total_contrats = 0;
        let montant_paye_contrats = 0;

        clientContracts.forEach(contract => {
          // Calcul montant total du contrat
          // PRIORITE 1: Utiliser total_amount si défini et > 0
          let montant = 0;
          if (contract.total_amount && Number(contract.total_amount) > 0) {
            montant = Number(contract.total_amount);
          } else {
            // PRIORITE 2: Calculer depuis daily_rate ou tarif véhicule
            const rate = 
              (contract.daily_rate && Number(contract.daily_rate) > 0 ? Number(contract.daily_rate) : 0) ||
              (vehiclesMap[contract.vehicle_id]?.tarif_journalier || 0);
            
            // Calculer les jours correctement
            const dateDebut = new Date(contract.date_debut);
            const dateFin = new Date(contract.date_fin);
            const diffTime = dateFin.getTime() - dateDebut.getTime();
            const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
            const days = diffDays + 1; // +1 car on inclut le jour de début
            
            montant = rate * days;
          }
          montant_total_contrats += montant;

          // Calcul montant payé depuis contract_payments
          const contractPayments = payments?.filter(p => p.contract_id === contract.id) || [];
          const paymentSum = contractPayments.reduce((sum, p) => sum + (p.montant || 0), 0);
          
          // Calcul montant payé depuis revenus (pour ce contrat spécifique)
          const revenusContractPayments = revenusPayments?.filter(r => r.contract_id === contract.id) || [];
          const revenusSum = revenusContractPayments.reduce((sum, r) => sum + (r.montant || 0), 0);
          
          montant_paye_contrats += paymentSum + revenusSum;
        });

        return {
          id: client.id,
          nom_complet: `${client.nom} ${client.prenom || ''}`.trim(),
          type: client.type,
          telephone: client.telephone,
          nombre_contrats: clientContracts.length,
          nombre_assistances: 0, // Toujours 0 - assistance facturée à l'assurance
          montant_total_contrats,
          montant_paye_contrats,
          montant_restant_contrats: Math.max(0, montant_total_contrats - montant_paye_contrats),
          montant_total_assistances: 0, // Toujours 0 - assistance facturée à l'assurance
          montant_paye_assistances: 0, // Toujours 0 - assistance facturée à l'assurance
        };
      }).filter(c => c.nombre_contrats > 0); // Seulement les clients avec des contrats

      setClients(data);
      generateChartData(data);
    } catch (error) {
      console.error('Error loading clients:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...clients];

    if (searchTerm) {
      filtered = filtered.filter(
        (c) =>
          c.nom_complet.toLowerCase().includes(searchTerm.toLowerCase()) ||
          c.telephone.includes(searchTerm)
      );
    }

    setFilteredData(filtered);
  };

  const generateChartData = (data: ClientData[]) => {
    // Top 10 clients par montant total (uniquement contrats)
    const sorted = [...data]
      .sort((a, b) => b.montant_total_contrats - a.montant_total_contrats)
      .slice(0, 10);

    const chartData = sorted.map(client => ({
      nom: client.nom_complet,
      contrats: client.montant_total_contrats,
    }));

    setChartData(chartData);
  };

  const getTotalMontant = () => filteredData.reduce((sum, c) => sum + c.montant_total_contrats, 0);
  const getTotalPaye = () => filteredData.reduce((sum, c) => sum + c.montant_paye_contrats, 0);
  const getTotalRestant = () => filteredData.reduce((sum, c) => sum + c.montant_restant_contrats, 0);

  const exportReport = () => {
    const exportData = filteredData.map((c) => ({
      'Client': c.nom_complet,
      'Type': c.type,
      'Téléphone': c.telephone,
      'Nb Contrats': c.nombre_contrats,
      'Total (DH)': c.montant_total_contrats.toFixed(2),
      'Payé (DH)': c.montant_paye_contrats.toFixed(2),
      'Reste (DH)': c.montant_restant_contrats.toFixed(2),
    }));
    exportToExcel(exportData, 'rapport_par_client');
  };

  if (loading) {
    return <div className="text-center py-8 text-muted-foreground">Chargement...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Résumé */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Users className="w-4 h-4" />
              Clients Actifs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-primary">{filteredData.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Montant Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-blue-600">
              {getTotalMontant().toFixed(2)} DH
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Total Payé</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600">
              {getTotalPaye().toFixed(2)} DH
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Total Restant</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-orange-600">
              {getTotalRestant().toFixed(2)} DH
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Graphique */}
      <Card>
        <CardHeader>
          <CardTitle>Top 10 Clients par Chiffre d'Affaires</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="nom" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="contrats" fill="hsl(var(--primary))" name="Contrats (DH)" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Filtres */}
      <Card>
        <CardHeader>
          <CardTitle>Filtres</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label>Rechercher (Nom ou Téléphone)</Label>
            <Input
              placeholder="Rechercher un client..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Tableau */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Liste des Clients</CardTitle>
          <Button variant="outline" size="sm" onClick={exportReport}>
            <Download className="w-4 h-4 mr-2" />
            Exporter CSV
          </Button>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Téléphone</TableHead>
                  <TableHead className="text-center">Contrats</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Payé</TableHead>
                  <TableHead className="text-right">Reste</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.nom_complet}</TableCell>
                    <TableCell>
                      <Badge variant={item.type === 'particulier' ? 'default' : 'secondary'}>
                        {item.type === 'particulier' ? 'Particulier' : 'Entreprise'}
                      </Badge>
                    </TableCell>
                    <TableCell>{item.telephone}</TableCell>
                    <TableCell className="text-center">{item.nombre_contrats}</TableCell>
                    <TableCell className="text-right font-medium">
                      {item.montant_total_contrats.toFixed(2)} DH
                    </TableCell>
                    <TableCell className="text-right text-green-600">
                      {item.montant_paye_contrats.toFixed(2)} DH
                    </TableCell>
                    <TableCell className="text-right text-orange-600">
                      {item.montant_restant_contrats.toFixed(2)} DH
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
