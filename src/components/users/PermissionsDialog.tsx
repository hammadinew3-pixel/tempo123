import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Check, X } from "lucide-react";
import { UserRole } from "@/hooks/use-user-role";

interface PermissionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  role: UserRole;
}

const rolePermissions = {
  admin: {
    label: "Administrateur",
    color: "bg-green-500",
    permissions: [
      { module: "Tableau de bord", access: "Accès complet" },
      { module: "Véhicules", access: "Créer / Modifier / Supprimer / Consulter" },
      { module: "Clients", access: "Créer / Modifier / Supprimer / Consulter" },
      { module: "Contrats", access: "Créer / Modifier / Clôturer / Supprimer / Consulter" },
      { module: "Assistance", access: "Créer / Modifier / Supprimer / Consulter" },
      { module: "Sinistres", access: "Créer / Modifier / Supprimer / Consulter" },
      { module: "Infractions", access: "Créer / Modifier / Transmettre / Supprimer / Consulter" },
      { module: "Dépenses", access: "Créer / Modifier / Supprimer / Consulter" },
      { module: "Paramètres", access: "Modifier / Consulter" },
      { module: "Utilisateurs", access: "Gérer tous les utilisateurs" },
    ],
  },
  agent: {
    label: "Agent commercial",
    color: "bg-blue-500",
    permissions: [
      { module: "Tableau de bord", access: "Lecture seule des indicateurs" },
      { module: "Véhicules", access: "Lecture + mise à jour du kilométrage et statut" },
      { module: "Clients", access: "Créer / Modifier / Consulter" },
      { module: "Contrats", access: "Créer / Modifier / Clôturer" },
      { module: "Assistance", access: "Créer / Modifier" },
      { module: "Sinistres", access: "Créer / Modifier / Consulter" },
      { module: "Infractions", access: "Créer / Marquer comme transmis" },
      { module: "Dépenses", access: "Lecture seule" },
      { module: "Paramètres", access: "Aucun accès", denied: true },
      { module: "Utilisateurs", access: "Aucun accès", denied: true },
    ],
  },
  comptable: {
    label: "Comptable",
    color: "bg-purple-500",
    permissions: [
      { module: "Tableau de bord", access: "Lecture seule des indicateurs" },
      { module: "Véhicules", access: "Consulter" },
      { module: "Clients", access: "Consulter" },
      { module: "Contrats", access: "Consulter" },
      { module: "Assistance", access: "Consulter" },
      { module: "Sinistres", access: "Consulter" },
      { module: "Infractions", access: "Consulter" },
      { module: "Dépenses", access: "Créer / Modifier / Supprimer / Consulter" },
      { module: "Paramètres", access: "Aucun accès", denied: true },
      { module: "Utilisateurs", access: "Aucun accès", denied: true },
    ],
  },
};

export function PermissionsDialog({ open, onOpenChange, role }: PermissionsDialogProps) {
  if (!role) return null;

  const roleInfo = rolePermissions[role];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Permissions du rôle
            <Badge className={roleInfo.color}>{roleInfo.label}</Badge>
          </DialogTitle>
          <DialogDescription>
            Détail des droits d'accès et permissions accordées
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {roleInfo.permissions.map((perm, index) => (
            <div
              key={index}
              className="flex items-start gap-3 p-3 border rounded-lg"
            >
              <div className={`mt-0.5 ${perm.denied ? 'text-destructive' : 'text-green-500'}`}>
                {perm.denied ? (
                  <X className="w-5 h-5" />
                ) : (
                  <Check className="w-5 h-5" />
                )}
              </div>
              <div className="flex-1">
                <p className="font-medium">{perm.module}</p>
                <p className={`text-sm ${perm.denied ? 'text-destructive' : 'text-muted-foreground'}`}>
                  {perm.access}
                </p>
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
