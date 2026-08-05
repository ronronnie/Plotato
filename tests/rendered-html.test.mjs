import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("http://localhost/", {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

test("server-renders the Plotato visual foundation", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>Plotato<\/title>/i);
  assert.match(html, /What are we eating today\?/);
  assert.match(html, /Scan my food/);
  assert.match(html, /Upload a photo/);
  assert.match(html, /Type the food instead/);
  assert.match(html, /Recent pairings/);
  assert.match(html, /Set the table\./);
  assert.match(html, /JioHotstar/);
  assert.doesNotMatch(html, /SnackSpin|react-loading-skeleton|codex-preview/);
});

test("keeps the scaffold componentized and tokenized", async () => {
  const [page, css, storage, tasks] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
    readFile(new URL("../lib/client/preference-storage.ts", import.meta.url), "utf8"),
    readFile(new URL("../TASKS.md", import.meta.url), "utf8"),
  ]);

  assert.match(page, /HomeScreen/);
  assert.match(css, /--color-ink:\s*#161616/i);
  assert.match(css, /--color-paper:\s*#fff7e8/i);
  assert.match(css, /prefers-reduced-motion/);
  assert.match(storage, /plotato\.preferences\.v1/);
  assert.match(tasks, /Scaffolded the mobile-first visual foundation/);
});
