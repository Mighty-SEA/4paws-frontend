"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function StaffCrud({ initial }: { initial: any[] }) {
  const [items, setItems] = React.useState<any[]>(Array.isArray(initial) ? initial : []);
  const [name, setName] = React.useState("");
  const [jobRole, setJobRole] = React.useState("SUPERVISOR");
  const [loading, setLoading] = React.useState(false);

  async function createStaff() {
    setLoading(true);
    try {
      const res = await fetch("/api/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, jobRole }),
      });
      const data = await res.json();
      if (res.ok) {
        setItems((prev) => [...prev, data]);
        setName("");
        setJobRole("SUPERVISOR");
      } else {
        alert(data?.message ?? "Gagal membuat staff");
      }
    } finally {
      setLoading(false);
    }
  }

  async function deleteStaff(id: number) {
    if (!confirm("Hapus staff ini?")) return;
    const res = await fetch(`/api/staff/${id}`, { method: "DELETE" });
    if (res.ok) setItems((prev) => prev.filter((x) => x.id !== id));
  }

  return (
    <div className="grid gap-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-5">
        <div className="grid gap-1">
          <Label>Nama</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="grid gap-1">
          <Label>Job Role</Label>
          <Select value={jobRole} onValueChange={setJobRole}>
            <SelectTrigger>
              <SelectValue placeholder="Pilih jabatan" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="SUPERVISOR">SUPERVISOR</SelectItem>
              <SelectItem value="DOCTOR">DOCTOR</SelectItem>
              <SelectItem value="PARAVET">PARAVET</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* User ID diisi otomatis oleh server dari JWT */}
        <div className="flex items-end">
          <Button onClick={() => void createStaff()} disabled={loading || !name} className="w-full">
            Tambah Staff
          </Button>
        </div>
      </div>

      <div className="divide-y rounded-md border">
        {items.map((s) => (
          <div key={s.id} className="grid grid-cols-5 gap-2 p-2 text-sm">
            <div>#{s.id}</div>
            <div>{s.name}</div>
            <div>{s.jobRole}</div>
            <div>{s.user?.username ?? "-"}</div>
            <div className="text-right">
              <Button variant="destructive" size="sm" onClick={() => void deleteStaff(s.id)}>
                Hapus
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
