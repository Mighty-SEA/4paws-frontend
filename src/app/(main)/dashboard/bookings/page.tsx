import { headers } from "next/headers";

import { BookingTable } from "./_components/booking-table";
import type { BookingRow } from "./_components/columns";
import { BookingForm } from "./new/_components/booking-form";

async function fetchJSON(path: string) {
  const hdrs = await headers();
  const host = hdrs.get("host");
  const protocol = hdrs.get("x-forwarded-proto") ?? "http";
  const base = `${protocol}://${host}`;
  const cookie = hdrs.get("cookie") ?? "";
  const res = await fetch(`${base}${path}`, { headers: { cookie }, cache: "no-store" });
  if (!res.ok) return null;
  return res.json();
}

// eslint-disable-next-line complexity
function mapToRow(b: any): BookingRow {
  return {
    id: b.id,
    ownerName: b.owner?.name ?? "-",
    petNames: Array.isArray(b.pets)
      ? b.pets
          .map((bp: any) => bp.pet?.name)
          .filter(Boolean)
          .join(", ")
      : undefined,
    firstPetId:
      Array.isArray(b.pets) && b.pets.length
        ? Number(b.pets[0]?.pet?.id ?? b.pets[0]?.petId ?? b.pets[0]?.id)
        : undefined,
    petCount: Array.isArray(b.pets) ? b.pets.length : 0,
    serviceName: b.serviceType?.service?.name ?? "-",
    serviceTypeName: b.serviceType?.name ?? "-",
    status: b.status,
    createdAt: b.createdAt,
    isPerDay: /rawat inap|pet hotel/i.test(String(b?.serviceType?.service?.name ?? "")),
    hasExam: Array.isArray(b.pets)
      ? b.pets.some((p: any) => Array.isArray(p.examinations) && p.examinations.length > 0)
      : false,
    hasDeposit: Array.isArray(b.deposits) ? b.deposits.length > 0 : false,
    groomerNames: (() => {
      const serviceName = String(b.serviceType?.service?.name ?? "");
      const isGroom = serviceName.toLowerCase().includes("groom");
      if (!isGroom) return undefined;
      const names = new Set<string>();
      const pets = Array.isArray(b.pets) ? b.pets : [];
      for (const bp of pets) {
        const exams = Array.isArray(bp.examinations) ? bp.examinations : [];
        for (const ex of exams) if (ex?.groomer?.name) names.add(ex.groomer.name);
        const visits = Array.isArray(bp.visits) ? bp.visits : [];
        for (const v of visits) if (v?.groomer?.name) names.add(v.groomer.name);
      }
      return names.size ? Array.from(names).join(", ") : undefined;
    })(),
  } as BookingRow;
}

export default async function BookingsPage() {
  const [data, services, owners] = await Promise.all([
    fetchJSON("/api/bookings?page=1&pageSize=10"),
    fetchJSON("/api/services"),
    fetchJSON("/api/owners?page=1&pageSize=100"),
  ]);
  const mapped = data
    ? {
        ...data,
        items: (data.items as any[]).map((b) => ({
          ...(mapToRow as any)(b),
          proceedToAdmission: false,
        })),
      }
    : { items: [], total: 0, page: 1, pageSize: 10 };
  return (
    <div className="grid grid-cols-1 gap-4">
      <BookingForm
        services={Array.isArray(services) ? services : []}
        owners={Array.isArray(owners?.items) ? owners.items : []}
      />
      <BookingTable initial={mapped} />
    </div>
  );
}
