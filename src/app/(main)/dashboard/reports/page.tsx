import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { MedicineUsageReport } from "./_components/medicine-usage-report";
import { RevenueReport } from "./_components/revenue-report";

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
            </TabsList>
            <TabsContent value="medicine">
              <MedicineUsageReport />
            </TabsContent>
            <TabsContent value="revenue">
              <RevenueReport />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
