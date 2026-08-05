import Link from "next/link";

export const metadata = { title: "Attribution - Plotato", description: "Plotato data and attribution information." };

export default function AttributionPage() {
  return <main className="info-page"><p className="eyebrow">Credits & attribution</p><h1>The watch guide credits.</h1><p>Plotato uses TMDb for movie and TV metadata, posters, ratings, and watch-provider links. Watch-provider availability data is supplied through JustWatch.</p><h2>Important</h2><p>Plotato is not endorsed or certified by TMDb, JustWatch, Netflix, Prime Video, JioHotstar, or any other provider. Provider names are shown as text and links open the relevant provider or TMDb watch page.</p><h2>Licensing review required</h2><p>Confirm TMDb API, image, provider-data, attribution, commercial-use, and regional licensing requirements before launch. This page does not grant permission to use third-party marks or artwork.</p><Link className="back-to-scan" href="/">Back to Plotato</Link></main>;
}
