"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

export default function ProductsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const isProductsActive = pathname.includes("/products/products");
  const isMixActive = pathname.includes("/products/mix");
  const isHistoryActive = pathname.includes("/products/history");

  // Don't show layout for restock page
  const isRestockPage = pathname.includes("/products/restock");

  if (isRestockPage) {
    return <>{children}</>;
  }

  return (
    <div className="grid grid-cols-1 gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Products</h1>
      </div>

      {/* Tab Navigation */}
      <div className="border-b">
        <div className="flex gap-1">
          <Link
            href="/dashboard/products/products"
            className={cn(
              "hover:text-primary px-4 py-2 text-sm font-medium transition-colors",
              isProductsActive ? "border-primary text-primary border-b-2" : "text-muted-foreground",
            )}
          >
            Produk
          </Link>
          <Link
            href="/dashboard/products/mix"
            className={cn(
              "hover:text-primary px-4 py-2 text-sm font-medium transition-colors",
              isMixActive ? "border-primary text-primary border-b-2" : "text-muted-foreground",
            )}
          >
            Mix Product
          </Link>
          <Link
            href="/dashboard/products/history"
            className={cn(
              "hover:text-primary px-4 py-2 text-sm font-medium transition-colors",
              isHistoryActive ? "border-primary text-primary border-b-2" : "text-muted-foreground",
            )}
          >
            Riwayat Restock/Adjustment
          </Link>
        </div>
      </div>

      {/* Page Content */}
      {children}
    </div>
  );
}
