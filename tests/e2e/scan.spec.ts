import { expect, test, type Page } from "@playwright/test";
import path from "node:path";

const candidate = {
  id: 101,
  mediaType: "tv",
  title: "Butter & Joy",
  overview: "A warm, funny story.",
  genres: [35, 10751],
  originalLanguage: "en",
  runtimeMinutes: 22,
  maturityRating: "U",
  voteAverage: 7.8,
  voteCount: 400,
  popularity: 40,
  adult: false,
  posterPath: null,
  backdropPath: null,
  toneTags: ["playful", "cozy"],
  providers: [{ providerId: 8, name: "Netflix", logoPath: null, link: "https://www.netflix.com", type: "flatrate" }],
  tmdbUrl: "https://www.themoviedb.org/tv/101",
  attribution: { tmdb: "TMDb", watchProviders: "Streaming data supplied by JustWatch" },
};

function successResponse() {
  return {
    status: "success",
    recommendation: {
      primary: { candidate, matchScore: 0.91, matchTags: ["cozy", "quick bite", "streaming ready"] },
      backups: [],
      explanation: "Butter & Joy brings cozy energy in a quick watch.",
      availability: candidate.providers,
      attribution: candidate.attribution,
    },
  };
}

function analysisSuccessResponse() {
  return {
    status: "success",
    analysis: {
      contains_food: true,
      dish_name: "masala dosa",
      possible_alternatives: [],
      meal_type: "snack",
      richness: 0.6,
      spiciness: 0.7,
      comfort: 0.7,
      freshness: 0.3,
      playfulness: 0.8,
      intensity: 0.5,
      confidence: 0.9,
    },
  };
}

async function typeFood(page: Page, food = "masala dosa") {
  await page.getByLabel("Food name").fill(food);
  await page.getByRole("button", { name: "Analyze" }).click();
}

test("home typed-food match enters the recommendation journey", async ({ page }) => {
  await page.route("**/api/recommend", async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(successResponse()) });
  });
  await page.goto("/", { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Skip for now" }).click();
  await page.getByLabel("Type the food instead").fill("biryani");
  await page.getByRole("button", { name: "Match" }).click();

  await expect(page).toHaveURL(/\/scan\?food=biryani/);
  await expect(page.getByRole("heading", { name: "Butter & Joy" })).toBeVisible();
});

test("runs the mocked happy path through analysis, loading, reveal, and feedback", async ({ page }) => {
  const recommendationRequests: Array<Record<string, unknown>> = [];
  await page.route("**/api/recommend", async (route) => {
    recommendationRequests.push(route.request().postDataJSON() as Record<string, unknown>);
    await new Promise((resolve) => setTimeout(resolve, 500));
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(successResponse()) });
  });
  await page.goto("/scan", { waitUntil: "networkidle" });
  await typeFood(page);

  await expect(page.getByRole("heading", { name: "One tasty match, coming up." })).toBeVisible();
  await expect(page.getByText("No fake titles. Every pick is checked against the watch guide.")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Butter & Joy" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Watch on Netflix" })).toBeVisible();
  await expect(page.getByText("TV SERIES")).toBeVisible();
  await expect(page.getByText("Runtime unknown")).not.toBeVisible();

  await page.getByRole("button", { name: "Share" }).click();
  await expect(page.getByRole("heading", { name: "Make it a tiny premiere." })).toBeVisible();
  await page.getByRole("button", { name: /Square/ }).click();
  await expect(page.getByRole("img", { name: "Square share card preview" })).toBeVisible();
  await expect(page.getByText("Your original food photo is never included unless you opt in.")).toBeVisible();
  await page.getByRole("button", { name: "Close share dialog" }).click();

  await page.getByRole("button", { name: "Not feeling this" }).click();
  await expect(page.getByText("Already watched")).toBeVisible();
  await page.getByRole("button", { name: "Wrong mood" }).click();
  await expect.poll(() => recommendationRequests.length).toBe(2);
  const feedback = recommendationRequests[1]?.feedback as Array<{ action: string; reason?: string }>;
  expect(feedback[0]).toMatchObject({ action: "rejected", reason: "wrong-mood" });
});

test("uploads a valid food image and handles a TMDb outage", async ({ page }) => {
  await page.route("**/api/analyze-food", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(analysisSuccessResponse()) });
  });
  await page.route("**/api/recommend", async (route) => {
    await route.fulfill({ status: 422, contentType: "application/json", body: JSON.stringify({ status: "failure", failure: { code: "TMDB_OUTAGE", message: "Plotato could not reach the watch guide. Try another spin." } }) });
  });
  await page.goto("/scan", { waitUntil: "networkidle" });
  await page.locator('input[type="file"]').setInputFiles(path.join(process.cwd(), "public", "og.png"));
  await expect(page.getByRole("img", { name: "Captured food preview" })).toBeVisible();
  await page.getByRole("button", { name: "Use this photo" }).click();
  await expect(page.getByRole("heading", { name: "The watch guide is taking five." })).toBeVisible();
});

test("shows a network error and retries", async ({ page }) => {
  await page.route("**/api/recommend", (route) => route.abort());
  await page.goto("/scan", { waitUntil: "networkidle" });
  await typeFood(page, "poha");
  await expect(page.getByRole("heading", { name: "The signal took a snack break." })).toBeVisible();
  await expect(page.getByRole("button", { name: "Try again" })).toBeVisible();
});

test("shows no provider match", async ({ page }) => {
  await page.route("**/api/recommend", async (route) => {
    await route.fulfill({ status: 422, contentType: "application/json", body: JSON.stringify({ status: "failure", failure: { code: "NO_MATCHING_PROVIDER", message: "No selected service has a clean match yet. Try another provider or spin again." } }) });
  });
  await page.goto("/scan", { waitUntil: "networkidle" });
  await typeFood(page, "ramen");
  await expect(page.getByRole("heading", { name: "No clean provider match." })).toBeVisible();
});

test("shows no recommendation state", async ({ page }) => {
  await page.route("**/api/recommend", async (route) => {
    await route.fulfill({ status: 422, contentType: "application/json", body: JSON.stringify({ status: "failure", failure: { code: "NO_CANDIDATES", message: "Plotato needs a wider watchlist for this meal. Try another spin." } }) });
  });
  await page.goto("/scan", { waitUntil: "networkidle" });
  await typeFood(page, "fruit salad");
  await expect(page.getByRole("heading", { name: "This meal needs a wider watchlist." })).toBeVisible();
});

test("rejects an invalid file", async ({ page }) => {
  await page.goto("/scan", { waitUntil: "networkidle" });
  await page.locator('input[type="file"]').setInputFiles(path.join(process.cwd(), "tests", "fixtures", "not-an-image.txt"));
  await expect(page.getByRole("heading", { name: "That file format is not supported." })).toBeVisible();
});

test("shows permission-denied fallback", async ({ page }) => {
  await page.goto("/scan?camera=denied", { waitUntil: "networkidle" });
  await expect(page.getByRole("heading", { name: "Camera permission was denied." })).toBeVisible();
  await expect(page.getByText("You can still upload a food photo or type what you are eating.")).toBeVisible();
});
