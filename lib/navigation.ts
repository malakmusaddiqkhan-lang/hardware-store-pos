// lib/navigation.ts
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Package, 
  Users, 
  Receipt, 
  TrendingUp 
} from "lucide-react";

export interface NavItem {
  title: string;
  href: string;
  icon: any;
  roles: ("OWNER" | "STAFF")[];
}

export const navItems: NavItem[] = [
  {
    title: "POS Counter",
    href: "/pos",
    icon: ShoppingCart,
    roles: ["OWNER", "STAFF"],
  },
  {
    title: "Inventory",
    href: "/inventory",
    icon: Package,
    roles: ["OWNER", "STAFF"],
  },
  {
    title: "Dashboard",
    href: "/",
    icon: LayoutDashboard,
    roles: ["OWNER"],
  },
  {
    title: "Customer Ledger",
    href: "/customers",
    icon: Users,
    roles: ["OWNER", "STAFF"],
  },
  {
    title: "Sales History",
    href: "/sales",
    icon: Receipt,
    roles: ["OWNER", "STAFF"],
  },
  {
    title: "Finances",
    href: "/finances",
    icon: TrendingUp,
    roles: ["OWNER"],
  },
];