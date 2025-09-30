"use client";

import * as React from "react";

import type { ColumnDef } from "@tanstack/react-table";
import * as XLSX from "xlsx";

import { DataTable } from "@/components/data-table/data-table";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { DataTablePagination } from "@/components/data-table/data-table-pagination";
import { DataTableViewOptions } from "@/components/data-table/data-table-view-options";
import { createSmartFilterFn, withIndexColumn } from "@/components/data-table/table-utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useDataTableInstance } from "@/hooks/use-data-table-instance";

type HandlingRow = {
  id: string;
  date: string;
  type: "EXAM" | "VISIT" | "SERVICE";
  bookingId?: number;
  bookingPetId?: number;
  ownerName?: string;
  petName?: string;
  serviceName?: string;
  serviceTypeName?: string;
  doctorName?: string;
  paravetName?: string;
  adminName?: string;
  groomerName?: string;
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

export function HandlingReport() {
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

  const [start, setStart] = useQueryParamState("h_start", startDefault);
  const [end, setEnd] = useQueryParamState("h_end", endDefault);
  const [role, setRole] = useQueryParamState("h_role", "ALL");
  const [staffId, setStaffId] = useQueryParamState("h_staffId", "");

  const [staffs, setStaffs] = React.useState<Array<{ id: number; name: string; jobRole: string }>>([]);
  const [loading, setLoading] = React.useState(false);
  const [rows, setRows] = React.useState<HandlingRow[]>([]);

  React.useEffect(() => {
    void (async () => {
      const res = await fetch("/api/staff", { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      if (Array.isArray(data)) setStaffs(data.map((s: any) => ({ id: s.id, name: s.name, jobRole: s.jobRole })));
    })();
  }, []);

  const columns = React.useMemo<ColumnDef<HandlingRow, unknown>[]>(
    () =>
      withIndexColumn<HandlingRow>([
        {
          accessorKey: "date",
          header: ({ column }) => <DataTableColumnHeader column={column} title="Tanggal" />,
          cell: ({ row }) => <span className="tabular-nums">{row.original.date}</span>,
        },
        {
          accessorKey: "type",
          header: ({ column }) => <DataTableColumnHeader column={column} title="Tipe" />,
          filterFn: createSmartFilterFn<HandlingRow>(),
          cell: ({ row }) => {
            const t = row.original.type;
            return t === "VISIT" ? "Kunjungan" : t === "SERVICE" ? "Layanan" : "Pemeriksaan";
          },
        },
        {
          accessorKey: "bookingId",
          header: ({ column }) => <DataTableColumnHeader column={column} title="Booking" />,
          cell: ({ row }) => <span>#{row.original.bookingId}</span>,
        },
        {
          accessorKey: "ownerName",
          header: ({ column }) => <DataTableColumnHeader column={column} title="Owner" />,
          filterFn: createSmartFilterFn<HandlingRow>(),
        },
        {
          accessorKey: "petName",
          header: ({ column }) => <DataTableColumnHeader column={column} title="Hewan" />,
          filterFn: createSmartFilterFn<HandlingRow>(),
        },
        {
          accessorKey: "serviceName",
          header: ({ column }) => <DataTableColumnHeader column={column} title="Services" />,
          filterFn: createSmartFilterFn<HandlingRow>(),
        },
        {
          accessorKey: "serviceTypeName",
          header: ({ column }) => <DataTableColumnHeader column={column} title="Service Type" />,
          filterFn: createSmartFilterFn<HandlingRow>(),
        },
        {
          accessorKey: "doctorName",
          header: ({ column }) => <DataTableColumnHeader column={column} title="Dokter" />,
          filterFn: createSmartFilterFn<HandlingRow>(),
        },
        {
          accessorKey: "paravetName",
          header: ({ column }) => <DataTableColumnHeader column={column} title="Paravet" />,
          filterFn: createSmartFilterFn<HandlingRow>(),
        },
        {
          accessorKey: "adminName",
          header: ({ column }) => <DataTableColumnHeader column={column} title="Admin" />,
          filterFn: createSmartFilterFn<HandlingRow>(),
        },
        {
          accessorKey: "groomerName",
          header: ({ column }) => <DataTableColumnHeader column={column} title="Groomer" />,
          filterFn: createSmartFilterFn<HandlingRow>(),
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

  React.useEffect(() => {
    // Sembunyikan kolom detail secara default; bisa ditampilkan via View Options
    const col = table.getColumn("detail");
    if (col && col.getIsVisible()) col.toggleVisibility(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleExportExcel = React.useCallback(() => {
    const exportRows = rows.map((r) => ({
      Tanggal: r.date,
      Tipe: r.type,
      Booking: r.bookingId ?? "",
      Owner: r.ownerName ?? "",
      Hewan: r.petName ?? "",
      Layanan: r.serviceName ?? "",
      Dokter: r.doctorName ?? "",
      Paravet: r.paravetName ?? "",
      Admin: r.adminName ?? "",
      Groomer: r.groomerName ?? "",
      Detail: r.detail ?? "",
    }));
    const worksheet = XLSX.utils.json_to_sheet(exportRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Penanganan");
    const filename = `laporan-penanganan_${start}_sd_${end}${role ? `_${role.toLowerCase()}` : ""}${
      staffId ? `_staff_${staffId}` : ""
    }.xlsx`;
    XLSX.writeFile(workbook, filename);
  }, [rows, start, end, role, staffId]);

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
      if (role) qs.set("role", role);
      if (staffId) qs.set("staffId", staffId);
      const res = await fetch(`/api/reports/handling?${qs.toString()}`, { cache: "no-store" });
      const data = await res.json();
      const items = Array.isArray(data?.items) ? (data.items as unknown[]) : [];
      const mapped: HandlingRow[] = items.map((d: unknown, idx: number) => {
        const obj = (d ?? {}) as Record<string, unknown>;
        const typeStr = toStringSafe(obj.type);
        return {
          id: String(idx),
          date: toStringSafe(obj.date),
          type: typeStr === "VISIT" ? "VISIT" : typeStr === "SERVICE" ? "SERVICE" : "EXAM",
          bookingId: toIdOptional(obj.bookingId),
          bookingPetId: toIdOptional(obj.bookingPetId),
          ownerName: toStringSafe(obj.ownerName),
          petName: toStringSafe(obj.petName),
          serviceName: toStringSafe(obj.serviceName),
          serviceTypeName: toStringSafe((obj as any).serviceTypeName ?? (obj as any).serviceType ?? ""),
          doctorName: toStringSafe(obj.doctorName),
          paravetName: toStringSafe(obj.paravetName),
          adminName: toStringSafe(obj.adminName),
          groomerName: toStringSafe(obj.groomerName),
          detail: toStringSafe(obj.detail),
        };
      });
      setRows(mapped);
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => {
    void fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredStaffs = React.useMemo(() => {
    if (role === "DOCTOR") return staffs.filter((s) => s.jobRole === "DOCTOR");
    if (role === "PARAVET") return staffs.filter((s) => s.jobRole === "PARAVET");
    if (role === "ADMIN") return staffs.filter((s) => s.jobRole === "ADMIN");
    if (role === "GROOMER") return staffs.filter((s) => s.jobRole === "GROOMER");
    return staffs;
  }, [role, staffs]);

  return (
    <div className="grid min-w-0 gap-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
        <div className="grid gap-1">
          <Label htmlFor="h-start">Mulai</Label>
          <Input id="h-start" type="date" value={start} onChange={(e) => setStart(e.target.value)} />
        </div>
        <div className="grid gap-1">
          <Label htmlFor="h-end">Selesai</Label>
          <Input id="h-end" type="date" value={end} onChange={(e) => setEnd(e.target.value)} />
        </div>
        <div className="grid gap-1">
          <Label>Peran</Label>
          <Select value={role} onValueChange={setRole}>
            <SelectTrigger>
              <SelectValue placeholder="Pilih peran" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Semua</SelectItem>
              <SelectItem value="DOCTOR">Dokter</SelectItem>
              <SelectItem value="PARAVET">Paravet</SelectItem>
              <SelectItem value="ADMIN">Admin</SelectItem>
              <SelectItem value="GROOMER">Groomer</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-1">
          <Label>Staff (opsional)</Label>
          <Select value={staffId} onValueChange={setStaffId}>
            <SelectTrigger>
              <SelectValue placeholder="Pilih staff" />
            </SelectTrigger>
            <SelectContent>
              {filteredStaffs.map((s) => (
                <SelectItem key={s.id} value={String(s.id)}>
                  #{s.id} — {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-end gap-2">
          <Button onClick={() => void fetchData()} disabled={loading} className="w-full">
            {loading ? "Memuat..." : "Terapkan"}
          </Button>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => {
              setRole("ALL");
              setStaffId("");
              setStart(startDefault);
              setEnd(endDefault);
            }}
          >
            Reset
          </Button>
        </div>
      </div>

      <div className="min-w-0 rounded-md border">
        <div className="flex items-center justify-between p-2">
          <DataTableViewOptions table={table} />
          <Button variant="outline" size="sm" onClick={handleExportExcel} disabled={!rows.length}>
            Export Excel
          </Button>
        </div>
        <DataTable table={table} columns={columns} />
        <div className="p-2">
          <DataTablePagination table={table} />
        </div>
      </div>
    </div>
  );
}
