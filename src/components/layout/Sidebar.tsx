import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  BarChart3,
  Calendar,
  MapPin,
  Car,
  Grid3x3,
  Users,
  FileText,
  CreditCard,
  Clock,
  TrendingUp,
  DollarSign,
  BarChart,
  Upload,
  HelpCircle,
  User,
  Plus,
  List,
  ChevronRight,
} from "lucide-react";
import {
  Sidebar as SidebarUI,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface NavItem {
  title: string;
  href?: string;
  icon: React.ComponentType<{ className?: string }>;
  submenu?: { title: string; href: string; icon: React.ComponentType<{ className?: string }> }[];
}

const mainNavItems: NavItem[] = [
  { title: "Tableau de bord", href: "/", icon: BarChart3 },
  { title: "Calendrier", href: "/calendrier", icon: Calendar },
  { 
    title: "Locations", 
    icon: MapPin,
    submenu: [
      { title: "Liste des locations", href: "/locations", icon: List },
      { title: "Ajouter location", href: "/locations/nouveau", icon: Plus },
    ]
  },
  { 
    title: "Véhicules", 
    icon: Car,
    submenu: [
      { title: "Voir les véhicules", href: "/vehicules", icon: List },
      { title: "Ajouter véhicule", href: "/vehicules/nouveau", icon: Plus },
    ]
  },
  { title: "Catégories", href: "/categories", icon: Grid3x3 },
  { 
    title: "Clients", 
    icon: Users,
    submenu: [
      { title: "Voir les clients", href: "/clients", icon: List },
      { title: "Ajouter client", href: "/clients/nouveau", icon: Plus },
    ]
  },
  { title: "Factures", href: "/factures", icon: FileText },
  { title: "Chèques", href: "/cheques", icon: CreditCard },
  { title: "Longue durée", href: "/longue-duree", icon: Clock },
  { title: "Revenus", href: "/revenus", icon: TrendingUp },
  { title: "Charges", href: "/charges", icon: DollarSign },
  { title: "Statistiques", href: "/statistiques", icon: BarChart },
  { title: "Importer", href: "/importer", icon: Upload },
  { title: "Contact & Support", href: "/support", icon: HelpCircle },
];

const adminNavItems: NavItem[] = [
  { title: "Mon compte", href: "/compte", icon: User },
  { title: "Mes Utilisateurs", href: "/utilisateurs", icon: Users },
];

export const Sidebar = () => {
  const location = useLocation();
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  
  // Track which groups are open
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    locations: true,
    vehicules: true,
    clients: true,
  });

  const isActive = (href: string) => {
    if (href === "/") {
      return location.pathname === "/";
    }
    return location.pathname.startsWith(href);
  };

  const isGroupActive = (submenu?: NavItem["submenu"]) => {
    if (!submenu) return false;
    return submenu.some(item => isActive(item.href));
  };

  const toggleGroup = (key: string) => {
    setOpenGroups(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const getNavCls = (isActive: boolean) =>
    isActive ? "bg-sidebar-primary text-sidebar-primary-foreground font-medium" : "hover:bg-sidebar-accent";

  return (
    <SidebarUI collapsible="icon" className="border-r border-sidebar-border">
      <SidebarContent>
        {/* Main Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel>Menu Principal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavItems.map((item) => {
                const groupKey = item.title.toLowerCase();
                const hasSubmenu = !!item.submenu;
                const groupActive = isGroupActive(item.submenu);

                if (hasSubmenu) {
                  return (
                    <Collapsible
                      key={item.title}
                      open={openGroups[groupKey]}
                      onOpenChange={() => toggleGroup(groupKey)}
                      className="group/collapsible"
                    >
                      <SidebarMenuItem>
                        <CollapsibleTrigger asChild>
                          <SidebarMenuButton
                            className={getNavCls(groupActive)}
                            tooltip={item.title}
                          >
                            <item.icon className="h-4 w-4" />
                            {!collapsed && <span>{item.title}</span>}
                            {!collapsed && (
                              <ChevronRight 
                                className="ml-auto h-4 w-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" 
                              />
                            )}
                          </SidebarMenuButton>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <SidebarMenuSub>
                            {item.submenu?.map((subItem) => (
                              <SidebarMenuSubItem key={subItem.href}>
                                <SidebarMenuSubButton
                                  asChild
                                  className={getNavCls(isActive(subItem.href))}
                                >
                                  <NavLink to={subItem.href}>
                                    <subItem.icon className="h-4 w-4" />
                                    <span>{subItem.title}</span>
                                  </NavLink>
                                </SidebarMenuSubButton>
                              </SidebarMenuSubItem>
                            ))}
                          </SidebarMenuSub>
                        </CollapsibleContent>
                      </SidebarMenuItem>
                    </Collapsible>
                  );
                }

                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      className={getNavCls(isActive(item.href!))}
                      tooltip={item.title}
                    >
                      <NavLink to={item.href!}>
                        <item.icon className="h-4 w-4" />
                        {!collapsed && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Admin Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel>Administration</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {adminNavItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    className={getNavCls(isActive(item.href!))}
                    tooltip={item.title}
                  >
                    <NavLink to={item.href!}>
                      <item.icon className="h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </SidebarUI>
  );
};
