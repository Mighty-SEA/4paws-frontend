"use client";

import * as React from "react";

import type { ColumnDef } from "@tanstack/react-table";
import * as XLSX from "xlsx";

import { DataTable } from "@/components/data-table/data-table";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { DataTablePagination } from "@/components/data-table/data-table-pagination";
import { DataTableViewOptions } from "@/components/data-table/data-table-view-options";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useDataTableInstance } from "@/hooks/use-data-table-instance";

type HandlingRow = {
  id: string;
  date: string;
  type: "EXAM" | "VISIT";
  bookingId?: number;
  bookingPetId?: number;
  ownerName?: string;
  petName?: string;
  serviceName?: string;
  doctorName?: string;
  paravetName?: string;
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
  const startDefault = React.useMemo(
    () => new Date(today.getFullYear(), today.getMonth(), 1).toISOString().slice(0, 10),
    [today],
  );
  const endDefault = React.useMemo(
    () => new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().slice(0, 10),
    [today],
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

  const columns = React.useMemo<ColumnDef<HandlingRow, any>[]>(
    () => [
      {
        accessorKey: "date",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Tanggal" />,
        cell: ({ row }) => <span className="tabular-nums">{row.original.date}</span>,
      },
      {
        accessorKey: "type",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Tipe" />,
      },
      {
        accessorKey: "bookingId",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Booking" />,
        cell: ({ row }) => <span>#{row.original.bookingId}</span>,
      },
      {
        accessorKey: "ownerName",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Owner" />,
      },
      {
        accessorKey: "petName",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Hewan" />,
      },
      {
        accessorKey: "serviceName",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Layanan" />,
      },
      {
        accessorKey: "doctorName",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Dokter" />,
      },
      {
        accessorKey: "paravetName",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Paravet" />,
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
    ],
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
      const qs = new URLSearchParams();
      if (start) qs.set("start", start);
      if (end) qs.set("end", end);
      if (role) qs.set("role", role);
      if (staffId) qs.set("staffId", staffId);
      const res = await fetch(`/api/reports/handling?${qs.toString()}`, { cache: "no-store" });
      const data = await res.json();
      const items = Array.isArray(data?.items) ? data.items : [];
      const mapped: HandlingRow[] = items.map((d: any, idx: number) => ({
        id: String(idx),
        date: String(d.date ?? ""),
        type: d.type === "VISIT" ? "VISIT" : "EXAM",
        bookingId: d.bookingId ? Number(d.bookingId) : undefined,
        bookingPetId: d.bookingPetId ? Number(d.bookingPetId) : undefined,
        ownerName: d.ownerName ?? "",
        petName: d.petName ?? "",
        serviceName: d.serviceName ?? "",
        doctorName: d.doctorName ?? "",
        paravetName: d.paravetName ?? "",
        detail: d.detail ?? "",
      }));
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
