"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";

const Schema = z.object({ name: z.string().min(2), phone: z.string().min(5), address: z.string().min(5) });

export function NewOwnerInline({ onCreated }: { onCreated?: () => void }) {
  const form = useForm<z.infer<typeof Schema>>({
    resolver: zodResolver(Schema),
    defaultValues: { name: "", phone: "", address: "" },
  });

  async function onSubmit(values: z.infer<typeof Schema>) {
    const res = await fetch("/api/owners", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    if (!res.ok) {
      toast.error("Gagal membuat owner");
      return;
    }
    toast.success("Owner dibuat");
    form.reset();
    onCreated?.();
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-3 md:grid-cols-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="Owner name" {...field} />
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
        <div className="flex items-end">
          <Button type="submit" className="w-full">
            Create
          </Button>
        </div>
      </form>
    </Form>
  );
}
