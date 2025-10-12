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
  LifeBuoy,
  Building2,
  AlertTriangle,
  Settings,
  Shield,
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
import { useUserRole } from "@/hooks/use-user-role";

interface NavItem {
  title: string;
  href?: string;
  icon: React.ComponentType<{ className?: string }>;
  submenu?: { title: string; href?: string; icon: React.ComponentType<{ className?: string }>; action?: string }[];
  action?: string;
}

const getMainNavItems = (isAdmin: boolean): NavItem[] => [
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
    title: "Assistance", 
    icon: LifeBuoy,
    submenu: [
      { title: "Dossiers d'assistance", href: "/assistance", icon: List },
      { title: "Nouveau dossier", href: "/assistance/nouveau", icon: Plus },
      { title: "Liste des assurances", href: "/assurances", icon: Building2 },
      { title: "Factures Assurance", href: "/factures", icon: FileText },
    ]
  },
  { 
    title: "Véhicules", 
    icon: Car,
    submenu: [
      { title: "Voir les véhicules", href: "/vehicules", icon: List },
      ...(isAdmin ? [{ title: "Ajouter véhicule", href: "/vehicules/nouveau", icon: Plus }] : []),
    ]
  },
  { 
    title: "Clients", 
    icon: Users,
    submenu: [
      { title: "Voir les clients", href: "/clients", icon: List },
      { title: "Ajouter client", action: "open-client-dialog", icon: Plus },
    ]
  },
  { title: "Sinistres", href: "/sinistres", icon: AlertTriangle },
  { 
    title: "Infractions", 
    icon: AlertTriangle,
    submenu: [
      { title: "Liste des infractions", href: "/infractions", icon: List },
      { title: "Nouvelle infraction", href: "/infractions/nouveau", icon: Plus },
    ]
  },
  { title: "Chèques", href: "/cheques", icon: CreditCard },
  { title: "Revenus", href: "/revenus", icon: TrendingUp },
  { title: "Charges", href: "/charges", icon: DollarSign },
  { title: "Statistiques", href: "/statistiques", icon: BarChart },
  { title: "Rapports", href: "/rapports", icon: BarChart3 },
  { title: "Historique", href: "/historique", icon: Clock },
  { title: "Importer", href: "/importer", icon: Upload },
  { title: "Contact & Support", href: "/support", icon: HelpCircle },
];

const adminNavItems: NavItem[] = [
  { title: "Utilisateurs", href: "/utilisateurs", icon: Users },
  { title: "Paramètres", href: "/parametres", icon: Settings },
];

interface SidebarProps {
  onOpenClientDialog?: () => void;
}

export const Sidebar = ({ onOpenClientDialog }: SidebarProps = {}) => {
  const location = useLocation();
  const { state } = useSidebar();
  const { isAdmin } = useUserRole();
  const collapsed = state === "collapsed";
  
  const mainNavItems = getMainNavItems(isAdmin);
  
  // Track which groups are open
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    locations: true,
    vehicules: true,
    clients: true,
    assistance: true,
  });

  const isActive = (href?: string) => {
    if (!href) return false;
    if (href === "/") {
      return location.pathname === "/";
    }
    return location.pathname.startsWith(href);
  };

  const isGroupActive = (submenu?: NavItem["submenu"]) => {
    if (!submenu) return false;
    return submenu.some(item => item.href && isActive(item.href));
  };

  const toggleGroup = (key: string) => {
    setOpenGroups(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleItemClick = (item: { href?: string; action?: string }) => {
    if (item.action === "open-client-dialog" && onOpenClientDialog) {
      onOpenClientDialog();
    }
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
                              <SidebarMenuSubItem key={subItem.href || subItem.action}>
                                <SidebarMenuSubButton
                                  asChild={!!subItem.href}
                                  className={getNavCls(isActive(subItem.href))}
                                  onClick={() => !subItem.href && handleItemClick(subItem)}
                                >
                                  {subItem.href ? (
                                    <NavLink to={subItem.href}>
                                      <subItem.icon className="h-4 w-4" />
                                      <span>{subItem.title}</span>
                                    </NavLink>
                                  ) : (
                                    <div className="flex items-center gap-2 cursor-pointer">
                                      <subItem.icon className="h-4 w-4" />
                                      <span>{subItem.title}</span>
                                    </div>
                                  )}
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
        {isAdmin && (
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
        )}
      </SidebarContent>
    </SidebarUI>
  );
};
