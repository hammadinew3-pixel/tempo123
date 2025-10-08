import { Link, useLocation } from "react-router-dom";
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
  ChevronDown,
  Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTenant } from "@/contexts/TenantContext";

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  hasSubmenu?: boolean;
}

const mainNavItems: NavItem[] = [
  { title: "Tableau de bord", href: "/", icon: BarChart3 },
  { title: "Calendrier", href: "/calendrier", icon: Calendar },
  { title: "Locations", href: "/locations", icon: MapPin, hasSubmenu: true },
  { title: "Véhicules", href: "/vehicules", icon: Car, hasSubmenu: true },
  { title: "Catégories", href: "/categories", icon: Grid3x3 },
  { title: "Clients", href: "/clients", icon: Users },
  { title: "Factures", href: "/factures", icon: FileText },
  { title: "Chèques", href: "/cheques", icon: CreditCard },
  { title: "Longue durée", href: "/longue-duree", icon: Clock, hasSubmenu: true },
  { title: "Revenus", href: "/revenus", icon: TrendingUp },
  { title: "Charges", href: "/charges", icon: DollarSign },
  { title: "Statistiques", href: "/statistiques", icon: BarChart },
  { title: "Importer", href: "/importer", icon: Upload, hasSubmenu: true },
  { title: "Contact & Support", href: "/support", icon: HelpCircle },
];

const adminNavItems: NavItem[] = [
  { title: "Mon compte", href: "/compte", icon: User },
  { title: "Mes Utilisateurs", href: "/utilisateurs", icon: Users },
];

export const Sidebar = () => {
  const location = useLocation();
  const { isSuperAdmin } = useTenant();

  const isActive = (href: string) => {
    if (href === "/") {
      return location.pathname === "/";
    }
    return location.pathname.startsWith(href);
  };

  return (
    <aside className="w-64 bg-sidebar-background min-h-screen text-sidebar-foreground">
      <nav className="p-4">
        <ul className="space-y-1">
          {mainNavItems.map((item) => (
            <li key={item.href}>
              {item.hasSubmenu ? (
                <div className="flex items-center justify-between p-3 rounded-lg text-sidebar-foreground hover:bg-sidebar-accent cursor-pointer">
                  <div className="flex items-center space-x-3">
                    <item.icon className="w-5 h-5" />
                    <span>{item.title}</span>
                  </div>
                  <ChevronDown className="w-4 h-4" />
                </div>
              ) : (
                <Link
                  to={item.href}
                  className={cn(
                    "flex items-center space-x-3 p-3 rounded-lg transition-colors",
                    isActive(item.href)
                      ? "bg-sidebar-primary text-sidebar-primary-foreground"
                      : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  )}
                >
                  <item.icon className="w-5 h-5" />
                  <span>{item.title}</span>
                </Link>
              )}
            </li>
          ))}
        </ul>

        <div className="mt-8 pt-4 border-t border-sidebar-border">
          <p className="text-sm text-sidebar-foreground opacity-60 mb-4 px-3">Menu Administration</p>
          <ul className="space-y-1">
            {isSuperAdmin && (
              <li>
                <Link
                  to="/admin"
                  className={cn(
                    "flex items-center space-x-3 p-3 rounded-lg transition-colors",
                    isActive("/admin")
                      ? "bg-sidebar-primary text-sidebar-primary-foreground"
                      : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  )}
                >
                  <Shield className="w-5 h-5" />
                  <span>Plateforme</span>
                </Link>
              </li>
            )}
            {adminNavItems.map((item) => (
              <li key={item.href}>
                <Link
                  to={item.href}
                  className={cn(
                    "flex items-center space-x-3 p-3 rounded-lg transition-colors",
                    isActive(item.href)
                      ? "bg-sidebar-primary text-sidebar-primary-foreground"
                      : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  )}
                >
                  <item.icon className="w-5 h-5" />
                  <span>{item.title}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </nav>
    </aside>
  );
};
