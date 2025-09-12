"use client";
import { Button } from "@/components/ui/button";

export function PrintButton() {
  return (
    <Button
      variant="secondary"
      onClick={() => {
        if (typeof window !== "undefined") window.print();
      }}
    >
      Unduh PDF
    </Button>
  );
}
