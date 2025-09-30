import { headers, cookies } from "next/headers";
import { redirect } from "next/navigation";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
  // Protect page: only MASTER/SUPERVISOR can view; ADMIN redirected
  const ck = await cookies();
  const token = ck.get("auth-token")?.value;
  if (!token) redirect("/auth/v1/login");
  try {
    const payloadSegment = token.split(".")[1];
    const json = Buffer.from(payloadSegment, "base64").toString("utf8");
    const payload = JSON.parse(json) as { accountRole?: string; role?: string };
    const role = String(payload.accountRole ?? payload.role ?? "").toUpperCase();
    if (role === "ADMIN") redirect("/dashboard/owners");
  } catch {
    // if decode fails, allow by default (or redirect to owners)
  }
  const [staff, users] = await Promise.all([fetchJSON("/api/staff"), fetchJSON("/api/users")]);
  const staffCount = Array.isArray(staff) ? staff.length : 0;
  const usersCount = Array.isArray(users) ? users.length : 0;
  return (
    <div className="grid gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Karyawan & User</h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Manajemen Karyawan & User</CardTitle>
          <CardDescription>
            Kelola data karyawan dan akun login yang terhubung. Gunakan tab untuk berpindah.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="staff" className="w-full">
            <TabsList>
              <TabsTrigger value="staff">Data Karyawan ({staffCount})</TabsTrigger>
              <TabsTrigger value="users">Data User ({usersCount})</TabsTrigger>
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
