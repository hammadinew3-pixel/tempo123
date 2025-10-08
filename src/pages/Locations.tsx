import { Search, Filter, Download, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const reservations = [
  {
    id: "LOC-001",
    vehicle: "Toyota Corolla",
    client: "Jean Dupont",
    startDate: "2025-10-10",
    endDate: "2025-10-15",
    status: "confirmed",
    amount: "450€",
  },
];

export default function Locations() {
  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Liste des réservations</h1>
          <p className="text-sm text-muted-foreground">Gérez vos locations de véhicules</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Exporter
          </Button>
          <Button size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Nouvelle réservation
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Réservations</CardTitle>
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
                  <th className="pb-3 font-medium">N° Réservation</th>
                  <th className="pb-3 font-medium">Véhicule</th>
                  <th className="pb-3 font-medium">Client</th>
                  <th className="pb-3 font-medium">Date début</th>
                  <th className="pb-3 font-medium">Date fin</th>
                  <th className="pb-3 font-medium">Montant</th>
                  <th className="pb-3 font-medium">Statut</th>
                  <th className="pb-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {reservations.map((reservation) => (
                  <tr key={reservation.id} className="border-b last:border-0 hover:bg-muted/50">
                    <td className="py-4 font-medium text-foreground">{reservation.id}</td>
                    <td className="py-4 text-foreground">{reservation.vehicle}</td>
                    <td className="py-4 text-foreground">{reservation.client}</td>
                    <td className="py-4 text-foreground">{reservation.startDate}</td>
                    <td className="py-4 text-foreground">{reservation.endDate}</td>
                    <td className="py-4 text-foreground">{reservation.amount}</td>
                    <td className="py-4">
                      <Badge variant="default" className="bg-[hsl(var(--success))] text-white">
                        Confirmée
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
