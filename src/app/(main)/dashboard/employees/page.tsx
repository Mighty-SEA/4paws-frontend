import { headers } from "next/headers";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { StaffCrud } from "./_components/staff-crud";
import { UsersCrud } from "./_components/users-crud";

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

export default async function EmployeesPage() {
  const [staff, users] = await Promise.all([fetchJSON("/api/staff"), fetchJSON("/api/users")]);
  return (
    <div className="grid gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Karyawan</h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Data</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="staff" className="w-full">
            <TabsList>
              <TabsTrigger value="staff">Data Karyawan</TabsTrigger>
              <TabsTrigger value="users">Data User</TabsTrigger>
            </TabsList>
            <TabsContent value="staff">
              <StaffCrud initial={Array.isArray(staff) ? staff : []} />
            </TabsContent>
            <TabsContent value="users">
              <UsersCrud initial={Array.isArray(users) ? users : []} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
