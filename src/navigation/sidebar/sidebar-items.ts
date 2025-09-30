import {
  Users,
  PawPrint,
  Package,
  CalendarDays,
  CreditCard,
  BarChart3,
  UserCog,
  ClipboardList,
  Settings,
  type LucideIcon,
} from "lucide-react";

export interface NavSubItem {
  title: string;
  url: string;
  icon?: LucideIcon;
  comingSoon?: boolean;
  newTab?: boolean;
  isNew?: boolean;
}

export interface NavMainItem {
  title: string;
  url: string;
  icon?: LucideIcon;
  subItems?: NavSubItem[];
  comingSoon?: boolean;
  newTab?: boolean;
  isNew?: boolean;
}

export interface NavGroup {
  id: number;
  label?: string;
  items: NavMainItem[];
}

export const sidebarItems: NavGroup[] = [
  // {
  //   id: 1,
  //   label: "Dashboards",
  //   items: [
  //     {
  //       title: "Default",
  //       url: "/dashboard/default",
  //       icon: LayoutDashboard,
  //     },
  //     {
  //       title: "CRM",
  //       url: "/dashboard/crm",
  //       icon: ChartBar,
  //     },
  //     {
  //       title: "Finance",
  //       url: "/dashboard/finance",
  //       icon: Banknote,
  //     },
  //   ],
  // },
  {
    id: 2,
    label: "Pages",
    items: [
      {
        title: "Bookings",
        url: "/dashboard/bookings",
        icon: CalendarDays,
      },
      {
        title: "Owners",
        url: "/dashboard/owners",
        icon: Users,
      },
      {
        title: "Services",
        url: "/dashboard/services",
        icon: PawPrint,
      },
      {
        title: "Products",
        url: "/dashboard/products",
        icon: Package,
      },
      {
        title: "Petshop",
        url: "/dashboard/petshop",
        icon: Package,
      },
      {
        title: "Pembayaran",
        url: "/dashboard/payments",
        icon: CreditCard,
      },
      {
        title: "Laporan",
        url: "/dashboard/reports",
        icon: BarChart3,
      },
      {
        title: "Medical Record",
        url: "/dashboard/medical-records",
        icon: ClipboardList,
      },
      {
        title: "Karyawan",
        url: "/dashboard/employees",
        icon: UserCog,
      },
      // {
      //   title: "Authentication",
      //   url: "/auth",
      //   icon: Fingerprint,
      //   subItems: [
      //     { title: "Login v1", url: "/auth/v1/login", newTab: true },
      //     { title: "Login v2", url: "/auth/v2/login", newTab: true },
      //     { title: "Register v1", url: "/auth/v1/register", newTab: true },
      //     { title: "Register v2", url: "/auth/v2/register", newTab: true },
      //   ],
      // },
    ],
  },
];
