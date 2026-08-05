import { LoadingIndicator } from "@/components/ui/LoadingIndicator";

export default function Loading() {
  return (
    <main className="system-state-page" aria-live="polite">
      <LoadingIndicator reducedMotion={false} />
      <p>Setting the table...</p>
    </main>
  );
}
