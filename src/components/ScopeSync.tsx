"use client";

import { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { isScope, loadStoredScope } from "@/lib/scope";

/** Applies the stored scope choice to pages opened without ?scope=. Rendered in layout. */
export default function ScopeSync() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  useEffect(() => {
    if (!isScope(params.get("scope"))) {
      const stored = loadStoredScope();
      if (stored) {
        const next = new URLSearchParams(params.toString());
        next.set("scope", stored);
        router.replace(`${pathname}?${next.toString()}`);
      }
    }
  }, [params, pathname, router]);

  return null;
}
