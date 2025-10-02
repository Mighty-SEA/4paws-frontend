"use client";

import * as React from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function PaymentStats() {
  const [statsLoading, setStatsLoading] = React.useState(false);
  const [todaySum, setTodaySum] = React.useState(0);
  const [todayCount, setTodayCount] = React.useState(0);
  const [monthSum, setMonthSum] = React.useState(0);
  const [monthCount, setMonthCount] = React.useState(0);

  async function fetchStats() {
    setStatsLoading(true);
    try {
      const today = new Date();
      const yyyy = today.getFullYear();
      const mm = String(today.getMonth() + 1).padStart(2, "0");
      const dd = String(today.getDate()).padStart(2, "0");
      const todayStr = `${yyyy}-${mm}-${dd}`;

      const monthStart = `${yyyy}-${mm}-01`;
      const lastDay = new Date(yyyy, today.getMonth() + 1, 0).getDate();
      const monthEnd = `${yyyy}-${mm}-${String(lastDay).padStart(2, "0")}`;

      const [resToday, resMonth] = await Promise.all([
        fetch(`/api/reports/revenue?start=${todayStr}&end=${todayStr}`, { cache: "no-store" }),
        fetch(`/api/reports/revenue?start=${monthStart}&end=${monthEnd}`, { cache: "no-store" }),
      ]);
      const [dataToday, dataMonth] = await Promise.all([
        resToday.ok ? resToday.json() : [],
        resMonth.ok ? resMonth.json() : [],
      ]);

      const sumToday = Array.isArray(dataToday)
        ? dataToday.reduce((acc: number, it: any) => acc + Number(it?.amount ?? 0), 0)
        : 0;
      const sumMonth = Array.isArray(dataMonth)
        ? dataMonth.reduce((acc: number, it: any) => acc + Number(it?.amount ?? 0), 0)
        : 0;
      setTodaySum(sumToday);
      setTodayCount(Array.isArray(dataToday) ? dataToday.length : 0);
      setMonthSum(sumMonth);
      setMonthCount(Array.isArray(dataMonth) ? dataMonth.length : 0);
    } catch {
      setTodaySum(0);
      setTodayCount(0);
      setMonthSum(0);
      setMonthCount(0);
    } finally {
      setStatsLoading(false);
    }
  }

  React.useEffect(() => {
    void fetchStats();
  }, []);

  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Lunas Hari ini</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">Rp {todaySum.toLocaleString("id-ID")}</div>
          <div className="text-muted-foreground text-xs">{statsLoading ? "Memuat..." : `${todayCount} transaksi`}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Lunas Bulan ini</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">Rp {monthSum.toLocaleString("id-ID")}</div>
          <div className="text-muted-foreground text-xs">{statsLoading ? "Memuat..." : `${monthCount} transaksi`}</div>
        </CardContent>
      </Card>
    </div>
  );
}
