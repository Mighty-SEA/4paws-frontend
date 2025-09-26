"use client";
import dynamic from "next/dynamic";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const MedicineUsageReport = dynamic(
  () => import("./_components/medicine-usage-report").then((m) => m.MedicineUsageReport),
  { ssr: false },
);
const RevenueReport = dynamic(() => import("./_components/revenue-report").then((m) => m.RevenueReport), {
  ssr: false,
});
const HandlingReport = dynamic(() => import("./_components/handling-report").then((m) => m.HandlingReport), {
  ssr: false,
});
// Expense report removed per latest requirement

export default function ReportsPage() {
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
          <Tabs defaultValue="medicine" className="w-full overflow-x-hidden">
            <TabsList className="max-w-full overflow-x-auto">
              <TabsTrigger value="medicine">Penggunaan Produk</TabsTrigger>
              <TabsTrigger value="revenue">Pemasukan</TabsTrigger>
              <TabsTrigger value="handling">Penanganan</TabsTrigger>
              {null}
            </TabsList>
            <TabsContent value="medicine" className="min-w-0 overflow-x-hidden">
              <MedicineUsageReport />
            </TabsContent>
            <TabsContent value="revenue" className="min-w-0 overflow-x-hidden">
              <RevenueReport />
            </TabsContent>
            <TabsContent value="handling" className="min-w-0 overflow-x-hidden">
              <HandlingReport />
            </TabsContent>
            {null}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
