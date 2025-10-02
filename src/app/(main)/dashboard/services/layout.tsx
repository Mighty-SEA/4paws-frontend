"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

export default function ServicesLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const isServicesActive = pathname.includes("/services/services");
  const isTypesActive = pathname.includes("/services/types");

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold">Service Catalog</h1>

      {/* Tab Navigation */}
      <div className="border-b">
        <div className="flex gap-1">
          <Link
            href="/dashboard/services/services"
            className={cn(
              "hover:text-primary px-4 py-2 text-sm font-medium transition-colors",
              isServicesActive ? "border-primary text-primary border-b-2" : "text-muted-foreground",
            )}
          >
            Services
          </Link>
          <Link
            href="/dashboard/services/types"
            className={cn(
              "hover:text-primary px-4 py-2 text-sm font-medium transition-colors",
              isTypesActive ? "border-primary text-primary border-b-2" : "text-muted-foreground",
            )}
          >
            Service Types
          </Link>
        </div>
      </div>

      {/* Page Content */}
      {children}
    </div>
  );
}
