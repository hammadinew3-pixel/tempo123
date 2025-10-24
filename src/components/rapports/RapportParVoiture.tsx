import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { Download, Car } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { exportToExcel } from '@/lib/exportUtils';
import { safeFormatDate } from '@/lib/dateUtils';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface VehicleReport {
  id: string;
  immatriculation: string;
  immatriculation_provisoire?: string | null;
  ww?: string | null;
  marque: string;
  modele: string;
  nombre_contrats: number;
  revenu_total: number;
  depenses_total: number;
  resultat_net: number;
  kilometrage: number;
  derniere_vidange: string | null;
}

interface Props {
  dateRange: { startDate: string; endDate: string };
}

export default function RapportParVoiture({ dateRange }: Props) {
  const [vehicles, setVehicles] = useState<VehicleReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVehicle, setSelectedVehicle] = useState<string | null>(null);
  const [chartData, setChartData] = useState<any[]>([]);
  const [vehicleRevenus, setVehicleRevenus] = useState<any[]>([]);
  const [vehicleDepenses, setVehicleDepenses] = useState<any[]>([]);

  useEffect(() => {
    loadVehicleReports();
  }, [dateRange]);

  const loadVehicleReports = async () => {
    setLoading(true);
    try {
      const { data: vehiclesData } = await supabase
        .from('vehicles')
        .select('*')
        .order('immatriculation');

      if (!vehiclesData) return;

      const reports: VehicleReport[] = await Promise.all(
        vehiclesData.map(async (vehicle) => {
          // Paiements de contrats
          const { data: payments } = await supabase
            .from('contract_payments')
            .select(`
              montant,
              contracts!inner (
                vehicle_id,
                date_debut,
                date_fin
              )
            `)
            .eq('contracts.vehicle_id', vehicle.id)
            .gte('date_paiement', dateRange.startDate)
            .lte('date_paiement', dateRange.endDate);

          // Paiements d'assistance
          const { data: assistance } = await supabase
            .from('assistance')
            .select('montant_paye')
            .eq('vehicle_id', vehicle.id)
            .gte('date_debut', dateRange.startDate)
            .lte('date_fin', dateRange.endDate)
            .neq('etat_paiement', 'en_attente')
            .neq('montant_paye', 0)
            .not('montant_paye', 'is', null);

          // Nombre de contrats
          const { data: contracts } = await supabase
            .from('contracts')
            .select('id')
            .eq('vehicle_id', vehicle.id)
            .gte('date_debut', dateRange.startDate)
            .lte('date_fin', dateRange.endDate)
            .neq('statut', 'annule');

          // Dépenses
          const { data: expenses } = await supabase
            .from('expenses')
            .select('montant')
            .eq('vehicle_id', vehicle.id)
            .gte('date_depense', dateRange.startDate)
            .lte('date_depense', dateRange.endDate);

          // Dernière vidange
          const { data: vidanges } = await supabase
            .from('vidanges')
            .select('date_vidange')
            .eq('vehicle_id', vehicle.id)
            .order('date_vidange', { ascending: false })
            .limit(1);

          const revenu_payments = payments?.reduce((sum, p) => sum + (p.montant || 0), 0) || 0;
          const revenu_assistance = assistance?.reduce((sum, a) => sum + (a.montant_paye || 0), 0) || 0;
          const revenu_total = revenu_payments + revenu_assistance;
          const depenses_total = expenses?.reduce((sum, e) => sum + (e.montant || 0), 0) || 0;

          return {
            id: vehicle.id,
            immatriculation: vehicle.immatriculation,
            immatriculation_provisoire: vehicle.immatriculation_provisoire,
            ww: vehicle.ww,
            marque: vehicle.marque,
            modele: vehicle.modele,
            nombre_contrats: contracts?.length || 0,
            revenu_total,
            depenses_total,
            resultat_net: revenu_total - depenses_total,
            kilometrage: vehicle.kilometrage || 0,
            derniere_vidange: vidanges?.[0]?.date_vidange || null,
          };
        })
      );

      setVehicles(reports);
    } catch (error) {
      console.error('Error loading vehicle reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadVehicleChart = async (vehicleId: string) => {
    // Paiements de contrats
    const { data: payments } = await supabase
      .from('contract_payments')
      .select(`
        *,
        contracts!inner (
          vehicle_id,
          numero_contrat,
          clients (nom, prenom)
        )
      `)
      .eq('contracts.vehicle_id', vehicleId)
      .gte('date_paiement', dateRange.startDate)
      .lte('date_paiement', dateRange.endDate)
      .order('date_paiement', { ascending: false });

    // Paiements d'assistance
    const { data: assistance } = await supabase
      .from('assistance')
      .select(`
        *,
        clients (nom, prenom)
      `)
      .eq('vehicle_id', vehicleId)
      .gte('date_debut', dateRange.startDate)
      .lte('date_fin', dateRange.endDate)
      .neq('etat_paiement', 'en_attente')
      .neq('montant_paye', 0)
      .not('montant_paye', 'is', null)
      .order('date_debut', { ascending: false });

    const { data: expenses } = await supabase
      .from('expenses')
      .select('*')
      .eq('vehicle_id', vehicleId)
      .gte('date_depense', dateRange.startDate)
      .lte('date_depense', dateRange.endDate)
      .order('date_depense', { ascending: false });

    // Formater les revenus pour affichage
    const revenusFromPayments = (payments || []).map((p: any) => ({
      date: p.date_paiement,
      source: 'Contrat',
      reference: p.contracts?.numero_contrat || '',
      client: p.contracts?.clients ? `${p.contracts.clients.nom} ${p.contracts.clients.prenom}` : '',
      montant: p.montant,
      mode_paiement: p.methode,
    }));

    const revenusFromAssistance = (assistance || []).map((a: any) => ({
      date: a.date_debut,
      source: 'Assistance',
      reference: a.num_dossier || '',
      client: a.clients ? `${a.clients.nom} ${a.clients.prenom}` : '',
      montant: a.montant_paye,
      mode_paiement: 'Virement',
    }));

    const allRevenus = [...revenusFromPayments, ...revenusFromAssistance].sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    setVehicleRevenus(allRevenus);
    setVehicleDepenses(expenses || []);

    // Grouper par mois pour le graphique
    const monthlyData: { [key: string]: { revenus: number; depenses: number } } = {};

    payments?.forEach((p: any) => {
      const month = new Date(p.date_paiement).toLocaleDateString('fr-FR', { year: 'numeric', month: 'short' });
      if (!monthlyData[month]) monthlyData[month] = { revenus: 0, depenses: 0 };
      monthlyData[month].revenus += p.montant || 0;
    });

    assistance?.forEach((a: any) => {
      const month = new Date(a.date_debut).toLocaleDateString('fr-FR', { year: 'numeric', month: 'short' });
      if (!monthlyData[month]) monthlyData[month] = { revenus: 0, depenses: 0 };
      monthlyData[month].revenus += a.montant_paye || 0;
    });

    expenses?.forEach((e: any) => {
      const month = new Date(e.date_depense).toLocaleDateString('fr-FR', { year: 'numeric', month: 'short' });
      if (!monthlyData[month]) monthlyData[month] = { revenus: 0, depenses: 0 };
      monthlyData[month].depenses += e.montant || 0;
    });

    const data = Object.entries(monthlyData).map(([month, values]) => ({
      month,
      revenus: values.revenus,
      depenses: values.depenses,
    }));

    setChartData(data);
  };

  const handleVehicleClick = (vehicleId: string) => {
    setSelectedVehicle(vehicleId);
    loadVehicleChart(vehicleId);
  };

  const exportReport = () => {
    const exportData = vehicles.map(v => ({
      'Immatriculation': v.immatriculation || v.immatriculation_provisoire || v.ww || 'N/A',
      'Marque': v.marque,
      'Modèle': v.modele,
      'Nb Contrats': v.nombre_contrats,
      'Revenus (DH)': v.revenu_total.toFixed(2),
      'Dépenses (DH)': v.depenses_total.toFixed(2),
      'Résultat Net (DH)': v.resultat_net.toFixed(2),
      'Kilométrage': v.kilometrage,
      'Dernière Vidange': v.derniere_vidange ? safeFormatDate(v.derniere_vidange, 'dd/MM/yyyy') : '-',
    }));
    exportToExcel(exportData, 'rapport_par_voiture');
  };

  if (loading) {
    return <div className="text-center py-8 text-muted-foreground">Chargement...</div>;
  }

  const selectedVehicleData = vehicles.find(v => v.id === selectedVehicle);

  return (
    <div className="space-y-6">
      {/* Résumé global */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Car className="w-4 h-4" />
              Total Véhicules
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-primary">{vehicles.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Revenus Totaux</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">
              {vehicles.reduce((sum, v) => sum + v.revenu_total, 0).toFixed(2)} DH
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Dépenses Totales</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-600">
              {vehicles.reduce((sum, v) => sum + v.depenses_total, 0).toFixed(2)} DH
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Résultat Net</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-blue-600">
              {vehicles.reduce((sum, v) => sum + v.resultat_net, 0).toFixed(2)} DH
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tableau détaillé */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Détail par Véhicule</CardTitle>
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
                  <TableHead>Immatriculation</TableHead>
                  <TableHead>Marque/Modèle</TableHead>
                  <TableHead className="text-right">Nb Contrats</TableHead>
                  <TableHead className="text-right">Revenus</TableHead>
                  <TableHead className="text-right">Dépenses</TableHead>
                  <TableHead className="text-right">Résultat Net</TableHead>
                  <TableHead className="text-right">Kilométrage</TableHead>
                  <TableHead>Dernière Vidange</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vehicles.map((vehicle) => (
                  <TableRow
                    key={vehicle.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleVehicleClick(vehicle.id)}
                  >
                    <TableCell className="font-medium">{vehicle.immatriculation || vehicle.immatriculation_provisoire || vehicle.ww || 'N/A'}</TableCell>
                    <TableCell>{vehicle.marque} {vehicle.modele}</TableCell>
                    <TableCell className="text-right">{vehicle.nombre_contrats}</TableCell>
                    <TableCell className="text-right text-green-600">
                      {vehicle.revenu_total.toFixed(2)} DH
                    </TableCell>
                    <TableCell className="text-right text-red-600">
                      {vehicle.depenses_total.toFixed(2)} DH
                    </TableCell>
                    <TableCell className="text-right font-bold">
                      <span className={vehicle.resultat_net >= 0 ? 'text-blue-600' : 'text-red-600'}>
                        {vehicle.resultat_net.toFixed(2)} DH
                      </span>
                    </TableCell>
                    <TableCell className="text-right">{vehicle.kilometrage.toLocaleString()} km</TableCell>
                    <TableCell>
                      {vehicle.derniere_vidange ? safeFormatDate(vehicle.derniere_vidange, 'dd/MM/yyyy') : '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            Cliquez sur un véhicule pour voir le graphique détaillé
          </p>
        </CardContent>
      </Card>

      {/* Graphique pour véhicule sélectionné */}
      {selectedVehicle && chartData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>
              Revenus vs Dépenses - {selectedVehicleData?.immatriculation || selectedVehicleData?.ww || 'N/A'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="revenus" stroke="hsl(var(--primary))" name="Revenus (DH)" strokeWidth={2} />
                <Line type="monotone" dataKey="depenses" stroke="#ef4444" name="Dépenses (DH)" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Détails revenus et dépenses du véhicule sélectionné */}
      {selectedVehicle && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Revenus - {selectedVehicleData?.immatriculation || selectedVehicleData?.ww || 'N/A'}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Source</TableHead>
                      <TableHead>Référence</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead className="text-right">Montant</TableHead>
                      <TableHead>Mode Paiement</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {vehicleRevenus.length > 0 ? (
                      vehicleRevenus.map((rev, idx) => (
                        <TableRow key={idx}>
                          <TableCell>{safeFormatDate(rev.date, 'dd/MM/yyyy')}</TableCell>
                          <TableCell>{rev.source}</TableCell>
                          <TableCell>{rev.reference}</TableCell>
                          <TableCell>{rev.client}</TableCell>
                          <TableCell className="text-right text-green-600 font-medium">
                            {rev.montant.toFixed(2)} DH
                          </TableCell>
                          <TableCell className="capitalize">{rev.mode_paiement}</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground">
                          Aucun revenu pour cette période
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
              <div className="mt-4 flex justify-end">
                <p className="text-lg font-bold text-green-600">
                  Total: {vehicleRevenus.reduce((sum, r) => sum + r.montant, 0).toFixed(2)} DH
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Dépenses - {selectedVehicleData?.immatriculation || selectedVehicleData?.ww || 'N/A'}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Fournisseur</TableHead>
                      <TableHead className="text-right">Montant</TableHead>
                      <TableHead>Mode Paiement</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {vehicleDepenses.length > 0 ? (
                      vehicleDepenses.map((dep: any) => (
                        <TableRow key={dep.id}>
                          <TableCell>{safeFormatDate(dep.date_depense, 'dd/MM/yyyy')}</TableCell>
                          <TableCell className="capitalize">{dep.type_depense}</TableCell>
                          <TableCell>{dep.description}</TableCell>
                          <TableCell>{dep.fournisseur || '-'}</TableCell>
                          <TableCell className="text-right text-red-600 font-medium">
                            {dep.montant.toFixed(2)} DH
                          </TableCell>
                          <TableCell className="capitalize">{dep.mode_paiement}</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground">
                          Aucune dépense pour cette période
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
              <div className="mt-4 flex justify-end">
                <p className="text-lg font-bold text-red-600">
                  Total: {vehicleDepenses.reduce((sum: number, d: any) => sum + d.montant, 0).toFixed(2)} DH
                </p>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
