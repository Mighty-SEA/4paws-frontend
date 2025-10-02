"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function OwnersLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const isOwnersActive = pathname.includes("/owners/owners");
  const isPetsActive = pathname.includes("/owners/pets");

  // Don't show layout for detail pages
  const isDetailPage = pathname.match(/\/owners\/\d+/);

  if (isDetailPage) {
    return <>{children}</>;
  }

  return (
    <div className="grid grid-cols-1 gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Owners & Hewan</h1>
        <Button asChild variant="outline" size="sm">
          <Link href="/dashboard/owners/species">Kelola Jenis Hewan</Link>
        </Button>
      </div>

      {/* Tab Navigation */}
      <div className="border-b">
        <div className="flex gap-1">
          <Link
            href="/dashboard/owners/owners"
            className={cn(
              "hover:text-primary px-4 py-2 text-sm font-medium transition-colors",
              isOwnersActive ? "border-primary text-primary border-b-2" : "text-muted-foreground",
            )}
          >
            Owners
          </Link>
          <Link
            href="/dashboard/owners/pets"
            className={cn(
              "hover:text-primary px-4 py-2 text-sm font-medium transition-colors",
              isPetsActive ? "border-primary text-primary border-b-2" : "text-muted-foreground",
            )}
          >
            Hewan
          </Link>
        </div>
      </div>

      {/* Page Content */}
      {children}
    </div>
  );
}
