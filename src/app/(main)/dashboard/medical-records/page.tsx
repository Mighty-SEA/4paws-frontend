"use client";

import * as React from "react";

import Link from "next/link";

import * as XLSX from "xlsx";

import { DataTable } from "@/components/data-table/data-table";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { DataTablePagination } from "@/components/data-table/data-table-pagination";
import { DataTableViewOptions } from "@/components/data-table/data-table-view-options";
import { createSmartFilterFn, withIndexColumn } from "@/components/data-table/table-utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useDataTableInstance } from "@/hooks/use-data-table-instance";

type MedicalRow = {
  id: string;
  date: string;
  bookingId?: number;
  ownerName?: string;
  petName?: string;
  species?: string;
  serviceName?: string;
  doctorName?: string;
  paravetName?: string;
  adminName?: string;
  groomerName?: string;
  anamnesa?: string;
  additionalNotes?: string;
  weight?: string;
  temperature?: string;
  diagnosis?: string;
  prognosis?: string;
  detail?: string;
};

function useQueryParamState(key: string, initial: string) {
  const [value, setValue] = React.useState<string>(() => {
    if (typeof window === "undefined") return initial;
    const url = new URL(window.location.href);
    return url.searchParams.get(key) ?? initial;
  });
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    if (value) url.searchParams.set(key, value);
    else url.searchParams.delete(key);
    window.history.replaceState(null, "", `${url.pathname}?${url.searchParams.toString()}`);
  }, [key, value]);
  return [value, setValue] as const;
}

