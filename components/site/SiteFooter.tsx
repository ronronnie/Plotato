import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <span>Plotato · one watch pick before the food gets cold.</span>
      <nav aria-label="Site information">
        <Link href="/privacy">Privacy</Link>
        <Link href="/terms">Terms</Link>
        <Link href="/attribution">Attribution</Link>
      </nav>
    </footer>
  );
}
