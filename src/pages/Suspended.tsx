import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { Ban, Mail } from "lucide-react";

export default function Suspended() {
  const { signOut } = useAuth();

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="max-w-md w-full p-8 text-center space-y-6">
        <div className="flex justify-center">
          <div className="p-4 bg-destructive/10 rounded-full">
            <Ban className="h-12 w-12 text-destructive" />
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold">Compte Suspendu</h1>
          <p className="text-muted-foreground">
            Votre compte agence est actuellement suspendu et vous ne pouvez pas accéder à l'application.
          </p>
        </div>

        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Pour plus d'informations ou pour réactiver votre compte, veuillez contacter l'administrateur.
          </p>

          <div className="flex flex-col gap-3">
            <Button variant="outline" asChild>
              <a href="mailto:support@crsapp.com">
                <Mail className="h-4 w-4 mr-2" />
                Contacter le Support
              </a>
            </Button>

            <Button variant="secondary" onClick={signOut}>
              Se déconnecter
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
