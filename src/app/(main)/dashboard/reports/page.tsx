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

export default function ReportsPage() {
  return (
    <div className="grid gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Laporan</h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Ringkasan</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <Tabs defaultValue="medicine" className="w-full">
            <TabsList>
              <TabsTrigger value="medicine">Penggunaan Produk</TabsTrigger>
              <TabsTrigger value="revenue">Pemasukan</TabsTrigger>
              <TabsTrigger value="handling">Penanganan</TabsTrigger>
            </TabsList>
            <TabsContent value="medicine">
              <MedicineUsageReport />
            </TabsContent>
            <TabsContent value="revenue">
              <RevenueReport />
            </TabsContent>
            <TabsContent value="handling">
              <HandlingReport />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
