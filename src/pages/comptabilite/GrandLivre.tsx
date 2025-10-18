import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileDown } from "lucide-react";

export default function GrandLivre() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Grand-Livre</h1>
          <p className="text-muted-foreground">Mouvements comptables par compte</p>
        </div>
        <Button variant="outline">
          <FileDown className="h-4 w-4 mr-2" />
          Exporter CSV
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Sélection du compte</CardTitle>
          <CardDescription>Choisissez un compte et une période pour consulter les mouvements</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            Sélectionnez un compte pour afficher son grand-livre
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
