"use client";

import dynamic from "next/dynamic";

const MedicineUsageReport = dynamic(
  () => import("../_components/medicine-usage-report").then((m) => m.MedicineUsageReport),
  { ssr: false },
);

export default function MedicineReportPage() {
  return <MedicineUsageReport />;
}
