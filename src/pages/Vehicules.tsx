import { Search, Filter, Download, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const vehicles = [
  {
    id: "VEH-001",
    brand: "Toyota",
    model: "Corolla",
    year: "2023",
    plate: "AB-123-CD",
    status: "available",
    category: "Berline",
  },
];

export default function Vehicules() {
  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Liste des véhicules</h1>
          <p className="text-sm text-muted-foreground">Gérez votre flotte de véhicules</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Exporter
          </Button>
          <Button size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Nouveau véhicule
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Véhicules</CardTitle>
            <div className="flex items-center space-x-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Rechercher..."
                  className="pl-10 w-64"
                />
              </div>
              <Button variant="outline" size="sm">
                <Filter className="w-4 h-4 mr-2" />
                Filtres
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-sm text-muted-foreground border-b">
                  <th className="pb-3 font-medium">ID</th>
                  <th className="pb-3 font-medium">Marque</th>
                  <th className="pb-3 font-medium">Modèle</th>
                  <th className="pb-3 font-medium">Année</th>
                  <th className="pb-3 font-medium">Immatriculation</th>
                  <th className="pb-3 font-medium">Catégorie</th>
                  <th className="pb-3 font-medium">Statut</th>
                  <th className="pb-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {vehicles.map((vehicle) => (
                  <tr key={vehicle.id} className="border-b last:border-0 hover:bg-muted/50">
                    <td className="py-4 font-medium text-foreground">{vehicle.id}</td>
                    <td className="py-4 text-foreground">{vehicle.brand}</td>
                    <td className="py-4 text-foreground">{vehicle.model}</td>
                    <td className="py-4 text-foreground">{vehicle.year}</td>
                    <td className="py-4 text-foreground">{vehicle.plate}</td>
                    <td className="py-4 text-foreground">{vehicle.category}</td>
                    <td className="py-4">
                      <Badge variant="default" className="bg-[hsl(var(--info))] text-white">
                        Disponible
                      </Badge>
                    </td>
                    <td className="py-4">
                      <div className="flex space-x-2">
                        <Button variant="ghost" size="sm">Voir</Button>
                        <Button variant="ghost" size="sm">Modifier</Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
