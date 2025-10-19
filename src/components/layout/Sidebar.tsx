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
  Wrench,
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
  Globe,
  Building,
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
import { useTenantPlan } from '@/hooks/useTenantPlan';

interface NavItem {
  title: string;
  href?: string;
  icon: React.ComponentType<{ className?: string }>;
  submenu?: { title: string; href?: string; icon: React.ComponentType<{ className?: string }>; action?: string }[];
  action?: string;
}

const getMainNavItems = (isAdmin: boolean, isAgent: boolean, modules: any): NavItem[] => {
  const items: NavItem[] = [
    { title: "Tableau de bord", href: "/", icon: BarChart3 },
    { title: "Calendrier", href: "/calendrier", icon: Calendar },
    { title: "Clients", href: "/clients", icon: Users },
    { title: "Véhicules", href: "/vehicules", icon: Car },
    { 
      title: "Locations", 
      icon: MapPin,
      submenu: [
        { title: "Voir les locations", href: "/locations", icon: List },
        { title: "Ajouter une location", href: "/locations/nouveau", icon: Plus },
      ]
    },
  ];

  // Conditionnellement ajouter Assistance
  if (modules.assistance) {
    items.push({ 
      title: "Assistance", 
      icon: LifeBuoy,
      submenu: [
        { title: "Dossier d'assistance", href: "/assistance", icon: List },
        { title: "Nouveau Dossier", href: "/assistance/nouveau", icon: Plus },
        // "Listes des assurances" masqué pour les agents
        ...(isAgent ? [] : [{ title: "Listes des assurances", href: "/assurances", icon: Building2 }]),
        { title: "Factures Assurances", href: "/factures", icon: FileText },
      ]
    });
  }

  items.push({ title: "Maintenance", href: "/maintenance", icon: Wrench });

  // Conditionnellement ajouter Sinistre
  if (modules.sinistres) {
    items.push({ title: "Sinistre", href: "/sinistres", icon: AlertTriangle });
  }

  // Conditionnellement ajouter Infraction
  if (modules.infractions) {
    items.push({ title: "Infraction", href: "/infractions", icon: Shield });
  }

  items.push(
    { title: "Charges", href: "/charges", icon: DollarSign },
    { title: "Revenus", href: "/revenus", icon: TrendingUp }
  );

  // Conditionnellement ajouter Rapport
  if (modules.rapports) {
    items.push({ title: "Rapport", href: "/rapports", icon: BarChart });
  }

  // "Chèque", "Historique" et "Importer" masqués pour les agents
  if (!isAgent) {
    const insertIndex = items.findIndex(item => item.title === "Charges");
    if (insertIndex !== -1) {
      items.splice(insertIndex, 0, { title: "Chèque", href: "/cheques", icon: CreditCard });
    }
    items.push({ title: "Historique", href: "/historique", icon: Clock });
    items.push({ title: "Importer", href: "/importer", icon: Upload });
  }

  return items;
};

const adminNavItems: NavItem[] = [
  { title: "Utilisateurs", href: "/utilisateurs", icon: Users },
  { title: "Paramètres", href: "/parametres", icon: Settings },
];

const superAdminNavItems: NavItem[] = [
  { title: "Dashboard Global", href: "/admin/dashboard", icon: Globe },
  { title: "Gestion Tenants", href: "/admin/tenants", icon: Building },
];

interface SidebarProps {
  onOpenClientDialog?: () => void;
}

export const Sidebar = ({ onOpenClientDialog }: SidebarProps = {}) => {
  const location = useLocation();
  const { state } = useSidebar();
  const { isAdmin, isAgent, isSuperAdmin } = useUserRole();
  const collapsed = state === "collapsed";
  const { data: planData } = useTenantPlan();

  // Si pas de plan, afficher tous les modules (comportement par défaut)
  const modules = planData?.modules || {
    assistance: true,
    sinistres: true,
    infractions: true,
    alertes: true,
    rapports: true,
  };
  
  const mainNavItems = getMainNavItems(isAdmin, isAgent, modules);
  
  // Track which groups are open
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    locations: true,
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
        {/* Si super_admin, afficher UNIQUEMENT les menus super admin */}
        {isSuperAdmin ? (
          <SidebarGroup>
            <SidebarGroupLabel>Super Administration</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {superAdminNavItems.map((item) => (
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
        ) : (
          <>
            {/* Main Navigation pour admin/agent */}
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
          </>
        )}
      </SidebarContent>
    </SidebarUI>
  );
};
