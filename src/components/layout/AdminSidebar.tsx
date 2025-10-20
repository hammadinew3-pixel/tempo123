import { Home, Building, Users, Settings, Layers, Bell } from "lucide-react";
import { NavLink } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

  const menuItems = [
    { title: "Dashboard", url: "/admin/dashboard", icon: Home },
    { title: "Agences", url: "/admin/tenants", icon: Building },
    { title: "Utilisateurs", url: "/admin/users", icon: Users },
    { title: "Plans", url: "/admin/plans", icon: Layers },
    { title: "Demandes Abonnement", url: "/admin/demandes-abonnement", icon: Bell },
    { title: "Paramètres", url: "/admin/settings", icon: Settings },
  ];

export function AdminSidebar() {
  const { open } = useSidebar();

  return (
    <Sidebar className="bg-card border-r border-border">
      <SidebarContent className="bg-card">
        <SidebarGroup>
          <SidebarGroupLabel className="text-gray-400 text-xs uppercase tracking-wide">
            Menu Principal
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-3 py-2 rounded-md transition ${
                          isActive
                            ? "bg-primary/10 text-primary font-medium"
                            : "text-gray-300 hover:bg-accent hover:text-white"
                        }`
                      }
                    >
                      <item.icon className="h-4 w-4" />
                      {open && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
