import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { useAccountingSync } from "@/hooks/use-accounting-sync";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function ParametresComptabilite() {
  const { isSyncing, syncExistingData } = useAccountingSync();

  const handleSync = async () => {
    await syncExistingData();
  };
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Paramètres Comptabilité</h1>
          <p className="text-muted-foreground">Configuration des comptes et taux de TVA</p>
        </div>
        <Button onClick={handleSync} disabled={isSyncing}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
          {isSyncing ? 'Synchronisation...' : 'Synchroniser les données'}
        </Button>
      </div>

      <Alert>
        <AlertDescription>
          Cliquez sur "Synchroniser les données" pour générer automatiquement les écritures comptables à partir des contrats, revenus, dépenses et chèques existants.
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="comptes">
        <TabsList>
          <TabsTrigger value="comptes">Mapping Comptes</TabsTrigger>
          <TabsTrigger value="tva">Taux TVA</TabsTrigger>
          <TabsTrigger value="sequences">Séquences</TabsTrigger>
        </TabsList>

        <TabsContent value="comptes">
          <Card>
            <CardHeader>
              <CardTitle>Mapping des Comptes</CardTitle>
              <CardDescription>Associez les comptes aux opérations métiers</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-center py-8">
                Configuration des comptes par défaut
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tva">
          <Card>
            <CardHeader>
              <CardTitle>Taux de TVA</CardTitle>
              <CardDescription>Gestion des taux de TVA applicables</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-center py-8">
                TVA20 (20%), TVA10 (10%), TVA7 (7%), TVA0, Exonéré, Non assujetti
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sequences">
          <Card>
            <CardHeader>
              <CardTitle>Séquences des Journaux</CardTitle>
              <CardDescription>Numérotation automatique des pièces comptables</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-center py-8">
                VEN, ACH, BNK, CAI, OD - Séquences par journal
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
