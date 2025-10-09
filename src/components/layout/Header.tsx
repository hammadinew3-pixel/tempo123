import { Bell, LogOut, User } from "lucide-react";
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
import logoCrsapp from "@/assets/logo-crsapp.png";

export const Header = () => {
  const { user, signOut } = useAuth();

  return (
    <header className="bg-card shadow-sm border-b border-border sticky top-0 z-10">
      <div className="flex items-center justify-between px-3 md:px-6 py-2 md:py-3">
        <div className="flex items-center space-x-2 md:space-x-4">
          <SidebarTrigger />
          <div className="flex items-center space-x-2">
            <img src={logoCrsapp} alt="CRSapp" className="h-6 md:h-8" />
          </div>
        </div>
        <div className="flex items-center space-x-1 md:space-x-2">
          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground relative h-8 w-8 md:h-10 md:w-10">
            <Bell className="w-4 h-4 md:w-5 md:h-5" />
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
