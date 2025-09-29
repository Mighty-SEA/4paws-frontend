import { headers } from "next/headers";
import Link from "next/link";

import { Button } from "@/components/ui/button";

import "../../invoice/print.css";
import { PrintButton } from "../../invoice/_components/print-button";

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

export default async function DepositReceiptPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const booking = await fetchJSON(`/api/bookings/${id}`);
  const settings = await fetchJSON(`/api/settings`);
  const deposits = await fetchJSON(`/api/bookings/${id}/deposits`);
  const last = Array.isArray(deposits) && deposits.length ? deposits[0] : null;
  const totalDeposit = Array.isArray(deposits)
    ? deposits.reduce((sum: number, d: any) => sum + Number(d.amount ?? 0), 0)
    : 0;

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
        {/* Header */}
        <div className="mb-3 grid grid-cols-3 items-start gap-2 border-b pb-3">
          <div className="flex items-center gap-2">
            <img src="/android-chrome-512x512.png" alt="4Paws Pet Care Logo" className="h-12 w-auto" />
            <div>
              <div className="text-base font-semibold">{clinicName}</div>
              <div className="text-xs text-gray-600">Bukti Deposit</div>
            </div>
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-800">BUKTI DEPOSIT</h1>
          </div>
          <div className="text-right text-sm text-gray-600">
            <div>No Pesanan: #{id}</div>
            <div>Tanggal: {new Date().toLocaleString("id-ID")}</div>
          </div>
        </div>

        {/* Info Pelanggan & Klinik */}
        <div className="mb-3 grid grid-cols-2 gap-6 border-b pb-3 text-sm">
          <div>
            <h3 className="mb-2 text-base font-semibold text-gray-800">Detail Pelanggan</h3>
            <div>Nama: {booking?.owner?.name ?? "-"}</div>
            <div>Email: {booking?.owner?.email ?? clinicEmail}</div>
            <div>Telepon: {booking?.owner?.phone ?? "-"}</div>
          </div>
          <div>
            <h3 className="mb-2 text-base font-semibold text-gray-800">Klinik</h3>
            <div>{clinicName}</div>
            <div>{clinicAddress}</div>
            <div>{clinicPhone}</div>
          </div>
        </div>

        {/* Detail Deposit */}
        <div className="mb-3 border-b pb-3">
          <h3 className="mb-2 text-base font-semibold text-gray-800">Detail Deposit</h3>
          <table className="w-full text-sm print:border-collapse">
            <thead className="bg-gray-50 print:bg-gray-100">
              <tr>
                <th className="px-3 py-2 text-left">Tanggal</th>
                <th className="px-3 py-2 text-left">Metode</th>
                <th className="px-3 py-2 text-right">Jumlah</th>
              </tr>
            </thead>
            <tbody>
              {Array.isArray(deposits) && deposits.length ? (
                deposits.map((d: any) => (
                  <tr key={d.id}>
                    <td className="px-3 py-2">{new Date(d.depositDate).toLocaleString("id-ID")}</td>
                    <td className="px-3 py-2">{d.method ?? "-"}</td>
                    <td className="px-3 py-2 text-right">{Number(d.amount ?? 0).toLocaleString("id-ID")}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="px-3 py-3 text-center text-gray-500" colSpan={3}>
                    Belum ada deposit
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          <div className="px-3 py-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Total Deposit</span>
              <span className="text-base font-semibold">Rp {Number(totalDeposit).toLocaleString("id-ID")}</span>
            </div>
          </div>
        </div>

        {/* Informasi Pembayaran (Bank) */}
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
                    <div className="flex h-6 w-10 items-center justify-center rounded border bg-white">
                      <span className="text-[10px] font-bold text-gray-700">
                        {bank.bankName.substring(0, 3).toUpperCase()}
                      </span>
                    </div>
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
              <div className="text-xs text-gray-500 italic">*Simpan bukti deposit untuk keperluan administrasi</div>
            </div>
          ) : (
            <div className="text-sm text-gray-500">Informasi rekening belum tersedia</div>
          )}
        </div>
      </div>
    </div>
  );
}
