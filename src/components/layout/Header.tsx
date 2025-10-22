import { Bell, LogOut, User, Plus, UserPlus, Car, FileText } from "lucide-react";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/AuthContext";
import { useAlertes } from "@/contexts/AlertesContext";
import { useNavigate } from "react-router-dom";
import { useUserRole } from "@/hooks/use-user-role";
import { Badge } from "@/components/ui/badge";
import { Shield } from "lucide-react";
import logoCrsapp from "@/assets/logo-crsapp.png";
import { useLayoutContext } from "@/components/layout/Layout";
import { OfflineSyncButton } from "./OfflineSyncButton";
import { useTenantSettings } from "@/hooks/use-tenant-settings";

export const Header = () => {
  const { user, signOut } = useAuth();
  const { totalAlerts, refreshAlerts } = useAlertes();
  const { role } = useUserRole();
  const navigate = useNavigate();
  const { setIsClientDialogOpen } = useLayoutContext();
  const { data: tenantSettings } = useTenantSettings();

  useEffect(() => {
    refreshAlerts();
  }, []);

  return (
    <header className="bg-card shadow-sm border-b border-border sticky top-0 z-10">
      <div className="flex items-center justify-between px-3 md:px-6 py-2 md:py-3">
        <div className="flex items-center space-x-2 md:space-x-4">
          <SidebarTrigger />
          <div className="flex items-center space-x-2">
            <img 
              src={tenantSettings?.logo_url || logoCrsapp} 
              alt={tenantSettings?.nom || "CRSapp"} 
              className="h-6 md:h-8 object-contain" 
            />
          </div>
        </div>
        <div className="flex items-center space-x-1 md:space-x-2">
          <OfflineSyncButton />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-muted-foreground hover:text-foreground h-8 w-8 md:h-10 md:w-10"
              >
                <Plus className="w-4 h-4 md:w-5 md:h-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="z-50 bg-card">
              <DropdownMenuLabel>Création rapide</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => {
                navigate("/clients");
                setTimeout(() => setIsClientDialogOpen(true), 100);
              }}>
                <UserPlus className="mr-2 h-4 w-4" />
                Nouveau client
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate("/vehicules/nouveau")}>
                <Car className="mr-2 h-4 w-4" />
                Nouveau véhicule
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate("/locations/nouveau")}>
                <FileText className="mr-2 h-4 w-4" />
                Nouvelle location
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-muted-foreground hover:text-foreground relative h-8 w-8 md:h-10 md:w-10"
            onClick={() => navigate("/alertes")}
          >
            <Bell className="w-4 h-4 md:w-5 md:h-5" />
            {totalAlerts > 0 && (
              <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                {totalAlerts > 99 ? "99+" : totalAlerts}
              </span>
            )}
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground h-8 w-8 md:h-10 md:w-10">
                <Avatar className="w-7 h-7 md:w-8 md:h-8">
                  <AvatarFallback>
                    {user?.email?.charAt(0).toUpperCase() || <User className="w-3 h-3 md:w-4 md:h-4" />}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="z-50 bg-card">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium">{user?.user_metadata?.nom || 'Utilisateur'}</p>
                  <p className="text-xs text-muted-foreground truncate max-w-[200px]">{user?.email}</p>
                  {role && (
                    <Badge 
                      variant={role === 'admin' ? 'default' : 'secondary'}
                      className={`mt-1 ${role === 'admin' ? 'bg-green-500' : 'bg-blue-500'}`}
                    >
                      {role === 'admin' ? (
                        <><Shield className="w-3 h-3 mr-1" /> Admin</>
                      ) : (
                        <>Agent</>
                      )}
                    </Badge>
                  )}
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => signOut()}>
                <LogOut className="mr-2 h-4 w-4" />
                Déconnexion
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};
