import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { Download, Shield, TrendingUp, Clock } from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { exportToExcel } from '@/lib/exportUtils';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AssuranceReport {
  id: string;
  nom: string;
  nb_dossiers_ouverts: number;
  nb_dossiers_clos: number;
  total_facture: number;
  total_paye: number;
  total_attente: number;
  delai_moyen_reglement: number;
  taux_recouvrement: number;
  nb_sinistres: number;
}

interface Props {
  dateRange: { startDate: string; endDate: string };
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function RapportAssurance({ dateRange }: Props) {
  const [assurances, setAssurances] = useState<AssuranceReport[]>([]);
  const [filteredData, setFilteredData] = useState<AssuranceReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAssurance, setSelectedAssurance] = useState<string>('all');

  useEffect(() => {
    loadAssuranceReports();
  }, [dateRange]);

  useEffect(() => {
    applyFilters();
  }, [assurances, selectedAssurance]);

  const loadAssuranceReports = async () => {
    setLoading(true);
    try {
      // Charger toutes les assurances
      const { data: assurancesData } = await supabase
        .from('assurances')
        .select('*')
        .eq('actif', true);

      if (!assurancesData) return;

      const reports: AssuranceReport[] = await Promise.all(
        assurancesData.map(async (assurance) => {
          // Dossiers d'assistance
          const { data: assistances } = await supabase
            .from('assistance')
            .select('*')
            .eq('assureur_id', assurance.id)
            .gte('date_debut', dateRange.startDate)
            .lte('date_fin', dateRange.endDate);

          const nb_dossiers_ouverts = assistances?.filter(a => a.etat === 'en_cours').length || 0;
          const nb_dossiers_clos = assistances?.filter(a => a.etat === 'termine').length || 0;

          // Calcul des montants
          const total_facture = assistances?.reduce((sum, a) => sum + (a.montant_facture || 0), 0) || 0;
          const total_paye = assistances?.reduce((sum, a) => sum + (a.montant_paye || 0), 0) || 0;
          const total_attente = total_facture - total_paye;

          // Calcul délai moyen de règlement
          const dossiersPayes = assistances?.filter(a => a.date_paiement_assurance && a.date_fin) || [];
          let delai_moyen = 0;
          if (dossiersPayes.length > 0) {
            const delais = dossiersPayes.map(a => {
              const dateFin = new Date(a.date_fin);
              const datePaiement = new Date(a.date_paiement_assurance);
              return Math.floor((datePaiement.getTime() - dateFin.getTime()) / (1000 * 60 * 60 * 24));
            });
            delai_moyen = delais.reduce((sum, d) => sum + d, 0) / delais.length;
          }

          // Sinistres liés
          const { data: sinistres } = await supabase
            .from('sinistres')
            .select('id')
            .gte('date_sinistre', dateRange.startDate)
            .lte('date_sinistre', dateRange.endDate);

          const taux_recouvrement = total_facture > 0 ? (total_paye / total_facture) * 100 : 0;

          return {
            id: assurance.id,
            nom: assurance.nom,
            nb_dossiers_ouverts,
            nb_dossiers_clos,
            total_facture,
            total_paye,
            total_attente,
            delai_moyen_reglement: Math.round(delai_moyen),
            taux_recouvrement,
            nb_sinistres: sinistres?.length || 0,
          };
        })
      );

      setAssurances(reports);
    } catch (error) {
      console.error('Error loading assurance reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    if (selectedAssurance === 'all') {
      setFilteredData(assurances);
    } else {
      setFilteredData(assurances.filter(a => a.id === selectedAssurance));
    }
  };

  const getTotals = () => {
    return {
      total_dossiers: filteredData.reduce((sum, a) => sum + a.nb_dossiers_ouverts + a.nb_dossiers_clos, 0),
      total_facture: filteredData.reduce((sum, a) => sum + a.total_facture, 0),
      total_paye: filteredData.reduce((sum, a) => sum + a.total_paye, 0),
      total_attente: filteredData.reduce((sum, a) => sum + a.total_attente, 0),
    };
  };

  const getPieChartData = () => {
    return filteredData.map(a => ({
      name: a.nom,
      value: a.nb_dossiers_ouverts + a.nb_dossiers_clos,
    }));
  };

  const getTopAssurance = () => {
    if (assurances.length === 0) return null;
    return assurances.reduce((max, a) => 
      (a.nb_dossiers_ouverts + a.nb_dossiers_clos) > (max.nb_dossiers_ouverts + max.nb_dossiers_clos) ? a : max
    );
  };

  const getSlowestPayer = () => {
    if (assurances.length === 0) return null;
    return assurances.reduce((max, a) => 
      a.delai_moyen_reglement > max.delai_moyen_reglement ? a : max
    );
  };

  const exportReport = () => {
    const exportData = filteredData.map(a => ({
      'Assurance': a.nom,
      'Dossiers Ouverts': a.nb_dossiers_ouverts,
      'Dossiers Clôturés': a.nb_dossiers_clos,
      'Total Facturé (DH)': a.total_facture.toFixed(2),
      'Total Payé (DH)': a.total_paye.toFixed(2),
      'En Attente (DH)': a.total_attente.toFixed(2),
      'Délai Moyen (jours)': a.delai_moyen_reglement,
      'Taux Recouvrement (%)': a.taux_recouvrement.toFixed(1),
      'Nb Sinistres': a.nb_sinistres,
    }));
    exportToExcel(exportData, 'rapport_assurance');
  };

  if (loading) {
    return <div className="text-center py-8 text-muted-foreground">Chargement...</div>;
  }

  const totals = getTotals();
  const topAssurance = getTopAssurance();
  const slowestPayer = getSlowestPayer();

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Total Dossiers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-primary">{totals.total_dossiers}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Total Facturé</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-blue-600">
              {totals.total_facture.toFixed(2)} DH
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Total Payé</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">
              {totals.total_paye.toFixed(2)} DH
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">En Attente</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-orange-600">
              {totals.total_attente.toFixed(2)} DH
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Assurance la Plus Active
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topAssurance ? (
              <div>
                <p className="text-xl font-bold text-primary">{topAssurance.nom}</p>
                <p className="text-sm text-muted-foreground">
                  {topAssurance.nb_dossiers_ouverts + topAssurance.nb_dossiers_clos} dossiers
                </p>
              </div>
            ) : (
              <p className="text-muted-foreground">Aucune donnée</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Délai de Paiement le Plus Long
            </CardTitle>
          </CardHeader>
          <CardContent>
            {slowestPayer ? (
              <div>
                <p className="text-xl font-bold text-orange-600">{slowestPayer.nom}</p>
                <p className="text-sm text-muted-foreground">
                  {slowestPayer.delai_moyen_reglement} jours en moyenne
                </p>
              </div>
            ) : (
              <p className="text-muted-foreground">Aucune donnée</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Graphiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Répartition des Dossiers par Assurance</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={getPieChartData()}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {getPieChartData().map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Taux de Recouvrement (%)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={filteredData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="nom" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="taux_recouvrement" fill="hsl(var(--primary))" name="Taux (%)" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Filtre */}
      <Card>
        <CardHeader>
          <CardTitle>Filtre</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label>Sélectionner une Assurance</Label>
            <Select value={selectedAssurance} onValueChange={setSelectedAssurance}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les assurances</SelectItem>
                {assurances.map(a => (
                  <SelectItem key={a.id} value={a.id}>{a.nom}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tableau détaillé */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Détail par Assurance</CardTitle>
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
                  <TableHead>Assurance</TableHead>
                  <TableHead className="text-right">Dossiers Ouverts</TableHead>
                  <TableHead className="text-right">Dossiers Clôturés</TableHead>
                  <TableHead className="text-right">Total Facturé</TableHead>
                  <TableHead className="text-right">Total Payé</TableHead>
                  <TableHead className="text-right">En Attente</TableHead>
                  <TableHead className="text-right">Délai Moyen</TableHead>
                  <TableHead className="text-right">Taux Recouvrement</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.nom}</TableCell>
                    <TableCell className="text-right">{item.nb_dossiers_ouverts}</TableCell>
                    <TableCell className="text-right">{item.nb_dossiers_clos}</TableCell>
                    <TableCell className="text-right">{item.total_facture.toFixed(2)} DH</TableCell>
                    <TableCell className="text-right text-green-600">
                      {item.total_paye.toFixed(2)} DH
                    </TableCell>
                    <TableCell className="text-right text-orange-600">
                      {item.total_attente.toFixed(2)} DH
                    </TableCell>
                    <TableCell className="text-right">{item.delai_moyen_reglement} jours</TableCell>
                    <TableCell className="text-right">
                      <span className={item.taux_recouvrement >= 80 ? 'text-green-600' : 'text-orange-600'}>
                        {item.taux_recouvrement.toFixed(1)}%
                      </span>
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
