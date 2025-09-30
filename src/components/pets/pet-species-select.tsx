"use client";

import * as React from "react";

import { Check, ChevronsUpDown, Plus, Settings } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

type Species = { id: number; name: string; isActive?: boolean; sortOrder?: number };

export function PetSpeciesSelect({
  value,
  onChange,
  allowManage = false,
  placeholder = "Pilih jenis",
}: {
  value?: string;
  onChange?: (val: string) => void;
  allowManage?: boolean;
  placeholder?: string;
}) {
  const [open, setOpen] = React.useState(false);
  const [manageOpen, setManageOpen] = React.useState(false);
  const [items, setItems] = React.useState<Species[]>([]);
  const [loading, setLoading] = React.useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/settings/pet-species", { cache: "no-store" });
      const data = await res.json().catch(() => []);
      setItems(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => {
    void load();
  }, []);

  return (
    <div className="flex w-full items-center gap-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" role="combobox" className="w-full justify-between">
            {value ?? placeholder}
            <ChevronsUpDown className="ml-2 size-4 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
          <Command>
            <CommandInput placeholder="Cari jenis..." />
            <CommandList>
              <CommandEmpty>Tidak ditemukan.</CommandEmpty>
              <CommandGroup>
                {items.map((it) => (
                  <CommandItem
                    key={it.id}
                    value={it.name}
                    onSelect={() => {
                      onChange?.(it.name);
                      setOpen(false);
                    }}
                  >
                    <Check className={`mr-2 size-4 ${value === it.name ? "opacity-100" : "opacity-0"}`} />
                    {it.name}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {allowManage ? (
        <Button type="button" variant="outline" size="icon" onClick={() => setManageOpen(true)}>
          <Settings className="size-4" />
        </Button>
      ) : null}

      <Dialog open={manageOpen} onOpenChange={setManageOpen}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>Kelola Jenis</DialogTitle>
          </DialogHeader>
          <SpeciesManager
            items={items}
            onChanged={() => {
              void load();
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SpeciesManager({ items, onChanged }: { items: Species[]; onChanged?: () => void }) {
  const [list, setList] = React.useState<Species[]>(items);
  const [creating, setCreating] = React.useState(false);
  const [newName, setNewName] = React.useState("");

  React.useEffect(() => setList(items), [items]);

  async function create() {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      await fetch("/api/settings/pet-species", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim() }),
      });
      setNewName("");
      onChanged?.();
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="grid gap-3">
      <div className="grid grid-cols-1 gap-2">
        {list.map((it) => (
          <div key={it.id} className="flex items-center justify-between gap-2">
            <div className="text-sm">{it.name}</div>
            <div className="flex items-center gap-2">{/* Future: edit / delete */}</div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-2">
        <Label className="text-sm">Tambah Jenis</Label>
        <div className="flex items-center gap-2">
          <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Contoh: Anjing" />
          <Button type="button" onClick={create} disabled={creating || !newName.trim()}>
            <Plus className="mr-2 size-4" /> Tambah
          </Button>
        </div>
      </div>
    </div>
  );
}
