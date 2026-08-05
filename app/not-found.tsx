import Link from "next/link";

export default function NotFound() {
  return (
    <main className="system-state-page">
      <p className="eyebrow">404 · Wrong table</p>
      <h1>That page is off the menu.</h1>
      <p>Head back to Plotato and pick a fresh food-to-watch pairing.</p>
      <Link className="ui-button ui-button-primary ui-button-lg" href="/">Back home</Link>
    </main>
  );
}
