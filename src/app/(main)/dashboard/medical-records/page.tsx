import { headers } from "next/headers";

import type { PetRow } from "./_components/columns";
import { MedicalRecordTable } from "./_components/medical-record-table";

async function fetchJSON(path: string) {
  const hdrs = await headers();
  const host = hdrs.get("host");
  const protocol = hdrs.get("x-forwarded-proto") ?? "http";
  const base = `${protocol}://${host}`;
  const cookie = hdrs.get("cookie") ?? "";
  const res = await fetch(`${base}${path}`, {
    headers: { cookie },
    next: { revalidate: 60, tags: ["pets", "medical-records"] },
  });
  if (!res.ok) return null;
  return res.json();
}

export default async function MedicalRecordsIndexPage() {
  const data = await fetchJSON(`/api/owners/pets?page=1&pageSize=200`);
  const raw = Array.isArray(data?.items) ? data.items : [];
  const baseItems: PetRow[] = raw
    .filter((p: any) => String(p?.name ?? "").toLowerCase() !== "petshop")
    .map(
      (p: any) =>
        ({
          id: Number(p.id),
          name: String(p.name ?? "-"),
          ownerName: p.owner?.name ?? String(p.ownerId ?? "-"),
          species: String(p.species ?? ""),
          breed: String(p.breed ?? ""),
          speciesBreed: [p.species, p.breed].filter(Boolean).join(" / "),
        }) as PetRow,
    );

  // Enrich with latest visit/exam date by fetching each pet's medical records
  const items: PetRow[] = await Promise.all(
    baseItems.map(async (it) => {
      try {
        const detail = await fetchJSON(`/api/owners/pets/${it.id}/medical-records`);
        const records = Array.isArray(detail?.records) ? detail.records : [];
        let latest = 0;
        let lastServiceName: string | undefined;
        let lastAnamnesis: string | undefined;
        for (const rec of records) {
          const serviceName = rec?.booking?.serviceType?.service?.name as string | undefined;
          const exams = Array.isArray(rec?.examinations) ? rec.examinations : [];
          for (const ex of exams) {
            const d = new Date((ex.createdAt ?? ex.updatedAt ?? ex.examDate) as string);
            const t = isNaN(+d) ? 0 : +d;
            if (t > latest) {
              latest = t;
              lastServiceName = serviceName;
              lastAnamnesis = String(ex.chiefComplaint ?? ex.notes ?? ex.additionalNotes ?? "").trim() || undefined;
            }
          }
          const visits = Array.isArray(rec?.visits) ? rec.visits : [];
          for (const v of visits) {
            const dv = new Date((v.visitDate ?? v.createdAt) as string);
            const tv = isNaN(+dv) ? 0 : +dv;
            if (tv > latest) {
              latest = tv;
              lastServiceName = serviceName;
              lastAnamnesis = String(v.symptoms ?? v.notes ?? "").trim() || undefined;
            }
          }
        }
        return {
          ...it,
          lastVisitAt: latest ? new Date(latest).toISOString() : undefined,
          lastServiceName,
          lastAnamnesis,
        } as PetRow;
      } catch {
        return it;
      }
    }),
  );
  // Sort by latest visit/exam desc so active cases (rawat inap/pet hotel) appear on top
  items.sort((a, b) => {
    const ta = a.lastVisitAt ? +new Date(a.lastVisitAt) : 0;
    const tb = b.lastVisitAt ? +new Date(b.lastVisitAt) : 0;
    return tb - ta;
  });
  const initial = { items, total: data?.total ?? items.length, page: data?.page ?? 1, pageSize: data?.pageSize ?? 200 };

  return (
    <div className="grid grid-cols-1 gap-4">
      <MedicalRecordTable initial={initial} />
    </div>
  );
}
