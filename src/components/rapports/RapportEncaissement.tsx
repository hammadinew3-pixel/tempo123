import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { Download, DollarSign } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { exportToExcel } from '@/lib/exportUtils';
import { safeFormatDate } from '@/lib/dateUtils';
import { Badge } from '@/components/ui/badge';
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

interface EncaissementData {
  id: string;
  numero_contrat: string;
  date_contrat: string;
  client_nom: string;
  montant_contrat: number;
  montant_paye: number;
  montant_restant: number;
  modes_paiement: string;
  statut_paiement: string;
}

interface Props {
  dateRange: { startDate: string; endDate: string };
}

export default function RapportEncaissement({ dateRange }: Props) {
  const [encaissements, setEncaissements] = useState<EncaissementData[]>([]);
  const [filteredData, setFilteredData] = useState<EncaissementData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPaymentMethod, setFilterPaymentMethod] = useState<string>('all');
  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => {
    loadEncaissements();
  }, [dateRange]);

  useEffect(() => {
    applyFilters();
  }, [encaissements, searchTerm, filterPaymentMethod]);

  const loadEncaissements = async () => {
    setLoading(true);
    try {
      // D'abord, charger tous les paiements dans la période
      const { data: paymentsInPeriod } = await supabase
        .from('contract_payments')
        .select('contract_id, montant, methode, date_paiement')
        .gte('date_paiement', dateRange.startDate)
        .lte('date_paiement', dateRange.endDate);

      if (!paymentsInPeriod || paymentsInPeriod.length === 0) {
        setEncaissements([]);
        generateChartData([]);
        setLoading(false);
        return;
      }

      // Récupérer les IDs uniques des contrats qui ont des paiements
      const contractIds = [...new Set(paymentsInPeriod.map(p => p.contract_id))];

      // Charger les contrats correspondants
      const { data: contracts } = await supabase
        .from('contracts')
        .select(`
          id,
          numero_contrat,
          date_debut,
          total_amount,
          statut,
          clients (
            nom,
            prenom
          )
        `)
        .in('id', contractIds)
        .neq('statut', 'annule')
        .order('date_debut', { ascending: false });

      if (!contracts) return;

      // Charger TOUS les paiements de ces contrats (pas seulement ceux de la période)
      const { data: allPayments } = await supabase
        .from('contract_payments')
        .select('contract_id, montant, methode, date_paiement')
        .in('contract_id', contractIds);

      const data: EncaissementData[] = contracts.map((c: any) => {
        // Filtrer les paiements de ce contrat
        const payments = allPayments?.filter(p => p.contract_id === c.id) || [];
        
        // Calculer le total payé
        const montant_paye = payments.reduce((sum, p) => sum + (p.montant || 0), 0);
        
        // Montant total du contrat
        const montant_contrat = c.total_amount || 0;
        
        // Reste à payer (ne peut jamais être négatif)
        const montant_restant = Math.max(0, montant_contrat - montant_paye);
        
        // Modes de paiement (concat des modes uniques)
        const uniqueModes = [...new Set(payments.map(p => p.methode || 'especes'))];
        const modes_paiement = uniqueModes.join(', ') || 'especes';
        
        // Statut selon la logique fournie
        let statut = 'invalide';
        if (montant_contrat === 0) {
          statut = 'invalide';
        } else if (montant_paye === 0) {
          statut = 'non_paye';
        } else if (montant_paye < montant_contrat) {
          statut = 'partiel';
        } else if (montant_paye >= montant_contrat) {
          statut = 'paye';
        }

        return {
          id: c.id,
          numero_contrat: c.numero_contrat,
          date_contrat: c.date_debut,
          client_nom: `${c.clients?.nom || ''} ${c.clients?.prenom || ''}`.trim(),
          montant_contrat,
          montant_paye,
          montant_restant,
          modes_paiement,
          statut_paiement: statut,
        };
      });

      setEncaissements(data);
      generateChartData(data);
    } catch (error) {
      console.error('Error loading encaissements:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...encaissements];

    if (searchTerm) {
      filtered = filtered.filter(
        (e) =>
          e.client_nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
          e.numero_contrat.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterPaymentMethod !== 'all') {
      filtered = filtered.filter((e) => e.modes_paiement.includes(filterPaymentMethod));
    }

    setFilteredData(filtered);
  };

  const generateChartData = (data: EncaissementData[]) => {
    const grouped: { [key: string]: number } = {};

    data.forEach((item) => {
      const date = new Date(item.date_contrat);
      const key = date.toLocaleDateString('fr-FR', { year: 'numeric', month: 'short' });
      grouped[key] = (grouped[key] || 0) + item.montant_paye;
    });

    const chartData = Object.entries(grouped).map(([date, montant]) => ({
      date,
      montant,
    }));

    setChartData(chartData);
  };

  const getTotalEncaisse = () => filteredData.reduce((sum, e) => sum + e.montant_paye, 0);
  const getSoldeRestant = () => filteredData.reduce((sum, e) => sum + e.montant_restant, 0);

  const getStatutBadge = (statut: string) => {
    const variants: { [key: string]: any } = {
      paye: 'default',
      partiel: 'secondary',
      non_paye: 'destructive',
      invalide: 'outline',
    };

    const labels: { [key: string]: string } = {
      paye: '🟢 Payé',
      partiel: '🟠 Partiel',
      non_paye: '🔴 Non payé',
      invalide: '⚪ Invalide',
    };

    return <Badge variant={variants[statut] || 'outline'}>{labels[statut] || statut}</Badge>;
  };

  const exportReport = () => {
    const exportData = filteredData.map((e) => ({
      'N° Contrat': e.numero_contrat,
      'Date': safeFormatDate(e.date_contrat, 'dd/MM/yyyy'),
      'Client': e.client_nom,
      'Montant Contrat (DH)': e.montant_contrat.toFixed(2),
      'Montant Payé (DH)': e.montant_paye.toFixed(2),
      'Reste à Payer (DH)': e.montant_restant.toFixed(2),
      'Mode Paiement': e.modes_paiement,
      'Statut': e.statut_paiement,
    }));
    exportToExcel(exportData, 'rapport_encaissement');
  };

  if (loading) {
    return <div className="text-center py-8 text-muted-foreground">Chargement...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Résumé */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Total Encaissé
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600">
              {getTotalEncaisse().toFixed(2)} DH
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Solde Restant</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-orange-600">
              {getSoldeRestant().toFixed(2)} DH
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Nombre de Contrats</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-primary">{filteredData.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Graphique */}
      <Card>
        <CardHeader>
          <CardTitle>Encaissements par Mois</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="montant" fill="hsl(var(--primary))" name="Encaissements (DH)" />
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Rechercher (Client ou N° Contrat)</Label>
              <Input
                placeholder="Rechercher..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Mode de Paiement</Label>
              <Select value={filterPaymentMethod} onValueChange={setFilterPaymentMethod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  <SelectItem value="especes">Espèces</SelectItem>
                  <SelectItem value="carte">Carte</SelectItem>
                  <SelectItem value="virement">Virement</SelectItem>
                  <SelectItem value="cheque">Chèque</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tableau */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Liste des Encaissements</CardTitle>
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
                  <TableHead>N° Contrat</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead className="text-right">Montant</TableHead>
                  <TableHead className="text-right">Payé</TableHead>
                  <TableHead className="text-right">Reste</TableHead>
                  <TableHead>Mode Paiement</TableHead>
                  <TableHead>Statut</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.numero_contrat}</TableCell>
                    <TableCell>{safeFormatDate(item.date_contrat, 'dd/MM/yyyy')}</TableCell>
                    <TableCell>{item.client_nom}</TableCell>
                    <TableCell className="text-right">{item.montant_contrat.toFixed(2)} DH</TableCell>
                    <TableCell className="text-right text-green-600">
                      {item.montant_paye.toFixed(2)} DH
                    </TableCell>
                    <TableCell className="text-right text-orange-600">
                      {item.montant_restant.toFixed(2)} DH
                    </TableCell>
                    <TableCell className="capitalize">{item.modes_paiement}</TableCell>
                    <TableCell>{getStatutBadge(item.statut_paiement)}</TableCell>
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
