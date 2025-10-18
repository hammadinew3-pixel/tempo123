import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileDown } from "lucide-react";

export default function TVA() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Déclaration TVA</h1>
          <p className="text-muted-foreground">TVA collectée, déductible et à payer</p>
        </div>
        <Button variant="outline">
          <FileDown className="h-4 w-4 mr-2" />
          Exporter CSV
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">TVA Collectée</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0,00 DH</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">TVA Déductible</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0,00 DH</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">TVA à Payer</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0,00 DH</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Détail TVA</CardTitle>
          <CardDescription>Période mensuelle ou trimestrielle</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            Aucune opération TVA pour la période sélectionnée
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
