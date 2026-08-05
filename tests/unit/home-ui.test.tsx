import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { HomeScreen, stateCopy } from "@/components/home/HomeScreen";
import { LoadingIndicator } from "@/components/ui/LoadingIndicator";

describe("home UI foundation", () => {
  it("renders the mobile-first home entry points", () => {
    const html = renderToStaticMarkup(<HomeScreen />);

    expect(html).toContain("Plotato");
    expect(html).toContain("What are we eating today?");
    expect(html).toContain("Scan my food");
    expect(html).toContain("Upload a photo");
    expect(html).toContain("Type the food instead");
    expect(html).toContain("Recent pairings");
  });

  it("renders first-run preferences by default for server markup", () => {
    const html = renderToStaticMarkup(<HomeScreen />);

    expect(html).toContain("Set the table.");
    expect(html).toContain("Region");
    expect(html).toContain("JioHotstar");
    expect(html).toContain("Skip for now");
  });

  it("defines clear copy for core UI states", () => {
    expect(stateCopy.idle.title).toContain("Plotato");
    expect(stateCopy["upload-ready"].body).toContain("Safety checks");
    expect(stateCopy.typing.body).toContain("camera permissions");
    expect(stateCopy.loading.title).toContain("Slot machine");
  });

  it("supports reduced-motion loading markup", () => {
    const html = renderToStaticMarkup(<LoadingIndicator reducedMotion />);

    expect(html).toContain("loading-indicator-static");
    expect(html).toContain("TASTE");
    expect(html).toContain("COZY");
    expect(html).toContain("22 MIN");
  });
});
