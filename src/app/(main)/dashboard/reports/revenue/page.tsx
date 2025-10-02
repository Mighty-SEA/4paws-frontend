"use client";

import dynamic from "next/dynamic";

const RevenueReport = dynamic(() => import("../_components/revenue-report").then((m) => m.RevenueReport), {
  ssr: false,
});

export default function RevenueReportPage() {
  return <RevenueReport />;
}
