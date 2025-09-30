"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";

const Schema = z.object({
  name: z.string().min(2),
  phone: z.string().min(5),
  // allow empty string or valid email; will be removed from payload if empty
  email: z.union([z.string().email(), z.literal("")]).optional(),
  address: z.string().min(5),
});

type Owner = { id: number; name: string; phone?: string | null; email?: string | null; address?: string };

export function NewOwnerInline({
  onCreated,
  stacked = false,
  submitLabel = "Simpan",
}: {
  onCreated?: (owner?: Owner) => void;
  stacked?: boolean;
  submitLabel?: string;
}) {
  const form = useForm<z.infer<typeof Schema>>({
    resolver: zodResolver(Schema),
    defaultValues: { name: "", phone: "", email: "", address: "" },
  });

  async function onSubmit(values: z.infer<typeof Schema>) {
    const payload = { ...values } as Record<string, unknown>;
    if (!payload.email) delete payload.email;
    const res = await fetch("/api/owners", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      toast.error("Gagal membuat owner");
      return;
    }
    toast.success("Owner dibuat");
    const created = (await res.json().catch(() => null)) as Owner | null;
    form.reset();
    onCreated?.(created ?? undefined);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className={stacked ? "grid gap-3" : "grid gap-3 md:grid-cols-5"}>
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="Owner name" autoFocus {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Phone</FormLabel>
              <FormControl>
                <Input placeholder="0812xxxx" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input placeholder="owner@email.com" type="email" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Address</FormLabel>
              <FormControl>
                <Input placeholder="Address" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className={stacked ? "flex justify-end" : "flex items-end"}>
          <Button type="submit" className={stacked ? undefined : "w-full"}>
            {submitLabel}
          </Button>
        </div>
      </form>
    </Form>
  );
}
