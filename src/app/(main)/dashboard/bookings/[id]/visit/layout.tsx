"use client";

import Link from "next/link";
import { usePathname, useParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function VisitLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const params = useParams();
  const id = params.id as string;

  const isFormActive = pathname.includes("/visit/form");
  const isHistoryActive = pathname.includes("/visit/history");

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Visit Booking #{id}</h1>
        <Button asChild variant="outline">
          <Link href={`/dashboard/bookings/${id}`}>Kembali ke Detail</Link>
        </Button>
      </div>

      {/* Tab Navigation */}
      <div className="border-b">
        <div className="flex gap-1">
          <Link
            href={`/dashboard/bookings/${id}/visit/form`}
            className={cn(
              "hover:text-primary px-4 py-2 text-sm font-medium transition-colors",
              isFormActive ? "border-primary text-primary border-b-2" : "text-muted-foreground",
            )}
          >
            Form Visit
          </Link>
          <Link
            href={`/dashboard/bookings/${id}/visit/history`}
            className={cn(
              "hover:text-primary px-4 py-2 text-sm font-medium transition-colors",
              isHistoryActive ? "border-primary text-primary border-b-2" : "text-muted-foreground",
            )}
          >
            Riwayat Visit
          </Link>
        </div>
      </div>

      {/* Page Content */}
      {children}
    </div>
  );
}