export default function MedicalRecordsPage() {
  const today = React.useMemo(() => new Date(), []);
  const formatLocalDate = React.useCallback((d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }, []);
  const startDefault = React.useMemo(
    () => formatLocalDate(new Date(today.getFullYear(), today.getMonth(), 1)),
    [today, formatLocalDate],
  );
  const endDefault = React.useMemo(
    () => formatLocalDate(new Date(today.getFullYear(), today.getMonth() + 1, 0)),
    [today, formatLocalDate],
  );

  const [start, setStart] = useQueryParamState("mr_start", startDefault);
  const [end, setEnd] = useQueryParamState("mr_end", endDefault);
  const [staffId, setStaffId] = useQueryParamState("mr_staffId", "");

  const [loading, setLoading] = React.useState(false);
  const [rows, setRows] = React.useState<MedicalRow[]>([]);
  const [staffs, setStaffs] = React.useState<Array<{ id: number; name: string; jobRole: string }>>([]);

  React.useEffect(() => {
    void (async () => {
      const res = await fetch("/api/staff", { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      if (Array.isArray(data)) setStaffs(data.map((s: any) => ({ id: s.id, name: s.name, jobRole: s.jobRole })));
    })();
  }, []);

  const columns = React.useMemo(
    () =>
      withIndexColumn<MedicalRow>([
        {
          accessorKey: "date",
          header: ({ column }) => <DataTableColumnHeader column={column} title="Tanggal" />,
          cell: ({ row }) => <span className="tabular-nums">{row.original.date}</span>,
        },
        {
          accessorKey: "bookingId",
          header: ({ column }) => <DataTableColumnHeader column={column} title="Booking" />,
          cell: ({ row }) => (row.original.bookingId ? <span>#{row.original.bookingId}</span> : <span>-</span>),
        },
        {
          accessorKey: "ownerName",
          header: ({ column }) => <DataTableColumnHeader column={column} title="Nama Pemilik" />,
          filterFn: createSmartFilterFn<MedicalRow>(),
        },
        {
          accessorKey: "petName",
          header: ({ column }) => <DataTableColumnHeader column={column} title="Hewan" />,
          filterFn: createSmartFilterFn<MedicalRow>(),
        },
        {
          accessorKey: "species",
          header: ({ column }) => <DataTableColumnHeader column={column} title="Spesies" />,
          filterFn: createSmartFilterFn<MedicalRow>(),
        },
        {
          accessorKey: "serviceName",
          header: ({ column }) => <DataTableColumnHeader column={column} title="Layanan" />,
          filterFn: createSmartFilterFn<MedicalRow>(),
        },
        {
          accessorKey: "doctorName",
          header: ({ column }) => <DataTableColumnHeader column={column} title="Dokter" />,
          filterFn: createSmartFilterFn<MedicalRow>(),
        },
        {
          accessorKey: "paravetName",
          header: ({ column }) => <DataTableColumnHeader column={column} title="Paravet" />,
          filterFn: createSmartFilterFn<MedicalRow>(),
        },
        { accessorKey: "anamnesa", header: ({ column }) => <DataTableColumnHeader column={column} title="Anamnesa" /> },
        {
          accessorKey: "additionalNotes",
          header: ({ column }) => <DataTableColumnHeader column={column} title="Catatan Tambahan" />,
        },
        { accessorKey: "weight", header: ({ column }) => <DataTableColumnHeader column={column} title="Berat" /> },
        { accessorKey: "temperature", header: ({ column }) => <DataTableColumnHeader column={column} title="Suhu" /> },
        {
          accessorKey: "diagnosis",
          header: ({ column }) => <DataTableColumnHeader column={column} title="Diagnosa" />,
        },
        {
          accessorKey: "adminName",
          header: ({ column }) => <DataTableColumnHeader column={column} title="Admin" />,
          filterFn: createSmartFilterFn<MedicalRow>(),
        },
        {
          accessorKey: "groomerName",
          header: ({ column }) => <DataTableColumnHeader column={column} title="Groomer" />,
          filterFn: createSmartFilterFn<MedicalRow>(),
        },
        {
          accessorKey: "prognosis",
          header: ({ column }) => <DataTableColumnHeader column={column} title="Prognosa" />,
        },
        {
          accessorKey: "detail",
          header: ({ column }) => <DataTableColumnHeader column={column} title="Detail" />,
          cell: ({ row }) => {
            const full = String(row.original.detail ?? "");
            const maxLen = 120;
            const short = full.length > maxLen ? `${full.slice(0, maxLen)}…` : full;
            return (
              <span title={full} className="inline-block max-w-[48ch] truncate align-top lg:max-w-[72ch]">
                {short}
              </span>
            );
          },
        },
      ]),
    [],
  );

  const table = useDataTableInstance({ data: rows, columns });

  async function fetchData() {
    setLoading(true);
    try {
      const toStringSafe = (v: unknown): string => (v == null ? "" : String(v));
      const toIdOptional = (v: unknown): number | undefined => {
        const n = Number(v ?? NaN);
        return Number.isFinite(n) ? n : undefined;
      };
      const qs = new URLSearchParams();
      if (start) qs.set("start", start);
      if (end) qs.set("end", end);
      if (staffId) qs.set("staffId", staffId);
      // Reuse handling API and filter to examinations only
      const res = await fetch(`/api/reports/handling?${qs.toString()}`, { cache: "no-store" });
      const data = await res.json();
      const items = Array.isArray(data?.items) ? (data.items as unknown[]) : [];
      const mapped: MedicalRow[] = items
        .map((d: unknown, idx: number) => {
          const obj = (d ?? {}) as Record<string, unknown>;
          const typeStr = toStringSafe(obj.type);
          if (typeStr && typeStr !== "EXAM") return null;
          return {
            id: String(idx),
            date: toStringSafe(obj.date),
            bookingId: toIdOptional(obj.bookingId),
            ownerName: toStringSafe(obj.ownerName),
            petName: toStringSafe(obj.petName),
            species: toStringSafe((obj as any).species),
            serviceName: toStringSafe(obj.serviceName as any),
            doctorName: toStringSafe(obj.doctorName),
            paravetName: toStringSafe(obj.paravetName),
            adminName: toStringSafe(obj.adminName),
            groomerName: toStringSafe(obj.groomerName),
            anamnesa: toStringSafe((obj as any).anamnesa),
            additionalNotes: toStringSafe((obj as any).additionalNotes ?? (obj as any).notes ?? (obj as any).detail),
            weight: toStringSafe((obj as any).weight),
            temperature: toStringSafe((obj as any).temperature),
            diagnosis: toStringSafe((obj as any).diagnosis),
            prognosis: toStringSafe((obj as any).prognosis),
            detail: toStringSafe(obj.detail),
          } as MedicalRow;
        })
        .filter(Boolean) as MedicalRow[];
      setRows(mapped);
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  const handleExportExcel = React.useCallback(() => {
    const headers = [
      "Tanggal",
      "Booking",
      "Owner",
      "Hewan",
      "Spesies",
      "Layanan",
      "Dokter",
      "Paravet",
      "Admin",
      "Groomer",
      "Anamnesa",
      "Catatan Tambahan",
      "Berat",
      "Suhu",
      "Diagnosa",
      "Prognosa",
      "Detail",
    ] as const;

    const exportRows = rows.map((r) => ({
      Tanggal: r.date,
      Booking: r.bookingId ?? null,
      Owner: r.ownerName ?? "",
      Hewan: r.petName ?? "",
      Spesies: r.species ?? "",
      Layanan: r.serviceName ?? "",
      Dokter: r.doctorName ?? "",
      Paravet: r.paravetName ?? "",
      Admin: r.adminName ?? "",
      Groomer: r.groomerName ?? "",
      Anamnesa: r.anamnesa ?? "",
      "Catatan Tambahan": r.additionalNotes ?? "",
      Berat: r.weight ?? "",
      Suhu: r.temperature ?? "",
      Diagnosa: r.diagnosis ?? "",
      Prognosa: r.prognosis ?? "",
      // Ganti titik koma dengan baris baru supaya lebih rapi dibaca di Excel
      Detail: (r.detail ?? "").replace(/\s*;\s*/g, "\n"),
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportRows, { header: [...headers] as string[] });

    // Auto-fit column widths berdasarkan panjang konten
    const colWidths = headers.map((h) => {
      const maxLen = exportRows.reduce((m, row) => {
        const raw = (row as any)[h];
        const str = raw == null ? "" : String(raw).replace(/\n/g, " ");
        return Math.max(m, str.length);
      }, h.length);
      // batas minimal 8, maksimal 60 karakter (aproksimasi lebar)
      return { wch: Math.min(60, Math.max(8, maxLen + 2)) };
    });
    (worksheet as any)["!cols"] = colWidths;

    // Tambahkan AutoFilter pada baris header
    const range = XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: exportRows.length, c: headers.length - 1 } });
    (worksheet as any)["!autofilter"] = { ref: range };

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "MedicalRecord");
    const filename = `medical-record_${start}_sd_${end}.xlsx`;
    XLSX.writeFile(workbook, filename);
  }, [rows, start, end]);

  React.useEffect(() => {
    void fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="grid gap-4" suppressHydrationWarning>
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Medical Record</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleExportExcel} disabled={!rows.length}>
            Export Medical Record
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filter</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
            <div className="grid gap-1">
              <Label htmlFor="mr-start">Mulai</Label>
              <Input id="mr-start" type="date" value={start} onChange={(e) => setStart(e.target.value)} />
            </div>
            <div className="grid gap-1">
              <Label htmlFor="mr-end">Selesai</Label>
              <Input id="mr-end" type="date" value={end} onChange={(e) => setEnd(e.target.value)} />
            </div>
            <div className="grid gap-1">
              <Label>Staff (opsional)</Label>
              <Select value={staffId} onValueChange={setStaffId}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih staff" />
                </SelectTrigger>
                <SelectContent>
                  {staffs.map((s) => (
                    <SelectItem key={s.id} value={String(s.id)}>
                      #{s.id} — {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end gap-2">
              <Button onClick={() => void fetchData()} disabled={loading} className="w-full">
                {loading ? "Memuat..." : "Search"}
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  setStaffId("");
                  setStart(startDefault);
                  setEnd(endDefault);
                }}
              >
                Reset
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="min-w-0 rounded-md border">
        <div className="flex items-center justify-between p-2">
          <DataTableViewOptions table={table} />
          <div className="text-muted-foreground text-xs">Menampilkan data pemeriksaan (tanpa mutasi merchant)</div>
        </div>
        <DataTable table={table} columns={columns} />
        <div className="p-2">
          <DataTablePagination table={table} />
        </div>
      </div>
    </div>
  );
}
