/*
 * Load every demo once, one at a time, before the parallel tests start.
 *
 * The demos are lazy chunks that Vite compiles on first request. When six
 * workers hit a cold dev server at the same moment, the first page of each
 * stalls for about a minute; after that every load takes a second or two.
 * One sequential pass — about twenty seconds — pays that cost up front, so a
 * test fails because of the page, never because of the order it ran in.
 */
import { chromium, type FullConfig } from "@playwright/test";
import { TABS } from "./helpers";

export default async function warmUp(config: FullConfig) {
  const baseURL = config.projects[0]?.use.baseURL;
  if (!baseURL) return;

  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    await page.goto(baseURL);
    for (const label of Object.values(TABS)) {
      await page.getByRole("tab", { name: label }).click();
      await page
        .locator("[role='tabpanel']:not([hidden]) .v2-skeleton")
        .waitFor({ state: "detached", timeout: 120_000 });
    }
    // The fixture pages are separate entries, compiled on their own first request.
    for (const path of ["/surface.html", "/webmcp.html"]) await page.goto(new URL(path, baseURL).href);
  } finally {
    await browser.close();
  }
}
