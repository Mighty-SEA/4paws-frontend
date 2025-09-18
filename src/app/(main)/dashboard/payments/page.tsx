import { headers } from "next/headers";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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

export default async function PaymentsPage() {
  const data = await fetchJSON("/api/bookings?page=1&pageSize=100");
  const rows = Array.isArray(data?.items)
    ? data.items
        .map((b: any) => ({
          id: b.id,
          ownerName: b.owner?.name ?? "-",
          serviceName: b.serviceType?.service?.name ?? "-",
          typeName: b.serviceType?.name ?? "-",
          status: b.status,
          hasExam: Array.isArray(b.pets)
            ? b.pets.some((p: any) => Array.isArray(p.examinations) && p.examinations.length > 0)
            : false,
        }))
        .filter((r: any) => r.hasExam && r.status !== "COMPLETED")
    : [];

  async function loadEstimates(ids: number[]) {
    const hdrs = await headers();
    const host = hdrs.get("host");
    const protocol = hdrs.get("x-forwarded-proto") ?? "http";
    const base = `${protocol}://${host}`;
    const cookie = hdrs.get("cookie") ?? "";
    const res = await Promise.all(
      ids.map((id) => fetch(`${base}/api/bookings/${id}/billing/estimate`, { headers: { cookie }, cache: "no-store" })),
    );
    const jsons = await Promise.all(res.map((r) => (r.ok ? r.json() : null)));
    return jsons;
  }

  const estimates = await loadEstimates(rows.map((r: any) => r.id));
  const rowsWithDue = rows
    .map((r: any, idx: number) => ({ ...r, estimate: estimates[idx] }))
    .filter((r: any) => Number(r.estimate?.amountDue ?? 0) > 0);

  return (
    <div className="grid gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Pembayaran</h1>
      </div>
      <p className="text-muted-foreground text-sm">
        Daftar tagihan dari booking yang sudah ada tindakan, tetapi belum dibayar.
      </p>
      <Card>
        <CardHeader>
          <CardTitle>Tagihan Belum Lunas</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 text-sm">
          {rowsWithDue.length ? (
            <div className="grid gap-3">
              {rowsWithDue.map((r: any) => (
                <div key={r.id} className="rounded-lg border p-3 md:p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="grid gap-1">
                      <div className="text-sm font-semibold">Booking #{r.id}</div>
                      <div className="text-muted-foreground text-xs">Owner: {r.ownerName}</div>
                      <div className="text-muted-foreground text-xs">
                        Service: <span className="text-foreground font-medium">{r.serviceName}</span>
                        {r.typeName ? (
                          <Badge variant="secondary" className="ml-2 align-middle">
                            {r.typeName}
                          </Badge>
                        ) : null}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button asChild size="sm" variant="secondary">
                        <Link href={`/dashboard/bookings/${r.id}`}>Bayar</Link>
                      </Button>
                      {r.status === "COMPLETED" ? (
                        <Button asChild size="sm" variant="outline">
                          <Link href={`/dashboard/bookings/${r.id}/invoice`}>Invoice</Link>
                        </Button>
                      ) : null}
                    </div>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-y-1 text-xs md:grid-cols-6">
                    <div className="text-muted-foreground">Jasa Layanan</div>
                    <div className="text-right md:col-span-2 md:text-left">
                      Rp {Number(r.estimate?.baseService ?? 0).toLocaleString("id-ID")}
                    </div>
                    <div className="text-muted-foreground">Products</div>
                    <div className="text-right md:col-span-2 md:text-left">
                      Rp {Number(r.estimate?.totalProducts ?? 0).toLocaleString("id-ID")}
                    </div>
                    <div className="text-muted-foreground">Total</div>
                    <div className="text-right font-medium md:col-span-2 md:text-left">
                      Rp {Number(r.estimate?.total ?? 0).toLocaleString("id-ID")}
                    </div>
                    <div className="text-muted-foreground">Deposit</div>
                    <div className="text-right md:col-span-2 md:text-left">
                      Rp {Number(r.estimate?.depositSum ?? 0).toLocaleString("id-ID")}
                    </div>
                    <div className="text-muted-foreground">Amount Due</div>
                    <div className="text-right font-semibold md:col-span-2 md:text-left">
                      Rp {Number(r.estimate?.amountDue ?? 0).toLocaleString("id-ID")}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-muted-foreground">Tidak ada tagihan yang perlu dibayar</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
