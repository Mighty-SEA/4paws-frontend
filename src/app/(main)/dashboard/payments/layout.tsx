"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { Settings } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

import { PaymentStats } from "./_components/payment-stats";

export default function PaymentsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const isUnpaidActive = pathname.includes("/payments/unpaid");
  const isPaidActive = pathname.includes("/payments/paid");

  // Don't show layout for detail pages
  const isDetailPage = pathname.match(/\/payments\/\d+/);

  if (isDetailPage) {
    return <>{children}</>;
  }

  return (
    <div className="grid gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Pembayaran</h1>
        <Button asChild size="sm" variant="outline">
          <Link href="/dashboard/settings">
            <Settings className="mr-2 h-4 w-4" /> Pengaturan Invoice
          </Link>
        </Button>
      </div>

      <p className="text-muted-foreground text-sm">
        Daftar tagihan dari booking yang sudah ada tindakan, tetapi belum dibayar.
      </p>

      {/* Stats Cards */}
      <PaymentStats />

      <Card className="overflow-x-hidden">
        <CardHeader>
          <CardTitle>Pembayaran</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2">
          {/* Tab Navigation */}
          <div className="border-b">
            <div className="flex gap-1">
              <Link
                href="/dashboard/payments/unpaid"
                className={cn(
                  "hover:text-primary px-4 py-2 text-sm font-medium transition-colors",
                  isUnpaidActive ? "border-primary text-primary border-b-2" : "text-muted-foreground",
                )}
              >
                Belum Lunas
              </Link>
              <Link
                href="/dashboard/payments/paid"
                className={cn(
                  "hover:text-primary px-4 py-2 text-sm font-medium transition-colors",
                  isPaidActive ? "border-primary text-primary border-b-2" : "text-muted-foreground",
                )}
              >
                Lunas
              </Link>
            </div>
          </div>

          {/* Page Content */}
          {children}
        </CardContent>
      </Card>
    </div>
  );
}
