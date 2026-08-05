import { expect, test } from "@playwright/test";
import path from "node:path";

test("uploads a valid food image fixture", async ({ page }) => {
  await page.goto("/scan", { waitUntil: "networkidle" });

  await page.locator('input[type="file"]').setInputFiles(path.join(process.cwd(), "public", "og.png"));

  await expect(page.getByRole("img", { name: "Captured food preview" })).toBeVisible();
  await page.getByRole("button", { name: "Use this photo" }).click();

  await expect(page.getByText("Mock analysis ready")).toBeVisible();
  await expect(page.getByText("mock food plate")).toBeVisible();
});

test("rejects an invalid file", async ({ page }) => {
  await page.goto("/scan", { waitUntil: "networkidle" });

  await page.locator('input[type="file"]').setInputFiles(path.join(process.cwd(), "tests", "fixtures", "not-an-image.txt"));

  await expect(page.getByRole("heading", { name: "That file format is not supported." })).toBeVisible();
  await expect(page.getByText("Use a JPEG, PNG or WebP food image.")).toBeVisible();
});

test("shows permission-denied fallback", async ({ page }) => {
  await page.goto("/scan?camera=denied", { waitUntil: "networkidle" });

  await expect(page.getByRole("heading", { name: "Camera permission was denied." })).toBeVisible();
  await expect(page.getByText("You can still upload a food photo or type what you are eating.")).toBeVisible();
});

test("supports typed-food fallback", async ({ page }) => {
  await page.goto("/scan", { waitUntil: "networkidle" });

  await page.getByLabel("Food name").fill("masala dosa");
  await page.getByRole("button", { name: "Analyze" }).click();

  await expect(page.getByText("Mock analysis ready")).toBeVisible();
  await expect(page.getByRole("heading", { name: "masala dosa" })).toBeVisible();
});
