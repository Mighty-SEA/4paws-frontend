"use client";

import dynamic from "next/dynamic";

const ExpensesCrud = dynamic(() => import("../_components/expenses-crud").then((m) => m.ExpensesCrud), { ssr: false });

export default function ExpensesReportPage() {
  return <ExpensesCrud />;
}
