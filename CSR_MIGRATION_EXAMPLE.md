# 🔄 CSR Migration - Contoh Implementasi

## Step-by-Step: Convert SSR → CSR untuk Owners Page

### 📁 File yang Perlu Diubah:

1. `src/app/(main)/dashboard/owners/owners/page.tsx` - Convert ke CSR
2. `src/app/(main)/dashboard/owners/_components/owner-table.tsx` - Add React Query
3. `src/app/(main)/dashboard/owners/_components/owner-table-skeleton.tsx` - NEW (loading state)

---

## 1️⃣ UPDATE PAGE.TSX (Parent)

### ❌ Before (SSR - LAMBAT):
```tsx
// src/app/(main)/dashboard/owners/owners/page.tsx
import { cookies, headers } from "next/headers";
import { OwnerTable } from "../_components/owner-table";

async function getInitialOwners() {
  const hdrs = await headers();
  const host = hdrs.get("host");
  const protocol = hdrs.get("x-forwarded-proto") ?? "http";
  const base = `${protocol}://${host}`;
  const cookie = hdrs.get("cookie") ?? "";
  
  const res = await fetch(`${base}/api/owners?page=1&pageSize=10`, {
    headers: { cookie },
    next: { revalidate: 30, tags: ["owners"] },
  });
  
  if (!res.ok) {
    return { items: [], total: 0, page: 1, pageSize: 10 };
  }
  return res.json();
}

export default async function OwnersListPage() {
  await cookies();
  const initial = await getInitialOwners(); // ← SSR SLOW!
  
  const itemsWithCounts = (Array.isArray(initial?.items) ? initial.items : []).map((it: any) => ({
    ...it,
    petCount: it._count?.pets ?? 0,
  }));
  
  const initialWithCounts = { ...initial, items: itemsWithCounts };
  
  return <OwnerTable initial={initialWithCounts} />;
}
```

### ✅ After (CSR - CEPAT):
```tsx
// src/app/(main)/dashboard/owners/owners/page.tsx
"use client"; // ← PENTING!

import { Suspense } from "react";
import { OwnerTable } from "../_components/owner-table";
import { OwnerTableSkeleton } from "../_components/owner-table-skeleton";

export default function OwnersListPage() {
  return (
    <Suspense fallback={<OwnerTableSkeleton />}>
      <OwnerTable />
    </Suspense>
  );
}
```

**Drastis lebih simple! Dan lebih cepat!** ✨

---

## 2️⃣ UPDATE OWNER-TABLE.TSX (Child Component)

### ✅ Implementasi dengan React Query:
```tsx
// src/app/(main)/dashboard/owners/_components/owner-table.tsx
"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiCall } from "@/lib/api-client"; // Helper yang sudah dibuat

interface Owner {
  id: number;
  name: string;
  email: string;
  phone: string;
  _count?: { pets?: number };
  petCount?: number;
}

interface OwnersResponse {
  items: Owner[];
  total: number;
  page: number;
  pageSize: number;
}

export function OwnerTable() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  
  const { data, isLoading, error } = useQuery<OwnersResponse>({
    queryKey: ['owners', page, pageSize],
    queryFn: () => apiCall<OwnersResponse>(
      `/api/owners?page=${page}&pageSize=${pageSize}`
    ),
    staleTime: 30000, // 30 seconds - data dianggap fresh
    gcTime: 5 * 60 * 1000, // 5 minutes - keep in cache
  });
  
  // Loading state
  if (isLoading) {
    return <OwnerTableSkeleton />;
  }
  
  // Error state
  if (error) {
    return (
      <div className="p-4 text-red-500">
        Error loading owners: {error.message}
      </div>
    );
  }
  
  // Map data dengan petCount
  const itemsWithCounts = (data?.items ?? []).map((it) => ({
    ...it,
    petCount: it._count?.pets ?? 0,
  }));
  
  // Render table (gunakan logic yang sudah ada)
  return (
    <div>
      <table>
        {/* ... existing table code ... */}
      </table>
      
      {/* Pagination */}
      <div className="flex gap-2">
        <button 
          onClick={() => setPage(p => Math.max(1, p - 1))}
          disabled={page === 1}
        >
          Previous
        </button>
        <span>Page {page}</span>
        <button 
          onClick={() => setPage(p => p + 1)}
          disabled={!data || data.items.length < pageSize}
        >
          Next
        </button>
      </div>
    </div>
  );
}
```

---

## 3️⃣ CREATE SKELETON COMPONENT (Loading State)

### ✅ New File:
```tsx
// src/app/(main)/dashboard/owners/_components/owner-table-skeleton.tsx
export function OwnerTableSkeleton() {
  return (
    <div className="space-y-4">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="h-8 w-48 bg-gray-200 animate-pulse rounded" />
        <div className="h-10 w-32 bg-gray-200 animate-pulse rounded" />
      </div>
      
      {/* Table skeleton */}
      <div className="border rounded-lg">
        {/* Table header */}
        <div className="grid grid-cols-4 gap-4 p-4 border-b bg-gray-50">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-4 bg-gray-200 animate-pulse rounded" />
          ))}
        </div>
        
        {/* Table rows */}
        {[...Array(5)].map((_, rowIndex) => (
          <div key={rowIndex} className="grid grid-cols-4 gap-4 p-4 border-b">
            {[...Array(4)].map((_, colIndex) => (
              <div 
                key={colIndex} 
                className="h-4 bg-gray-100 animate-pulse rounded" 
              />
            ))}
          </div>
        ))}
      </div>
      
      {/* Pagination skeleton */}
      <div className="flex items-center justify-between">
        <div className="h-4 w-32 bg-gray-200 animate-pulse rounded" />
        <div className="flex gap-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-8 w-8 bg-gray-200 animate-pulse rounded" />
          ))}
        </div>
      </div>
    </div>
  );
}
```

---

## 4️⃣ SETUP REACT QUERY PROVIDER (Jika Belum Ada)

### Check: `src/app/layout.tsx`

Pastikan ada QueryClientProvider:

```tsx
// src/app/layout.tsx
"use client";

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState } from 'react';

