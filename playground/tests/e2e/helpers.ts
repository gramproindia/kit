import { expect, type Page } from "@playwright/test";

/** The demo app's tabs, by their visible label. */
export const TABS = {
  agent: "Agent · WebMCP",
  grid: "Client · 100k rows",
  server: "Server mode",
  select: "Select & MultiSelect",
  dates: "Date pickers",
  toasts: "Toasts",
  uploads: "Uploads",
  overlays: "Modal & Dialog",
  fields: "Inputs",
  controls: "Controls",
  surfaces: "Menus & surfaces",
  formControls: "Switch, radio & number",
  display: "Alerts, badges & more",
} as const;

export async function openTab(page: Page, tab: keyof typeof TABS) {
  await page.goto("/");
  const button = page.getByRole("tab", { name: TABS[tab] });
  await button.click();
  await expect(button).toHaveAttribute("aria-selected", "true");
  // Each demo is lazy-loaded behind a skeleton. Wait for the demo itself, or a
  // test queries — and axe audits — the placeholder instead.
  // The demo's own panel: the one wrapping the demo card. Some demos (Controls)
  // contain tabs of their own, whose panels must not be mistaken for it.
  const panel = page.locator("[role='tabpanel']:not([hidden]):has(> section.v2-card)");
  await expect(panel).toHaveCount(1);
  await expect(panel.locator(".v2-skeleton")).toHaveCount(0, { timeout: 15_000 });
  await expect(panel.locator(".v2-stage > *").first()).toBeVisible();
}

/** The computed value of one CSS property, as the browser resolves it. */
export function computed(page: Page, selector: string, property: string) {
  return page.evaluate(
    ([target, name]) => {
      const element = document.querySelector(target);
      if (!element) throw new Error(`No element matches ${target}`);
      return getComputedStyle(element).getPropertyValue(name).trim();
    },
    [selector, property] as const,
  );
}

export async function setTheme(page: Page, theme: "light" | "dark") {
  await page.evaluate((value) => {
    document.documentElement.dataset.theme = value;
  }, theme);
}
