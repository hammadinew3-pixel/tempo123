import { Link } from "react-router-dom";
import { ChevronRight, Edit, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Database } from "@/integrations/supabase/types";

type Vehicle = Database['public']['Tables']['vehicles']['Row'];

interface VehicleHeaderProps {
  vehicle: Vehicle;
  onEdit: () => void;
}

export function VehicleHeader({ vehicle, onEdit }: VehicleHeaderProps) {
  const statusBadge = vehicle.statut === 'disponible' ? 'Libre' :
                     vehicle.statut === 'loue' ? 'Loué' : 
                     vehicle.statut === 'reserve' ? 'Réservé' : 'En panne';
  
  const statusColor = vehicle.statut === 'disponible' ? 'bg-green-500' : 
                     vehicle.statut === 'loue' ? 'bg-blue-500' : 
                     vehicle.statut === 'reserve' ? 'bg-yellow-500' : 'bg-red-500';

  return (
    <div className="relative bg-gradient-to-br from-primary/10 via-primary/5 to-background rounded-lg p-6 border shadow-sm animate-fade-in">
      <div className="flex items-start justify-between">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${statusColor} animate-pulse`} />
            <h1 className="text-3xl font-bold text-foreground">
              {vehicle.marque} {vehicle.modele}
            </h1>
            <Badge className={`${statusColor} text-white`}>{statusBadge}</Badge>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link to="/" className="hover:text-foreground transition-colors">Tableau de bord</Link>
            <ChevronRight className="w-4 h-4" />
            <Link to="/vehicules" className="hover:text-foreground transition-colors">Véhicules</Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-foreground font-medium">Mat. {vehicle.immatriculation}</span>
          </div>

          <div className="flex items-center gap-4 pt-2">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Immatriculation:</span>
              <span className="font-mono font-semibold bg-muted px-3 py-1 rounded">{vehicle.immatriculation}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Année:</span>
              <span className="font-semibold">{vehicle.annee}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Kilométrage:</span>
              <span className="font-semibold">{vehicle.kilometrage.toLocaleString()} km</span>
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <Button onClick={onEdit} className="hover-scale">
            <Edit className="w-4 h-4 mr-2" />
            Modifier
          </Button>
        </div>
      </div>
    </div>
  );
}