export default function RootLayout({ children }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000, // 1 minute default
        retry: 2,
      },
    },
  }));
  
  return (
    <html lang="en">
      <body>
        <QueryClientProvider client={queryClient}>
          {children}
          <ReactQueryDevtools initialIsOpen={false} />
        </QueryClientProvider>
      </body>
    </html>
  );
}
```

⚠️ **CATATAN:** Layout utama sudah ada server component, jadi buat provider terpisah:

```tsx
// src/providers/query-provider.tsx
"use client";

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode, useState } from 'react';

export function QueryProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30000,
        retry: 2,
      },
    },
  }));
  
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
```

Lalu wrap di root layout:
```tsx
// src/app/layout.tsx
import { QueryProvider } from "@/providers/query-provider";

export default async function RootLayout({ children }) {
  // ... existing code ...
  
  return (
    <html lang="en">
      <body>
        <QueryProvider>
          <PreferencesStoreProvider themeMode={themeMode} themePreset={themePreset}>
            {children}
            <Toaster />
          </PreferencesStoreProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
```

---

## 5️⃣ TESTING

### Test Checklist:
- [ ] Page load instant (skeleton muncul)
- [ ] Data fetch di background
- [ ] Loading state smooth
- [ ] Error handling works
- [ ] Pagination works
- [ ] Cache works (navigate away & back = instant)

---

## 📋 APPLY TO OTHER PAGES

Ulangi pattern yang sama untuk:

### Priority Order:
1. ✅ Owners/Owners (contoh di atas)
2. Bookings/Bookings
3. Services/Services
4. Products/Products
5. Medical Records
6. Payments
7. Reports (optional, bisa tetap SSR)

### Quick Conversion Checklist per Page:
1. [ ] Add `"use client"` di page.tsx
2. [ ] Remove `headers()` dan `cookies()` import
3. [ ] Create skeleton component
4. [ ] Move data fetching ke component dengan useQuery
5. [ ] Test & verify

**Estimasi:** 30 menit per page × 6 pages = **3 jam total**

---

## 🎯 EXPECTED RESULTS

### Before (SSR):
- ⏱️ Time to First Byte: 2-3s (server render)
- ⏱️ Time to Interactive: 3-5s
- 👤 User sees: White screen → Full page

### After (CSR):
- ⚡ Time to First Byte: <100ms (HTML skeleton)
- ⚡ Time to Interactive: <1s
- 👤 User sees: Skeleton → Data loads progressively

**Improvement: 70-80% faster perceived performance!** 🚀

---

## 📝 FILES TO CREATE/MODIFY

### New Files:
1. `src/lib/api-client.ts` ✅ (already created)
2. `src/providers/query-provider.tsx` (create this)
3. `src/app/(main)/dashboard/owners/_components/owner-table-skeleton.tsx`
4. Similar skeletons for other pages...

### Modified Files:
1. `src/app/(main)/dashboard/owners/owners/page.tsx`
2. `src/app/(main)/dashboard/owners/_components/owner-table.tsx`
3. `src/app/layout.tsx` (add QueryProvider)
4. Repeat for other pages...

---

**Start with Owners page, test, then replicate!** 🎯

