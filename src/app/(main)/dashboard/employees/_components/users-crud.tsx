"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function UsersCrud({ initial }: { initial: any[] }) {
  const [items, setItems] = React.useState<any[]>(Array.isArray(initial) ? initial : []);
  const [username, setUsername] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [accountRole, setAccountRole] = React.useState("SUPERVISOR");
  const [staffId, setStaffId] = React.useState("");
  const [staffs, setStaffs] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    void (async () => {
      const res = await fetch("/api/staff", { cache: "no-store" });
      const data = await res.json().catch(() => []);
      if (Array.isArray(data)) setStaffs(data);
    })();
  }, []);

  async function createUser() {
    setLoading(true);
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, accountRole, staffId: staffId ? Number(staffId) : undefined }),
      });
      const data = await res.json();
      if (res.ok) {
        setItems((prev) => [...prev, data]);
        setUsername("");
        setPassword("");
        setAccountRole("SUPERVISOR");
        setStaffId("");
      } else {
        alert(data?.message ?? "Gagal membuat user");
      }
    } finally {
      setLoading(false);
    }
  }

  async function deleteUser(id: number) {
    if (!confirm("Hapus user ini?")) return;
    const res = await fetch(`/api/users/${id}`, { method: "DELETE" });
    if (res.ok) setItems((prev) => prev.filter((x) => x.id !== id));
  }

  return (
    <div className="grid gap-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-5">
        <div className="grid gap-1">
          <Label>Username</Label>
          <Input value={username} onChange={(e) => setUsername(e.target.value)} />
        </div>
        <div className="grid gap-1">
          <Label>Password</Label>
          <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        <div className="grid gap-1">
          <Label>Account Role</Label>
          <Select value={accountRole} onValueChange={setAccountRole}>
            <SelectTrigger>
              <SelectValue placeholder="Pilih role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="MASTER">MASTER</SelectItem>
              <SelectItem value="SUPERVISOR">SUPERVISOR</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-1">
          <Label>Staff</Label>
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
        <div className="flex items-end">
          <Button
            onClick={() => void createUser()}
            disabled={loading || !username || !password || !staffId}
            className="w-full"
          >
            Tambah User
          </Button>
        </div>
      </div>

      <div className="divide-y rounded-md border">
        {items.map((u) => (
          <div key={u.id} className="grid grid-cols-5 gap-2 p-2 text-sm">
            <div>#{u.id}</div>
            <div>{u.username}</div>
            <div>{u.accountRole}</div>
            <div>{u.staff?.name ?? "-"}</div>
            <div className="text-right">
              <Button variant="destructive" size="sm" onClick={() => void deleteUser(u.id)}>
                Hapus
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
