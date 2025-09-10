import { headers } from "next/headers";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RestockForm } from "./restock-form";

async function fetchJSON(path: string) {
  const hdrs = await headers();
  const host = hdrs.get("host");
  const protocol = hdrs.get("x-forwarded-proto") ?? "http";
  const base = `${protocol}://${host}`;
  const cookie = hdrs.get("cookie") ?? "";
  const res = await fetch(`${base}${path}`, { headers: { cookie }, cache: "no-store" });
  if (!res.ok) return null;
  return res.json();
}

export default async function RestockPage() {
  const products = (await fetchJSON("/api/products")) ?? [];
  return (
    <div className="grid grid-cols-1 gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Restock / Adjustment</h1>
        <Button asChild variant="outline"><Link href="/dashboard/products">Kembali ke Products</Link></Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Input Stok per Produk</CardTitle>
        </CardHeader>
        <CardContent>
          <RestockForm products={Array.isArray(products) ? products : []} />
        </CardContent>
      </Card>
    </div>
  );
}


