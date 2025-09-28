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
  // Use EXACT SAME logic from booking detail page for consistency
  const pets = Array.isArray(booking?.pets) ? booking.pets : [];
  const items = Array.isArray(booking?.items) ? booking.items : [];
  const svc = booking?.serviceType;

  function normalizeDay(d?: string | Date | null) {
    if (!d) return undefined as unknown as Date;
    const x = new Date(d);
    x.setHours(0, 0, 0, 0);
    return x;
  }
  function calcDays(start?: Date, end?: Date) {
    if (!start || !end) return 0;
    const ms = 24 * 60 * 60 * 1000;
    const diff = Math.ceil((end.getTime() - start.getTime()) / ms);
    return Math.max(0, diff);
  }

  // Primary service calculation (EXACTLY from booking detail)
  const start = normalizeDay(booking?.startDate);
  const end = normalizeDay(booking?.endDate);
  const primaryPerDay = svc?.pricePerDay ? Number(svc.pricePerDay) : 0;
  const primaryFlat = svc?.price ? Number(svc.price) : 0;
  const primaryUnit = primaryPerDay ? primaryPerDay : primaryFlat;
  const primaryDays = primaryPerDay ? calcDays(start, end) : 0;
  const primaryPetFactor = primaryPerDay ? pets.length : 0;
  const primarySubtotal = primaryPerDay
    ? primaryDays * primaryUnit * Math.max(primaryPetFactor, 1)
    : (() => {
        if (!primaryFlat) return 0;
        const examinedCount = pets.reduce(
          (cnt: number, bp: any) => cnt + ((bp.examinations?.length ?? 0) > 0 ? 1 : 0),
          0,
        );
        return primaryFlat * examinedCount;
      })();

  // Addon rows (EXACTLY from booking detail)
  const addonRows: {
    id: number | string;
    role?: string;
    name: string;
    serviceName: string;
    unit: number;
    qty: number;
    perDay: boolean;
    days: number;
    subtotal: number;
  }[] = items.map((it: any) => {
    const st = it?.serviceType ?? {};
    const perDay = st?.pricePerDay ? Number(st.pricePerDay) : 0;
    const flat = st?.price ? Number(st.price) : 0;
    const hasCustomUnit = it?.unitPrice !== undefined && it.unitPrice !== null && String(it.unitPrice) !== "";
    const unit = hasCustomUnit ? Number(it.unitPrice) : perDay ? perDay : flat;
    const s = normalizeDay(it?.startDate ?? booking?.startDate);
    const e = normalizeDay(it?.endDate ?? booking?.endDate);
    const qty = Number(it?.quantity ?? 1) || 1;
    const days = perDay ? calcDays(s, e) : 0;
    const subtotal = perDay ? unit * days * qty : unit * qty;
    return {
      id: it.id,
      role: it.role,
      name: st?.name ?? "-",
      serviceName: st?.service?.name ?? "-",
      unit,
      qty,
      perDay: !!perDay,
      days,
      subtotal,
    };
  });

  // Product & Mix lines (EXACTLY from booking detail)
  const productLines = (() => {
    const raw = pets.flatMap((bp: any) => {
      const examUsages = (bp.examinations ?? []).flatMap((ex: any) => ex.productUsages ?? []);
      const visitProductUsages = (bp.visits ?? []).flatMap((v: any) => v.productUsages ?? []);
      const visitMix = (bp.visits ?? []).flatMap((v: any) => v.mixUsages ?? []);
      const standaloneMix = bp.mixUsages ?? [];
      const uniqueMix = new Map<string | number, any>();
      [...visitMix, ...standaloneMix].forEach((mu: any) => {
        const key =
          mu?.id ??
          `${mu?.mixProductId}|${mu?.visitId ?? ""}|${mu?.createdAt ?? ""}|${mu?.quantity ?? ""}|${
            mu?.unitPrice ?? ""
          }`;
        if (!uniqueMix.has(key)) uniqueMix.set(key, mu);
      });
      const mixRows = Array.from(uniqueMix.values()).map((mu: any) => ({
        productName: mu.mixProduct?.name ?? `Mix#${mu.mixProductId}`,
        quantity: mu.quantity,
        unitPrice: mu.unitPrice ?? mu.mixProduct?.price ?? 0,
      }));
      return [...examUsages, ...visitProductUsages, ...mixRows];
    });
    const grouped = new Map<string, { productName: string; quantity: number; unitPrice: number }>();
    for (const it of raw) {
      const key = `${it.productName}|${Number(it.unitPrice ?? 0)}`;
      const prev = grouped.get(key) ?? {
        productName: it.productName,
        quantity: 0,
        unitPrice: Number(it.unitPrice ?? 0),
      };
      prev.quantity = Number(prev.quantity) + Number(it.quantity ?? 0);
      grouped.set(key, prev);
    }
    return Array.from(grouped.values());
  })();

  // Build allProducts for invoice table
  const allProducts: Array<{
    name: string;
    quantity: number;
    unitPrice: number;
    subtotal: number;
  }> = [];

  // Add primary service
  if (svc) {
    allProducts.push({
      name: `${svc?.service?.name ?? "Service"} - ${svc?.name ?? "Primary"}`,
      quantity: primaryPerDay ? pets.length : 1,
      unitPrice: primaryUnit,
      subtotal: primarySubtotal,
    });
  }

  // Add addon rows
  addonRows.forEach((it) => {
    allProducts.push({
      name: `${it.serviceName} - ${it.name}${it.role ? ` (${it.role})` : ""}`,
      quantity: it.perDay ? it.qty * it.days : it.qty,
      unitPrice: it.unit,
      subtotal: it.subtotal,
    });
  });

  // Add product lines
  productLines.forEach((pl) => {
    allProducts.push({
      name: pl.productName,
      quantity: pl.quantity,
      unitPrice: pl.unitPrice,
      subtotal: pl.quantity * pl.unitPrice,
    });
  });

  // Subtotal should reflect exactly the rows shown above
  // Aggregate identical lines (same name + unit price) so quantities are merged
  const aggregated = new Map<string, { name: string; quantity: number; unitPrice: number; subtotal: number }>();
  for (const line of allProducts) {
    const key = `${line.name}|${line.unitPrice}`;
    const prev = aggregated.get(key);
    if (prev) {
      prev.quantity += Number(line.quantity ?? 0);
      prev.subtotal += Number(line.subtotal ?? 0);
    } else {
      aggregated.set(key, { ...line });
    }
  }
  const mergedProducts = Array.from(aggregated.values());
  const computedSubTotal = mergedProducts.reduce((s, p) => s + Number(p.subtotal ?? 0), 0);
  const subTotal = computedSubTotal;
  const discountPercent = Number(invoice?.discountPercent ?? 0);
  const discountAmount = Number(invoice?.discountAmount ?? 0);
  const uniqueCode = Number(invoice?.uniqueCode ?? 0);
  const discountByPercent = discountPercent > 0 ? Math.round((subTotal * discountPercent) / 100) : 0;
  const effectiveDiscount = discountPercent > 0 ? discountByPercent : discountAmount;
  const discountedTotal = Math.max(0, subTotal - effectiveDiscount);
  const totalAmount = Math.max(0, discountedTotal - Number(depositSum ?? 0) + uniqueCode);
  const clinicName = String(settings?.companyName ?? "4Paws Pet Care");
  const clinicPhone = String(settings?.companyPhone ?? "-");
  const clinicEmail = String(settings?.companyEmail ?? "-");
  const clinicAddress = String(settings?.companyAddress ?? "-");
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
        <div className="mb-3 grid grid-cols-2 gap-6 border-b pb-3">
          {/* Info Pesanan (kiri) */}
          <div className="space-y-1 text-sm">
            <div>
              <span className="inline-block w-36 text-gray-600">No Pesanan</span> : #{id}
            </div>
            <div>
              <span className="inline-block w-36 text-gray-600">Tanggal Pesanan</span> :{" "}
              {booking?.createdAt ? new Date(booking.createdAt).toLocaleString("id-ID") : "-"}
            </div>
            <div>
              <span className="inline-block w-36 text-gray-600">Klinik</span> : {clinicName}
            </div>
            <div>
              <span className="inline-block w-36 text-gray-600">Telepon</span> : {clinicPhone}
            </div>
            <div>
              <span className="inline-block w-36 text-gray-600">Alamat</span> : {clinicAddress}
            </div>
          </div>
          {/* Detail Pelanggan (kanan) */}
          <div>
            <h3 className="mb-2 text-base font-semibold text-gray-800">Detail Pelanggan</h3>
            <div className="space-y-1 text-sm">
              <div>
                <span className="inline-block w-20 text-gray-600">Nama</span> : {booking?.owner?.name ?? "-"}
              </div>
              <div>
                <span className="inline-block w-20 text-gray-600">Email</span> : {booking?.owner?.email ?? clinicEmail}
              </div>
              <div>
                <span className="inline-block w-20 text-gray-600">Telepon</span> : {booking?.owner?.phone ?? "-"}
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
                  <th className="px-3 py-2 text-right text-xs font-medium text-gray-700">DISKON</th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-gray-700">TOTAL</th>
                </tr>
              </thead>
              <tbody>
                {mergedProducts.length > 0 ? (
                  mergedProducts.map((product, index) => (
                    <tr key={index}>
                      <td className="px-3 py-2 text-center text-sm">{product.quantity}</td>
                      <td className="px-3 py-2 text-sm">{product.name}</td>
                      <td className="px-3 py-2 text-right text-sm">{product.unitPrice.toLocaleString("id-ID")}</td>
                      <td className="px-3 py-2 text-right text-sm">0</td>
                      <td className="px-3 py-2 text-right text-sm">{product.subtotal.toLocaleString("id-ID")}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-3 py-4 text-center text-sm text-gray-500">
                      Tidak ada produk yang digunakan
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {/* Total Section */}
            <div className="px-3 py-3">
              <div className="mb-1 flex items-center justify-between">
                <span className="text-sm text-gray-600">Sub Total:</span>
                <span className="text-sm">{Number(subTotal).toLocaleString("id-ID")}</span>
              </div>
              {discountPercent ? (
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-sm text-gray-600">Diskon ({discountPercent}%):</span>
                  <span className="text-sm text-red-600">-{Number(discountByPercent).toLocaleString("id-ID")}</span>
                </div>
              ) : null}
              <div className="mb-1 flex items-center justify-between">
                <span className="text-sm text-gray-600">Deposit:</span>
                <span className="text-sm text-green-600">-{Number(depositSum ?? 0).toLocaleString("id-ID")}</span>
              </div>
              {uniqueCode ? (
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-sm text-gray-600">Kode Unik:</span>
                  <span className="text-sm">{Number(uniqueCode).toLocaleString("id-ID")}</span>
                </div>
              ) : null}
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
