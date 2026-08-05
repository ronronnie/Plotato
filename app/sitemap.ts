import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3100";
  return ["/", "/scan", "/privacy", "/terms", "/attribution"].map((path) => ({ url: `${baseUrl}${path}`, changeFrequency: "monthly", priority: path === "/" ? 1 : 0.5 }));
}
