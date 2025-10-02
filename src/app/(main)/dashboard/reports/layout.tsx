"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export default function ReportsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const isMedicineActive = pathname.includes("/reports/medicine");
  const isRevenueActive = pathname.includes("/reports/revenue");
  const isHandlingActive = pathname.includes("/reports/handling");
  const isExpensesActive = pathname.includes("/reports/expenses");

  return (
    <div className="grid gap-4 overflow-x-hidden" suppressHydrationWarning>
      <div className="flex min-w-0 items-center justify-between">
        <h1 className="text-xl font-semibold">Laporan</h1>
      </div>

      <Card className="overflow-x-hidden">
        <CardHeader>
          <CardTitle>Ringkasan</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 overflow-x-hidden">
          {/* Tab Navigation */}
          <div className="border-b">
            <div className="flex gap-1 overflow-x-auto">
              <Link
                href="/dashboard/reports/medicine"
                className={cn(
                  "hover:text-primary px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors",
                  isMedicineActive ? "border-primary text-primary border-b-2" : "text-muted-foreground",
                )}
              >
                Penggunaan Produk
              </Link>
              <Link
                href="/dashboard/reports/revenue"
                className={cn(
                  "hover:text-primary px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors",
                  isRevenueActive ? "border-primary text-primary border-b-2" : "text-muted-foreground",
                )}
              >
                Pemasukan
              </Link>
              <Link
                href="/dashboard/reports/handling"
                className={cn(
                  "hover:text-primary px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors",
                  isHandlingActive ? "border-primary text-primary border-b-2" : "text-muted-foreground",
                )}
              >
                Penanganan
              </Link>
              <Link
                href="/dashboard/reports/expenses"
                className={cn(
                  "hover:text-primary px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors",
                  isExpensesActive ? "border-primary text-primary border-b-2" : "text-muted-foreground",
                )}
              >
                Pengeluaran
              </Link>
            </div>
          </div>

          {/* Page Content */}
          <div className="min-w-0 overflow-x-hidden">{children}</div>
        </CardContent>
      </Card>
    </div>
  );
}
