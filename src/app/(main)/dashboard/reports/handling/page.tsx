"use client";

import dynamic from "next/dynamic";

const HandlingReport = dynamic(() => import("../_components/handling-report").then((m) => m.HandlingReport), {
  ssr: false,
});

export default function HandlingReportPage() {
  return <HandlingReport />;
}
