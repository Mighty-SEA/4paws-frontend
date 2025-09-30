"use client";

import { useRouter } from "next/navigation";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const Schema = z.object({
  name: z.string().min(2),
  species: z.string().min(2),
  speciesOther: z.string().optional(),
  breed: z.string().min(1),
  birthdate: z.string().min(4),
});

export function AddPetForm({ ownerId }: { ownerId: number }) {
  const form = useForm<z.infer<typeof Schema>>({
    resolver: zodResolver(Schema),
    defaultValues: { name: "", species: "", speciesOther: "", breed: "", birthdate: "" },
  });
  const router = useRouter();

  async function onSubmit(values: z.infer<typeof Schema>) {
    const speciesValue =
      values.species === "Lain-lain" && values.speciesOther?.trim().length
        ? values.speciesOther.trim()
        : values.species;
    const res = await fetch(`/api/owners/${ownerId}/pets`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...values, species: speciesValue }),
    });
    if (!res.ok) {
      toast.error("Gagal menambah pet");
      return;
    }
    toast.success("Pet ditambahkan");
    form.reset();
    router.refresh();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add Pet</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Pet name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="species"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Jenis</FormLabel>
                  <FormControl>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih jenis" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Kucing">Kucing</SelectItem>
                        <SelectItem value="Anjing">Anjing</SelectItem>
                        <SelectItem value="Kelinci">Kelinci</SelectItem>
                        <SelectItem value="Lain-lain">Lain-lain</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {form.watch("species") === "Lain-lain" ? (
              <FormField
                control={form.control}
                name="speciesOther"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Jenis Lainnya</FormLabel>
                    <FormControl>
                      <Input placeholder="Masukkan jenis hewan" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ) : null}
            <FormField
              control={form.control}
              name="breed"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Breed</FormLabel>
                  <FormControl>
                    <Input placeholder="Breed" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="birthdate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Birthdate</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="md:col-span-2">
              <Button type="submit">Add</Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
