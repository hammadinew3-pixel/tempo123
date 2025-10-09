import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DollarSign, TrendingUp, Calendar, FileText, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

type Revenue = {
  id: string;
  numero_contrat: string;
  date_debut: string;
  date_fin: string;
  total_amount: number;
  advance_payment: number;
  remaining_amount: number;
  statut: string;
  client?: {
    nom: string;
    prenom: string;
  };
  vehicle?: {
    marque: string;
    modele: string;
    immatriculation: string;
  };
};

export default function Revenus() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [revenues, setRevenues] = useState<Revenue[]>([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [filteredRevenue, setFilteredRevenue] = useState(0);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    loadRevenues();
  }, []);

  const loadRevenues = async () => {
    try {
      const { data, error } = await supabase
        .from('contracts')
        .select(`
          *,
          clients (nom, prenom),
          vehicles (marque, modele, immatriculation)
        `)
        .in('statut', ['contrat_valide', 'livre', 'retour_effectue', 'termine'])
        .order('date_debut', { ascending: false });

      if (error) throw error;

      const revenuesData = data as Revenue[];
      setRevenues(revenuesData);
      
      const total = revenuesData.reduce((sum, r) => sum + (r.total_amount || 0), 0);
      setTotalRevenue(total);
      setFilteredRevenue(total);
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

  const filterRevenues = () => {
    let filtered = revenues;

    if (startDate) {
      filtered = filtered.filter(r => r.date_debut >= startDate);
    }

    if (endDate) {
      filtered = filtered.filter(r => r.date_debut <= endDate);
    }

    const total = filtered.reduce((sum, r) => sum + (r.total_amount || 0), 0);
    setFilteredRevenue(total);
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      contrat_valide: 'bg-blue-100 text-blue-800',
      livre: 'bg-green-100 text-green-800',
      retour_effectue: 'bg-amber-100 text-amber-800',
      termine: 'bg-indigo-100 text-indigo-800',
    };

    const labels: Record<string, string> = {
      contrat_valide: 'Validé',
      livre: 'En cours',
      retour_effectue: 'Retourné',
      termine: 'Terminé',
    };

    return (
      <Badge className={`${styles[status]} border-0`}>
        {labels[status] || status}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Chargement des revenus...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Revenus</h1>
          <p className="text-sm text-muted-foreground">
            Suivi des revenus générés par les locations
          </p>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenu total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalRevenue.toFixed(2)} DH</div>
            <p className="text-xs text-muted-foreground">
              Tous les contrats
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenu filtré</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredRevenue.toFixed(2)} DH</div>
            <p className="text-xs text-muted-foreground">
              Période sélectionnée
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Contrats</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{revenues.length}</div>
            <p className="text-xs text-muted-foreground">
              Total des locations
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filtres */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Filtrer par période</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Date de début</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Date de fin</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <div className="flex items-end">
              <Button onClick={filterRevenues} className="w-full">
                <Search className="w-4 h-4 mr-2" />
                Filtrer
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Liste des revenus */}
      <Card>
        <CardHeader>
          <CardTitle>Détails des revenus</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {revenues.map((revenue) => (
              <div
                key={revenue.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-semibold">{revenue.numero_contrat}</p>
                    {getStatusBadge(revenue.statut)}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {revenue.client?.nom} {revenue.client?.prenom} • {revenue.vehicle?.marque} {revenue.vehicle?.modele}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    <Calendar className="w-3 h-3 inline mr-1" />
                    {format(new Date(revenue.date_debut), 'dd MMM yyyy', { locale: fr })} - {format(new Date(revenue.date_fin), 'dd MMM yyyy', { locale: fr })}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-primary">{revenue.total_amount?.toFixed(2)} DH</p>
                  <p className="text-xs text-muted-foreground">
                    Acompte: {revenue.advance_payment?.toFixed(2)} DH
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Reste: {revenue.remaining_amount?.toFixed(2)} DH
                  </p>
                </div>
              </div>
            ))}

            {revenues.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                Aucun revenu enregistré
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
