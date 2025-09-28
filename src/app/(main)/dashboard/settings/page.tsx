/* eslint-disable no-underscore-dangle */
"use client";

import { useEffect, useMemo, useState } from "react";

import { Trash2, Plus, Store, CreditCard } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

type BankAccount = {
  id: number;
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  isActive: boolean;
  sortOrder: number;
};

type StoreSetting = {
  id: number;
  name?: string | null;
  address: string;
  phone: string;
  bankAccounts: BankAccount[];
};

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [setting, setSetting] = useState<StoreSetting | null>(null);

  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");

  type LocalBankAccount = BankAccount & { _localId: string; _isNew?: boolean; _deleted?: boolean };
  const [accounts, setAccounts] = useState<LocalBankAccount[]>([]);
  const [originalAccounts, setOriginalAccounts] = useState<BankAccount[]>([]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const res = await fetch("/api/settings", { cache: "no-store" });
      const data = await res.json();
      setSetting(data ?? null);
      setName(data?.name ?? "");
      setAddress(data?.address ?? "");
      setPhone(data?.phone ?? "");
      const serverAccounts: BankAccount[] = Array.isArray(data?.bankAccounts) ? data.bankAccounts : [];
      setOriginalAccounts(serverAccounts);
      setAccounts(
        serverAccounts
          .sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id)
          .map((acc) => ({ ...acc, _localId: String(acc.id) })),
      );
      setLoading(false);
    };
    load();
  }, []);

  const addLocalAccount = () => {
    const local: LocalBankAccount = {
      id: 0,
      _localId: `new-${Date.now()}`,
      _isNew: true,
      bankName: "",
      accountNumber: "",
      accountHolder: "",
      isActive: true,
      sortOrder: (accounts[accounts.length - 1]?.sortOrder ?? 0) + 1,
    };
    setAccounts((prev) => [...prev, local]);
  };

  const markDeleteLocal = (localId: string) => {
    setAccounts((prev) => prev.map((a) => (a._localId === localId ? { ...a, _deleted: !a._deleted } : a)));
  };

  const updateLocal = (localId: string, field: keyof BankAccount, value: string | boolean) => {
    setAccounts((prev) =>
      prev.map((a) => (a._localId === localId ? ({ ...a, [field]: value } as LocalBankAccount) : a)),
    );
  };

  const saveAll = async () => {
    setSaving(true);
    try {
      // 1) Save store settings
      const resSettings = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, address, phone }),
      });
      if (!resSettings.ok) {
        const msg = await resSettings.text().catch(() => "Gagal menyimpan pengaturan toko");
        throw new Error(msg || "Gagal menyimpan pengaturan toko");
      }

      // 2) Diff bank accounts
      const origMap = new Map<number, BankAccount>(originalAccounts.map((a) => [a.id, a]));
      const toCreate = accounts.filter((a) => a._isNew && !a._deleted);
      const toDelete = accounts.filter((a) => !a._isNew && a._deleted && a.id > 0);
      const toMaybeUpdate = accounts.filter((a) => !a._isNew && !a._deleted && a.id > 0);

      // 2a) Create new
      for (const a of toCreate) {
        const res = await fetch("/api/settings/bank-accounts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            bankName: a.bankName,
            accountNumber: a.accountNumber,
            accountHolder: a.accountHolder,
            isActive: a.isActive,
            sortOrder: a.sortOrder,
          }),
        });
        if (!res.ok) {
          const msg = await res.text().catch(() => "Gagal menambah rekening");
          throw new Error(msg || "Gagal menambah rekening");
        }
      }

      // 2b) Updates (only changed fields)
      for (const a of toMaybeUpdate) {
        const o = origMap.get(a.id);
        if (!o) continue;
        const changed: any = {};
        if (a.bankName !== o.bankName) changed.bankName = a.bankName;
        if (a.accountNumber !== o.accountNumber) changed.accountNumber = a.accountNumber;
        if (a.accountHolder !== o.accountHolder) changed.accountHolder = a.accountHolder;
        if (a.isActive !== o.isActive) changed.isActive = a.isActive;
        if (a.sortOrder !== o.sortOrder) changed.sortOrder = a.sortOrder;
        if (Object.keys(changed).length === 0) continue;
        const res = await fetch(`/api/settings/bank-accounts/${a.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(changed),
        });
        if (!res.ok) {
          const msg = await res.text().catch(() => "Gagal memperbarui rekening");
          throw new Error(msg || "Gagal memperbarui rekening");
        }
      }

      // 2c) Deletes
      for (const a of toDelete) {
        const res = await fetch(`/api/settings/bank-accounts/${a.id}`, { method: "DELETE" });
        if (!res.ok) {
          const msg = await res.text().catch(() => "Gagal menghapus rekening");
          throw new Error(msg || "Gagal menghapus rekening");
        }
      }

      // Reload
      const res = await fetch("/api/settings", { cache: "no-store" });
      const data = await res.json();
      setSetting(data ?? null);
      setOriginalAccounts(Array.isArray(data?.bankAccounts) ? data.bankAccounts : []);
      setAccounts(
        (Array.isArray(data?.bankAccounts) ? data.bankAccounts : [])
          .sort((a: BankAccount, b: BankAccount) => a.sortOrder - b.sortOrder || a.id - b.id)
          .map((acc: BankAccount) => ({ ...acc, _localId: String(acc.id) })),
      );
      toast.success("Perubahan tersimpan");
    } catch (e: any) {
      const msg = typeof e?.message === "string" ? e.message : "Gagal menyimpan perubahan";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <div className="border-primary mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-b-2"></div>
          <p className="text-muted-foreground">Memuat pengaturan...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-4xl space-y-8 p-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Pengaturan</h1>
        <p className="text-muted-foreground">Kelola informasi toko dan rekening bank untuk invoice</p>
      </div>

      {/* Store Information */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <Store className="text-primary h-5 w-5" />
            <CardTitle className="text-xl">Informasi Toko</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium">
                Nama Toko
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="4PAWS Petcare"
                className="h-10"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-sm font-medium">
                Nomor Telepon
              </Label>
              <Input
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="08123456789"
                className="h-10"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="address" className="text-sm font-medium">
              Alamat Lengkap
            </Label>
            <Input
              id="address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Jl. Contoh No. 123, Kota, Provinsi"
              className="h-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Bank Accounts */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CreditCard className="text-primary h-5 w-5" />
              <CardTitle className="text-xl">Rekening Bank</CardTitle>
            </div>
            <Button variant="outline" size="sm" onClick={addLocalAccount} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Tambah Rekening
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {accounts.filter((a) => !a._deleted).length === 0 ? (
            <div className="text-muted-foreground py-8 text-center">
              <CreditCard className="mx-auto mb-4 h-12 w-12 opacity-50" />
              <p className="text-sm">Belum ada rekening bank</p>
              <p className="mt-1 text-xs">Tambahkan rekening untuk ditampilkan di invoice</p>
            </div>
          ) : (
            <div className="space-y-4">
              {accounts.map((acc) => (
                <div
                  key={acc._localId}
                  className={`bg-card relative rounded-lg border transition-all ${
                    acc._deleted ? "bg-muted/50 opacity-50" : "hover:shadow-sm"
                  }`}
                >
                  <div className="space-y-4 p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {acc._isNew && (
                          <Badge variant="secondary" className="text-xs">
                            Baru
                          </Badge>
                        )}
                        {acc._deleted && (
                          <Badge variant="destructive" className="text-xs">
                            Akan Dihapus
                          </Badge>
                        )}
                      </div>
                      <Button
                        size="sm"
                        variant={acc._deleted ? "outline" : "ghost"}
                        onClick={() => markDeleteLocal(acc._localId)}
                        className="text-destructive hover:text-destructive flex items-center gap-2"
                      >
                        <Trash2 className="h-4 w-4" />
                        {acc._deleted ? "Batalkan" : "Hapus"}
                      </Button>
                    </div>

                    <div className="grid gap-4 md:grid-cols-3">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Nama Bank</Label>
                        <Input
                          value={acc.bankName}
                          onChange={(e) => updateLocal(acc._localId, "bankName", e.target.value)}
                          placeholder="BCA, BNI, Mandiri, dll"
                          className="h-9"
                          disabled={acc._deleted}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Nomor Rekening</Label>
                        <Input
                          value={acc.accountNumber}
                          onChange={(e) => updateLocal(acc._localId, "accountNumber", e.target.value)}
                          placeholder="1234567890"
                          className="h-9"
                          disabled={acc._deleted}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Atas Nama</Label>
                        <Input
                          value={acc.accountHolder}
                          onChange={(e) => updateLocal(acc._localId, "accountHolder", e.target.value)}
                          placeholder="Nama Pemilik Rekening"
                          className="h-9"
                          disabled={acc._deleted}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end pt-4">
        <Button onClick={saveAll} disabled={saving} size="lg" className="min-w-[200px]">
          {saving ? (
            <>
              <div className="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-white"></div>
              Menyimpan...
            </>
          ) : (
            "Simpan Semua Perubahan"
          )}
        </Button>
      </div>
    </div>
  );
}
