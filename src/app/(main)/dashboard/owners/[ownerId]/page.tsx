import { cookies, headers } from "next/headers";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Mail, Phone, MapPin, PawPrint, CalendarDays } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

async function getOwner(ownerId: string) {
  const hdrs = await headers();
  const host = hdrs.get("host");
  const protocol = hdrs.get("x-forwarded-proto") ?? "http";
  const base = `${protocol}://${host}`;
  const cookie = hdrs.get("cookie") ?? "";
  const res = await fetch(`${base}/api/owners/${ownerId}`, { cache: "no-store", headers: { cookie } });
  if (!res.ok) return null;
  return (await res.json()) as {
    id: number;
    name: string;
    phone: string;
    email?: string | null;
    address: string;
    createdAt?: string;
    pets: Array<{ id: number; name: string; species: string; breed: string; birthdate: string }>;
  };
}

export default async function OwnerDetailPage({ params }: { params: Promise<{ ownerId: string }> }) {
  await cookies();
  const { ownerId } = await params;
  const owner = await getOwner(ownerId);
  if (!owner) notFound();
  const pets = Array.isArray(owner.pets)
    ? owner.pets.filter((p) => String(p?.name ?? "").toLowerCase() !== "petshop")
    : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center">
        <Button asChild variant="outline" size="sm">
          <Link href="/dashboard/owners">Back</Link>
        </Button>
      </div>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <span className="bg-primary/10 inline-flex size-8 items-center justify-center rounded-full text-sm font-semibold">
                {owner.name?.[0]?.toUpperCase() ?? "?"}
              </span>
              {owner.name}
            </CardTitle>
            <Badge variant="secondary" className="gap-1">
              <PawPrint className="size-3" />
              {pets.length} Pets
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="flex items-center gap-2 text-sm">
              <Mail className="text-muted-foreground size-4" />
              <span className="text-muted-foreground">Email:</span>
              <span className="font-medium">{owner.email ?? "-"}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Phone className="text-muted-foreground size-4" />
              <span className="text-muted-foreground">Phone:</span>
              <span className="font-medium">{owner.phone}</span>
            </div>
            <div className="flex items-center gap-2 text-sm md:col-span-2">
              <MapPin className="text-muted-foreground size-4" />
              <span className="text-muted-foreground">Address:</span>
              <span className="font-medium">{owner.address}</span>
            </div>
            {owner.createdAt && (
              <div className="flex items-center gap-2 text-sm">
                <CalendarDays className="text-muted-foreground size-4" />
                <span className="text-muted-foreground">Member since:</span>
                <span className="font-medium">{new Date(owner.createdAt).toLocaleDateString()}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Pets</CardTitle>
        </CardHeader>
        <CardContent>
          {pets.length === 0 ? (
            <div className="text-muted-foreground text-sm">No pets yet.</div>
          ) : (
            <div className="overflow-hidden rounded-md border">
              <table className="w-full text-sm">
                <thead className="bg-muted/60 text-left">
                  <tr>
                    <th className="w-12 p-3 text-center">#</th>
                    <th className="p-3">Nama</th>
                    <th className="p-3">Jenis</th>
                    <th className="p-3">Ras</th>
                    <th className="p-3">Lahir</th>
                  </tr>
                </thead>
                <tbody>
                  {pets.map((p, idx) => (
                    <tr key={p.id} className="border-t">
                      <td className="w-12 p-3 text-center tabular-nums">{idx + 1}</td>
                      <td className="p-3 font-medium">{p.name}</td>
                      <td className="p-3">{p.species}</td>
                      <td className="p-3">{p.breed}</td>
                      <td className="p-3">{new Date(p.birthdate).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* AddPetForm removed: pet creation moved to Owners > Hewan tab */}
    </div>
  );
}
