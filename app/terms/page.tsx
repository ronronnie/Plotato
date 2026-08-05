import Link from "next/link";

export const metadata = { title: "Terms - Plotato", description: "Plotato MVP terms placeholder." };

export default function TermsPage() {
  return <main className="info-page"><p className="eyebrow">Plotato terms</p><h1>Fresh picks, placeholder terms.</h1><p>This is a temporary MVP terms page, not a contract and not legal advice.</p><h2>Use of the service</h2><p>Plotato offers entertainment suggestions for personal use. Recommendations may be incomplete, unavailable, inaccurate, or unsuitable for a particular viewer. Check ratings and provider details before watching.</p><h2>Third-party content</h2><p>Titles, images, availability, and links belong to their respective providers. Plotato does not grant rights to third-party content.</p><h2>Review required</h2><p>Legal counsel should replace this placeholder before public launch, including warranty, liability, acceptable-use, age, jurisdiction, and third-party licensing language.</p><Link className="back-to-scan" href="/">Back to Plotato</Link></main>;
}
