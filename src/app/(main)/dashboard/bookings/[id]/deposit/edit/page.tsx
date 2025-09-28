import { headers } from "next/headers";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { DepositForm } from "../../_components/deposit-form";

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

export default async function EditDepositPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const booking = await fetchJSON(`/api/bookings/${id}`);
  const deposits = await fetchJSON(`/api/bookings/${id}/deposits`);
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Edit Deposit Booking #{id}</h1>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href={`/dashboard/bookings/${id}`}>Kembali ke Detail</Link>
          </Button>
          <Button asChild variant="secondary">
            <Link href="/dashboard/bookings">Daftar Booking</Link>
          </Button>
        </div>
      </div>
      {booking?.serviceType?.pricePerDay ? (
        <>
          {Array.isArray(deposits) && deposits.length ? (
            <Card>
              <CardHeader>
                <CardTitle>Riwayat Deposit</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-2 text-sm">
                {deposits.map((d: any) => (
                  <div key={d.id} className="rounded-md border p-2 text-xs">
                    <div>{new Date(d.depositDate).toLocaleString()}</div>
                    <div>Jumlah: Rp {Number(d.amount ?? 0).toLocaleString("id-ID")}</div>
                    <div>Metode: {d.method ?? "-"}</div>
                  </div>
                ))}
              </CardContent>
            </Card>
          ) : null}
          <DepositForm
            bookingId={Number(id)}
            initial={
              Array.isArray(deposits) && deposits.length
                ? {
                    id: deposits[0]?.id,
                    amount: deposits[0]?.amount,
                    method: deposits[0]?.method,
                    startDate: booking?.startDate,
                    endDate: booking?.endDate,
                  }
                : undefined
            }
          />
        </>
      ) : (
        <div className="text-muted-foreground text-sm">Deposit hanya untuk layanan per-hari</div>
      )}
    </div>
  );
}
