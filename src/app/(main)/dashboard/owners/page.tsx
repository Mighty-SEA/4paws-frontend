import { cookies, headers } from "next/headers";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { OwnerTable } from "./_components/owner-table";
import { PetTable } from "./pets/pet-table";

async function getInitialOwners() {
  const hdrs = await headers();
  const host = hdrs.get("host");
  const protocol = hdrs.get("x-forwarded-proto") ?? "http";
  const base = `${protocol}://${host}`;
  const cookie = hdrs.get("cookie") ?? "";
  const res = await fetch(`${base}/api/owners?page=1&pageSize=10`, {
    cache: "no-store",
    headers: { cookie },
  });
  if (!res.ok) {
    return { items: [], total: 0, page: 1, pageSize: 10 };
  }
  return res.json();
}
export default async function OwnersPage() {
  await cookies();
  const initial = await getInitialOwners();
  // Compute filtered pet counts (exclude name "Petshop") for first page on server to avoid UI flicker
  const hdrs = await headers();
  const host = hdrs.get("host");
  const protocol = hdrs.get("x-forwarded-proto") ?? "http";
  const base = `${protocol}://${host}`;
  const cookie = hdrs.get("cookie") ?? "";
  const itemsWithCounts = await Promise.all(
    (Array.isArray(initial?.items) ? initial.items : []).map(async (it: any) => {
      try {
        const r = await fetch(`${base}/api/owners/${it.id}`, { cache: "no-store", headers: { cookie } });
        const d = await r.json().catch(() => null);
        const filtered = Array.isArray(d?.pets)
          ? d.pets.filter((p: any) => String(p?.name ?? "").toLowerCase() !== "petshop").length
          : 0;
        return { ...it, petCountFiltered: filtered };
      } catch {
        return { ...it };
      }
    }),
  );
  const initialWithCounts = { ...initial, items: itemsWithCounts };
  return (
    <div className="grid grid-cols-1 gap-4">
      <div className="flex items-center justify-end">
        <Button asChild variant="outline" size="sm">
          <Link href="/dashboard/owners/species">Kelola Jenis Hewan</Link>
        </Button>
      </div>
      <Tabs defaultValue="owners" className="w-full">
        <TabsList>
          <TabsTrigger value="owners">Owners</TabsTrigger>
          <TabsTrigger value="pets">Hewan</TabsTrigger>
        </TabsList>
        <TabsContent value="owners">
          <OwnerTable initial={initialWithCounts} />
        </TabsContent>
        <TabsContent value="pets">
          <PetTable />
        </TabsContent>
      </Tabs>
    </div>
  );
}
