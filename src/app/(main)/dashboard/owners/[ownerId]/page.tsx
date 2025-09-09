import { cookies, headers } from "next/headers";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { AddPetForm } from "./_components/add-pet-form";

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
    address: string;
    pets: Array<{ id: number; name: string; species: string; breed: string; birthdate: string }>;
  };
}

export default async function OwnerDetailPage({ params }: { params: Promise<{ ownerId: string }> }) {
  await cookies();
  const { ownerId } = await params;
  const owner = await getOwner(ownerId);
  if (!owner) notFound();

  return (
    <div className="space-y-6">
      <div className="flex items-center">
        <Button asChild variant="outline" size="sm">
          <Link href="/dashboard/owners">Back</Link>
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>{owner.name}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">{owner.phone} • {owner.address}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Pets</CardTitle>
        </CardHeader>
        <CardContent>
          {owner.pets.length === 0 ? (
            <div className="text-sm text-muted-foreground">No pets yet.</div>
          ) : (
            <ul className="space-y-2">
              {owner.pets.map((p) => (
                <li key={p.id} className="text-sm">
                  <span className="font-medium">{p.name}</span> — {p.species} / {p.breed} • {new Date(p.birthdate).toLocaleDateString()}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <AddPetForm ownerId={Number(ownerId)} />
    </div>
  );
}
