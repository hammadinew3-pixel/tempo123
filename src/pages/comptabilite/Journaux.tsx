import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, FileDown } from "lucide-react";

export default function Journaux() {
  const [searchTerm, setSearchTerm] = useState("");

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Journaux Comptables</h1>
          <p className="text-muted-foreground">Consultation et saisie des écritures comptables</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <FileDown className="h-4 w-4 mr-2" />
            Exporter CSV
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Nouvelle OD
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Liste des écritures</CardTitle>
          <CardDescription>Filtrez par journal, période ou référence</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <Input
              placeholder="Rechercher une écriture..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <p className="text-muted-foreground text-center py-8">
            Aucune écriture comptable pour le moment
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
