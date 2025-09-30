import { headers } from "next/headers";

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

export default async function PetshopPage() {
  const products = (await fetchJSON("/api/products")) ?? [];
  return (
    <div className="grid gap-4">
      <h1 className="text-xl font-semibold">Petshop</h1>
      <div className="rounded-md border">
        <div className="grid grid-cols-12 gap-2 p-2 text-xs font-medium">
          <div className="col-span-6">Produk</div>
          <div className="col-span-3 text-right">Harga</div>
          <div className="col-span-3 text-right">Aksi</div>
        </div>
        <div className="grid gap-1 p-2">
          {Array.isArray(products) && products.length ? (
            products.map((p: any) => (
              <div key={p.id} className="grid grid-cols-12 items-center gap-2 text-sm">
                <div className="col-span-6">
                  <div className="font-medium">{p.name}</div>
                </div>
                <div className="col-span-3 text-right">Rp {Number(p.price ?? 0).toLocaleString("id-ID")}</div>
                <div className="text-muted-foreground col-span-3 text-right text-xs">Tidak menampilkan stok</div>
              </div>
            ))
          ) : (
            <div className="text-muted-foreground text-sm">Belum ada produk</div>
          )}
        </div>
      </div>
    </div>
  );
}
