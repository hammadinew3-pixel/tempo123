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
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 sticky top-0 z-10">
      <div className="flex items-center gap-3">
        <SidebarTrigger className="text-gray-600 hover:text-black" />
        <div className="flex items-center gap-2">
          <ShieldCheck className="text-red-500 h-5 w-5" />
          <h1 className="font-semibold text-lg text-black">CRS Console</h1>
        </div>
      </div>
      <button
        onClick={handleLogout}
        className="flex items-center gap-2 bg-[#c01533] hover:bg-[#9a0f26] text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
      >
        <LogOut className="h-4 w-4" />
        <span>Déconnexion</span>
      </button>
    </header>
  );
}
