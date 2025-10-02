import { headers } from "next/headers";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { ServiceSelector } from "./_components/service-selector";
import { ServiceTable, ServiceTypeTable } from "./_components/service-tables";

async function getData(path: string) {
  const hdrs = await headers();
  const host = hdrs.get("host");
  const protocol = hdrs.get("x-forwarded-proto") ?? "http";
  const base = `${protocol}://${host}`;
  const cookie = hdrs.get("cookie") ?? "";
  const res = await fetch(`${base}${path}`, {
    headers: { cookie },
    next: { revalidate: 60, tags: ["services", "service-types"] },
  });
  if (!res.ok) return [] as never[];
  return res.json();
}

export default async function ServicesPage() {
  const services = await getData("/api/services");
  const serviceTypesRaw = await getData("/api/service-types");
  const serviceTypes = Array.isArray(serviceTypesRaw)
    ? serviceTypesRaw.map((t: any) => ({
        id: t.id,
        name: t.name,
        serviceId: t.serviceId,
        serviceName: t.service?.name,
        price: t.price ?? null,
        pricePerDay: t.pricePerDay ?? null,
      }))
    : [];
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold">Service Catalog</h1>
      <Tabs defaultValue="services" className="w-full">
        <TabsList>
          <TabsTrigger value="services">Services</TabsTrigger>
          <TabsTrigger value="service-types">Service Types</TabsTrigger>
        </TabsList>
        <TabsContent value="services">
          <ServiceTable items={services} />
        </TabsContent>
        <TabsContent value="service-types">
          <div className="flex flex-col gap-4">
            <ServiceSelector initialServices={services} />
            <ServiceTypeTable items={serviceTypes} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
