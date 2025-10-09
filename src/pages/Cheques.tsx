import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileText, CreditCard, DollarSign, Filter } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

type Cheque = {
  id: string;
  numero_cheque: string;
  montant: number;
  banque: string;
  date_paiement: string;
  type: 'payment' | 'expense';
  source: string;
  client?: {
    nom: string;
    prenom: string;
  };
  contract?: {
    numero_contrat: string;
  };
};

export default function Cheques() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [cheques, setCheques] = useState<Cheque[]>([]);
  const [totalCheques, setTotalCheques] = useState(0);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    loadCheques();
  }, []);

  const loadCheques = async () => {
    try {
      // Récupérer les paiements par chèque des contrats
      const { data: contractPayments, error: paymentsError } = await supabase
        .from('contract_payments')
        .select(`
          *,
          contracts (numero_contrat, clients (nom, prenom))
        `)
        .eq('methode', 'cheque')
        .order('date_paiement', { ascending: false });

      if (paymentsError) throw paymentsError;

      // Récupérer les paiements par chèque des assurances
      const { data: insurances, error: insurancesError } = await supabase
        .from('vehicle_insurance')
        .select('*')
        .eq('mode_paiement', 'cheque')
        .order('date_paiement', { ascending: false });

      if (insurancesError) throw insurancesError;

      // Récupérer les paiements par chèque des visites techniques
      const { data: inspections, error: inspectionsError } = await supabase
        .from('vehicle_technical_inspection')
        .select('*')
        .eq('mode_paiement', 'cheque')
        .order('date_paiement', { ascending: false });

      if (inspectionsError) throw inspectionsError;

      // Récupérer les paiements par chèque des vignettes
      const { data: vignettes, error: vignettesError } = await supabase
        .from('vehicle_vignette')
        .select('*')
        .eq('mode_paiement', 'cheque')
        .order('date_paiement', { ascending: false });

      if (vignettesError) throw vignettesError;

      // Formater tous les chèques dans un seul tableau
      const allCheques: Cheque[] = [
        ...(contractPayments || []).map((p: any) => ({
          id: p.id,
          numero_cheque: p.numero_cheque || '',
          montant: p.montant,
          banque: p.banque || 'Non spécifiée',
          date_paiement: p.date_paiement,
          type: 'payment' as const,
          source: 'Paiement contrat',
          client: p.contracts?.clients,
          contract: { numero_contrat: p.contracts?.numero_contrat },
        })),
        ...(insurances || []).map((i: any) => ({
          id: i.id,
          numero_cheque: i.numero_cheque || '',
          montant: i.montant,
          banque: i.banque || 'Non spécifiée',
          date_paiement: i.date_paiement,
          type: 'expense' as const,
          source: 'Assurance',
        })),
        ...(inspections || []).map((i: any) => ({
          id: i.id,
          numero_cheque: i.numero_cheque || '',
          montant: i.montant,
          banque: i.banque || 'Non spécifiée',
          date_paiement: i.date_paiement,
          type: 'expense' as const,
          source: 'Visite technique',
        })),
        ...(vignettes || []).map((v: any) => ({
          id: v.id,
          numero_cheque: v.numero_cheque || '',
          montant: v.montant,
          banque: v.banque || 'Non spécifiée',
          date_paiement: v.date_paiement,
          type: 'expense' as const,
          source: 'Vignette',
        })),
      ];

      // Trier par date
      allCheques.sort((a, b) => new Date(b.date_paiement).getTime() - new Date(a.date_paiement).getTime());

      setCheques(allCheques);
      setTotalCheques(allCheques.length);
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

  const filterCheques = () => {
    let filtered = cheques;

    if (startDate) {
      filtered = filtered.filter(c => c.date_paiement >= startDate);
    }

    if (endDate) {
      filtered = filtered.filter(c => c.date_paiement <= endDate);
    }

    return filtered;
  };

  const filteredCheques = filterCheques();
  const totalReceived = filteredCheques
    .filter(c => c.type === 'payment')
    .reduce((sum, c) => sum + c.montant, 0);
  const totalPaid = filteredCheques
    .filter(c => c.type === 'expense')
    .reduce((sum, c) => sum + c.montant, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Chargement des chèques...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Chèques</h1>
        <p className="text-sm text-muted-foreground">
          Suivi des paiements par chèque
        </p>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total chèques</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredCheques.length}</div>
            <p className="text-xs text-muted-foreground">
              Chèques enregistrés
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Chèques reçus</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{totalReceived.toFixed(2)} DH</div>
            <p className="text-xs text-muted-foreground">
              Paiements clients
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Chèques émis</CardTitle>
            <CreditCard className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{totalPaid.toFixed(2)} DH</div>
            <p className="text-xs text-muted-foreground">
              Paiements fournisseurs
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filtres */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Filter className="w-4 h-4" />
            Filtrer par période
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          </div>
        </CardContent>
      </Card>

      {/* Liste des chèques */}
      <Card>
        <CardHeader>
          <CardTitle>Détails des chèques</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {filteredCheques.map((cheque) => (
              <div
                key={`${cheque.type}-${cheque.id}`}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge className={cheque.type === 'payment' ? 'bg-green-100 text-green-800 border-0' : 'bg-red-100 text-red-800 border-0'}>
                      {cheque.type === 'payment' ? 'Reçu' : 'Émis'}
                    </Badge>
                    <span className="font-semibold">N° {cheque.numero_cheque}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {cheque.source}
                    {cheque.contract && ` • Contrat ${cheque.contract.numero_contrat}`}
                    {cheque.client && ` • ${cheque.client.nom} ${cheque.client.prenom}`}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Banque: {cheque.banque} • {format(new Date(cheque.date_paiement), 'dd MMMM yyyy', { locale: fr })}
                  </p>
                </div>
                <div className="text-right">
                  <p className={`text-lg font-bold ${cheque.type === 'payment' ? 'text-green-600' : 'text-red-600'}`}>
                    {cheque.type === 'payment' ? '+' : '-'}{cheque.montant.toFixed(2)} DH
                  </p>
                </div>
              </div>
            ))}

            {filteredCheques.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                Aucun chèque enregistré pour cette période
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
