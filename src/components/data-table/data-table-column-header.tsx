import * as React from "react";

import { Column } from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ChevronsUpDown, EyeOff } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface DataTableColumnHeaderProps<TData, TValue> extends React.HTMLAttributes<HTMLDivElement> {
  column: Column<TData, TValue>;
  title: string;
}

function getSortIcon(sort: "asc" | "desc" | false | undefined) {
  switch (sort) {
    case "desc":
      return <ArrowDown />;
    case "asc":
      return <ArrowUp />;
    default:
      return <ChevronsUpDown />;
  }
}

export function DataTableColumnHeader<TData, TValue>({
  column,
  title,
  className,
}: DataTableColumnHeaderProps<TData, TValue>) {
  const [search, setSearch] = React.useState("");
  const [open, setOpen] = React.useState(false);
  const [pending, setPending] = React.useState<string[]>(() =>
    Array.isArray(column.getFilterValue?.()) ? (column.getFilterValue() as string[]) : [],
  );
  const uniqueMap = React.useMemo(() => {
    if (!open) return new Map<any, number>();
    const fn = (column as any)?.getFacetedUniqueValues as (() => Map<any, number>) | undefined;
    try {
      return fn?.() ?? new Map<any, number>();
    } catch {
      return new Map<any, number>();
    }
  }, [column, open]);
  const options = React.useMemo(() => {
    if (!open) return [] as string[];
    const all = Array.from(uniqueMap.keys()).map((v) => String(v ?? ""));
    const q = search.toLowerCase();
    return (q ? all.filter((v) => v.toLowerCase().includes(q)) : all).slice(0, 200);
  }, [uniqueMap, search, open]);

  if (!column.getCanSort()) {
    return <div className={cn(className)}>{title}</div>;
  }
  return (
    <div className={cn("flex items-center space-x-2", className)}>
      <DropdownMenu onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="data-[state=open]:bg-accent -ml-3 h-8">
            <span>{title}</span>
            {getSortIcon(column.getIsSorted())}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-64 p-0">
          <DropdownMenuItem onClick={() => column.toggleSorting(false)}>
            <ArrowUp className="text-muted-foreground/70 h-3.5 w-3.5" />
            Asc
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => column.toggleSorting(true)}>
            <ArrowDown className="text-muted-foreground/70 h-3.5 w-3.5" />
            Desc
          </DropdownMenuItem>
          {column.columnDef.enableHiding !== false && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => column.toggleVisibility(false)}>
                <EyeOff className="text-muted-foreground/70 h-3.5 w-3.5" />
                Hide
              </DropdownMenuItem>
            </>
          )}
          <DropdownMenuSeparator />
          <div className="p-2">
            <input
              className="w-full rounded-md border px-2 py-1 text-xs"
              placeholder="Cari nilai kolom…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="max-h-56 overflow-auto px-2 pb-2">
            {options.map((opt) => (
              <label key={opt} className="flex items-center gap-2 py-1 text-xs">
                <input
                  type="checkbox"
                  checked={pending.includes(opt)}
                  onChange={(e) =>
                    setPending((prev) => (e.target.checked ? [...prev, opt] : prev.filter((x) => x !== opt)))
                  }
                />
                <span className="truncate">{opt || "(kosong)"}</span>
                <span className="text-muted-foreground ml-auto">{uniqueMap.get(opt) ?? 0}</span>
              </label>
            ))}
            {!options.length ? (
              <div className="text-muted-foreground py-2 text-center text-xs">Tidak ada opsi</div>
            ) : null}
          </div>
          <div className="flex gap-2 border-t p-2">
            <button className="rounded-md border px-2 py-1 text-xs" onClick={() => column.setFilterValue(pending)}>
              Apply
            </button>
            <button
              className="rounded-md border px-2 py-1 text-xs"
              onClick={() => {
                setPending([]);
                column.setFilterValue(undefined);
              }}
            >
              Clear
            </button>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
