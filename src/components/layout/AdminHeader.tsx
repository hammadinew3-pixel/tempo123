import { ShieldCheck, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { SidebarTrigger } from "@/components/ui/sidebar";

export function AdminHeader() {
  const navigate = useNavigate();

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("Erreur lors de la déconnexion");
      return;
    }
    toast.success("Déconnexion réussie");
    navigate("/admin/login");
  };

  return (
    <header className="h-14 bg-card border-b border-border flex items-center justify-between px-6">
      <div className="flex items-center gap-3">
        <SidebarTrigger className="text-gray-400 hover:text-white" />
        <div className="flex items-center gap-2">
          <ShieldCheck className="text-primary h-5 w-5" />
          <h1 className="font-bold text-lg text-white">CRS Console</h1>
        </div>
      </div>
      <button
        onClick={handleLogout}
        className="flex items-center gap-2 text-gray-300 hover:text-red-400 transition"
      >
        <LogOut className="h-4 w-4" />
        <span className="text-sm">Déconnexion</span>
      </button>
    </header>
  );
}
