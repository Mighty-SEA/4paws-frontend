"use client";

import * as React from "react";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type Species = { id: number; name: string; kind?: string };

export default function SpeciesSettingsPage() {
  const [items, setItems] = React.useState<Species[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [creating, setCreating] = React.useState(false);
  const [newSpecies, setNewSpecies] = React.useState("");
  const [newKind, setNewKind] = React.useState("");

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/settings/pet-species", { cache: "no-store" });
      const data = await res.json().catch(() => []);
      setItems(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  }
  React.useEffect(() => {
    void load();
  }, []);

  async function create() {
    if (!newSpecies.trim() || !newKind.trim()) return;
    setCreating(true);
    try {
      await fetch("/api/settings/pet-species", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newSpecies.trim(), kind: newKind.trim() }),
      });
      setNewSpecies("");
      setNewKind("");
      await load();
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="grid grid-cols-1 gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Kelola Jenis Hewan</h1>
        <Button asChild variant="outline" size="sm">
          <Link href="/dashboard/owners">Kembali</Link>
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Jenis & Spesies</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid grid-cols-1 gap-2 md:max-w-2xl">
            <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
              <Input
                value={newKind}
                onChange={(e) => setNewKind(e.target.value)}
                placeholder="Jenis (contoh: Anjing)"
              />
              <Input
                value={newSpecies}
                onChange={(e) => setNewSpecies(e.target.value)}
                placeholder="Spesies (contoh: Anjing)"
              />
              <Button onClick={create} disabled={creating || !newKind.trim() || !newSpecies.trim()}>
                Tambah
              </Button>
            </div>
          </div>
          <div className="overflow-hidden rounded-md border">
            <table className="w-full text-sm">
              <thead className="bg-muted/60 text-left">
                <tr>
                  <th className="w-12 p-3 text-center">#</th>
                  <th className="p-3">Jenis</th>
                  <th className="p-3">Spesies</th>
                </tr>
              </thead>
              <tbody>
                {items.map((it, idx) => (
                  <tr key={it.id} className="border-t">
                    <td className="w-12 p-3 text-center tabular-nums">{idx + 1}</td>
                    <td className="p-3">{it.kind ?? "-"}</td>
                    <td className="p-3">{it.name}</td>
                  </tr>
                ))}
                {!items.length && !loading ? (
                  <tr>
                    <td className="text-muted-foreground p-3" colSpan={3}>
                      Belum ada data
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
