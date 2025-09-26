"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";

export function BackButton({
  fallbackHref = "/dashboard/owners",
  label = "Kembali",
}: {
  fallbackHref?: string;
  label?: string;
}) {
  const onClick = React.useCallback(() => {
    if (typeof window !== "undefined") {
      if (window.history.length > 1) {
        window.history.back();
        return;
      }
      window.location.href = fallbackHref;
    }
  }, [fallbackHref]);

  return (
    <Button variant="outline" onClick={onClick}>
      {label}
    </Button>
  );
}
