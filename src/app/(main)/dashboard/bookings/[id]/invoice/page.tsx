/* eslint-disable max-depth */
import { headers } from "next/headers";
import Link from "next/link";

import { Button } from "@/components/ui/button";

import { PrintButton } from "./_components/print-button";
import "./print.css";

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

// eslint-disable-next-line complexity
export default async function BookingInvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const booking = await fetchJSON(`/api/bookings/${id}`);
  const estimate = await fetchJSON(`/api/bookings/${id}/billing/estimate`);
  const deposits = await fetchJSON(`/api/bookings/${id}/deposits`);
  const depositSum = Array.isArray(deposits)
    ? deposits.reduce((sum: number, d: any) => sum + Number(d.amount ?? 0), 0)
    : 0;
  const invoice = await fetchJSON(`/api/bookings/${id}/billing/invoice`);
  const settings = await fetchJSON(`/api/settings`);
  // Aggregate staff names across exams/visits
  const staffAgg = (() => {
    const names = {
      doctor: new Set<string>(),
      paravet: new Set<string>(),
      admin: new Set<string>(),
      groomer: new Set<string>(),
    };
    const pets = Array.isArray(booking?.pets) ? booking.pets : [];
    for (const bp of pets) {
      const exams = Array.isArray(bp?.examinations) ? bp.examinations : [];
      const visits = Array.isArray(bp?.visits) ? bp.visits : [];
      for (const ex of exams) {
        if (ex?.doctor?.name) names.doctor.add(ex.doctor.name);
        if (ex?.paravet?.name) names.paravet.add(ex.paravet.name);
        if (ex?.admin?.name) names.admin.add(ex.admin.name);
        if (ex?.groomer?.name) names.groomer.add(ex.groomer.name);
      }
      for (const v of visits) {
        if (v?.doctor?.name) names.doctor.add(v.doctor.name);
        if (v?.paravet?.name) names.paravet.add(v.paravet.name);
        if (v?.admin?.name) names.admin.add(v.admin.name);
        if (v?.groomer?.name) names.groomer.add(v.groomer.name);
      }
    }
    const toLine = (lab: string, set: Set<string>) => `${lab}: ${set.size ? Array.from(set).join(", ") : ""}`;
    return [toLine("Admin", names.admin), toLine("Dokter", names.doctor)];
  })();
  // Collect all product usages from examinations and visits
  const allProducts: Array<{
    name: string;
    quantity: number;
    unitPrice: number;
    subtotal: number;
  }> = [];

  // Add service type as first item
  if (booking?.serviceType) {
    allProducts.push({
      name: booking.serviceType.name ?? "Layanan",
      quantity: 1,
      unitPrice: Number(booking.serviceType.price ?? 0),
      subtotal: Number(booking.serviceType.price ?? 0),
    });
  }

  if (Array.isArray(booking?.pets)) {
    for (const bp of booking.pets) {
      // From examinations
      if (Array.isArray(bp.examinations)) {
        for (const ex of bp.examinations) {
          if (Array.isArray(ex.productUsages)) {
            for (const pu of ex.productUsages) {
              allProducts.push({
                name: pu.productName ?? "Produk",
                quantity: Number(pu.quantity ?? 0),
                unitPrice: Number(pu.unitPrice ?? 0),
                subtotal: Number(pu.quantity ?? 0) * Number(pu.unitPrice ?? 0),
              });
            }
          }
        }
      }
      // From visits
      if (Array.isArray(bp.visits)) {
        for (const v of bp.visits) {
          if (Array.isArray(v.productUsages)) {
            for (const pu of v.productUsages) {
              allProducts.push({
                name: pu.productName ?? "Produk",
                quantity: Number(pu.quantity ?? 0),
                unitPrice: Number(pu.unitPrice ?? 0),
                subtotal: Number(pu.quantity ?? 0) * Number(pu.unitPrice ?? 0),
              });
            }
          }
          if (Array.isArray(v.mixUsages)) {
            for (const mu of v.mixUsages) {
              allProducts.push({
                name: mu.mixProduct?.name ?? `Mix#${mu.mixProductId}`,
                quantity: Number(mu.quantity ?? 0),
                unitPrice: Number(mu.unitPrice ?? mu.mixProduct?.price ?? 0),
                subtotal: Number(mu.quantity ?? 0) * Number(mu.unitPrice ?? mu.mixProduct?.price ?? 0),
              });
            }
          }
        }
      }
    }
  }

  const totalAmount = Number(invoice?.discountedTotal ?? estimate?.total ?? 0);
  const bankAccounts = Array.isArray(settings?.bankAccounts) ? settings.bankAccounts : [];

  return (
    <div className="bg-background m-auto max-w-4xl p-6 print:max-w-none print:p-0">
      <div className="mb-4 flex items-center justify-between print:hidden">
        <Button asChild variant="outline">
          <Link href={`/dashboard/bookings/${id}`}>Kembali</Link>
        </Button>
        <PrintButton />
      </div>

      <div id="invoice-print" className="rounded-md border bg-white p-4 print:border-0 print:shadow-none">
        {/* BAGIAN 1: Header dengan Logo, KUITANSI, dan Staff */}
        <div className="mb-3 grid grid-cols-3 items-start gap-2 border-b pb-3">
          {/* Logo (Kiri) */}
          <div className="flex items-center gap-2">
            <img src="/android-chrome-512x512.png" alt="4Paws Pet Care Logo" className="h-12 w-auto" />
            <div>
              <div className="text-base font-semibold">4Paws Pet Care</div>
              <div className="text-xs text-gray-600">Pet Care Services</div>
            </div>
          </div>

          {/* KUITANSI (Tengah) */}
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-800">KUITANSI</h1>
          </div>

          {/* Admin & Dokter (Kanan) */}
          <div className="text-right">
            <table className="ml-auto text-sm">
              <tbody>
                {staffAgg.map((line, i) => {
                  const [label, value] = line.split(": ");
                  return (
                    <tr key={i}>
                      <td className="pr-2 text-gray-600">{label}:</td>
                      <td className="text-gray-600">{value}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* BAGIAN 2: Info Pelanggan & Pesanan */}
        <div className="mb-3 grid grid-cols-3 gap-4 border-b pb-3">
          {/* Info Pelanggan (Kiri) */}
          <div>
            <h3 className="mb-2 text-base font-semibold text-gray-800">Informasi Pelanggan</h3>
            <div className="space-y-1 text-sm">
              <div>
                <span className="font-medium">Nama:</span> {booking?.owner?.name ?? "-"}
              </div>
              <div>
                <span className="font-medium">Email:</span> {booking?.owner?.email ?? "-"}
              </div>
              <div>
                <span className="font-medium">Telepon:</span> {booking?.owner?.phone ?? "-"}
              </div>
            </div>
          </div>

          {/* Kolom Tengah (Kosong) */}
          <div></div>

          {/* Info Pesanan (Kanan) */}
          <div>
            <h3 className="mb-2 text-base font-semibold text-gray-800">Informasi Pesanan</h3>
            <div className="space-y-1 text-sm">
              <div>
                <span className="font-medium">No. Pesanan:</span> #{id}
              </div>
              <div>
                <span className="font-medium">Tanggal Pesanan:</span>{" "}
                {booking?.createdAt ? new Date(booking.createdAt).toLocaleDateString("id-ID") : "-"}
              </div>
              <div>
                <span className="font-medium">Layanan:</span> {booking?.serviceType?.service?.name ?? "-"} -{" "}
                {booking?.serviceType?.name ?? "-"}
              </div>
            </div>
          </div>
        </div>

        {/* BAGIAN 3: Tabel Produk */}
        <div className="mb-3 border-b pb-3">
          <h3 className="mb-2 text-base font-semibold text-gray-800">Detail Produk & Layanan</h3>
          <div className="overflow-hidden">
            <table className="w-full print:border-collapse">
              <thead className="bg-gray-50 print:bg-gray-100">
                <tr>
                  <th className="px-3 py-2 text-center text-xs font-medium text-gray-700">QTY</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-700">KETERANGAN</th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-gray-700">HARGA</th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-gray-700">TOTAL</th>
                </tr>
              </thead>
              <tbody>
                {allProducts.length > 0 ? (
                  allProducts.map((product, index) => (
                    <tr key={index}>
                      <td className="px-3 py-2 text-center text-sm">{product.quantity}</td>
                      <td className="px-3 py-2 text-sm">{product.name}</td>
                      <td className="px-3 py-2 text-right text-sm">{product.unitPrice.toLocaleString("id-ID")}</td>
                      <td className="px-3 py-2 text-right text-sm">{product.subtotal.toLocaleString("id-ID")}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-3 py-4 text-center text-sm text-gray-500">
                      Tidak ada produk yang digunakan
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {/* Total Section */}
            <div className="px-3 py-3">
              <div className="mb-1 flex items-center justify-between">
                <span className="text-sm text-gray-600">Deposit:</span>
                <span className="text-sm text-green-600">-{Number(depositSum ?? 0).toLocaleString("id-ID")}</span>
              </div>
              {invoice?.discountPercent && (
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-sm text-gray-600">Diskon ({invoice.discountPercent}%):</span>
                  <span className="text-sm text-red-600">
                    -{Number(invoice.discountAmount ?? 0).toLocaleString("id-ID")}
                  </span>
                </div>
              )}
              <div className="mt-2 pt-2">
                <div className="flex items-center justify-between">
                  <span className="text-base font-bold text-gray-800">Total yang harus dibayarkan:</span>
                  <span className="text-base font-bold text-gray-800">{totalAmount.toLocaleString("id-ID")}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* BAGIAN 4: Informasi Bank */}
        <div className="mb-3 border-b pb-3">
          <h3 className="mb-2 text-base font-semibold text-gray-800">Informasi Pembayaran</h3>
          {bankAccounts.length > 0 ? (
            <div className="space-y-2">
              {bankAccounts.map((bank: any, index: number) => (
                <div
                  key={bank.id ?? index}
                  className="rounded border bg-gray-50 p-2 print:rounded-none print:border-gray-400"
                >
                  <div className="flex items-center gap-3">
                    {/* Bank Logo/Icon */}
                    <div className="flex h-6 w-10 items-center justify-center rounded border bg-white">
                      <span className="text-[10px] font-bold text-gray-700">
                        {bank.bankName.substring(0, 3).toUpperCase()}
                      </span>
                    </div>

                    {/* Bank Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 text-sm">
                        <div className="font-bold text-gray-800">{bank.accountNumber}</div>
                        <div className="text-gray-600">|</div>
                        <div className="text-gray-800">{bank.accountHolder}</div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {/* Note */}
              <div className="text-xs text-gray-500 italic">
                *Barang yang sudah dibeli tidak dapat ditukar/dikembalikan
              </div>
            </div>
          ) : (
            <div className="text-sm text-gray-500">Informasi rekening belum tersedia</div>
          )}
        </div>
      </div>
    </div>
  );
}
