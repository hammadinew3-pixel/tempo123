import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileDown } from "lucide-react";

export default function Balance() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Balance Comptable</h1>
          <p className="text-muted-foreground">Totaux par compte pour une période donnée</p>
        </div>
        <Button variant="outline">
          <FileDown className="h-4 w-4 mr-2" />
          Exporter Excel
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Balance des comptes</CardTitle>
          <CardDescription>Débits, crédits et soldes par compte</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            Aucune donnée pour la période sélectionnée
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
