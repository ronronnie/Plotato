"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { logClientError } from "@/lib/client/error-reporting";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    logClientError("app_error", error);
  }, [error]);

  return (
    <main className="system-state-page">
      <p className="eyebrow">Tiny plot twist</p>
      <h1>Plotato lost the plot.</h1>
      <p>Something went sideways. Your local preferences are still safe.</p>
      <Button onClick={reset} variant="primary">Try again</Button>
    </main>
  );
}
