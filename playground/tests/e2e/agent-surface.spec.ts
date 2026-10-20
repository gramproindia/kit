/*
 * <AgentSurface> in a real browser, driving real components.
 *
 * The page installs a stand-in for WebMCP and every operable component inside
 * one surface, each controlled by the page's own state. Each test calls the
 * `operate_page` tool as an agent would and then reads `#state`: a write
 * counts only when it reached the application's handler. A refusal counts
 * only when nothing changed.
 */
/* eslint-disable @typescript-eslint/no-explicit-any -- the tool payloads are untyped JSON, read field by field */
import { expect, test, type Page } from "@playwright/test";

type Result = { isError: boolean; structuredContent: Record<string, any>; content: { text: string }[] };

const call = (page: Page, input: unknown) =>
  page.evaluate(
    (args) => (window as any).__tools.operate_page.execute(args) as Promise<Result>,
    input as never,
  );

const operate = (page: Page, target: string, ...intents: unknown[]) =>
  call(page, { action: "operate", target, intents });

const state = async (page: Page) => JSON.parse((await page.locator("#state").textContent()) ?? "{}");

test.beforeEach(async ({ page }) => {
  await page.goto("/surface.html");
  await expect(page.locator("#has-surface")).toHaveText("yes");
  // The grid's agent loads lazily; wait until it has joined.
  await expect
    .poll(async () => (await call(page, { action: "describe" })).structuredContent.manifest.members.length)
    .toBe(11);
});

test("describes every operable component, and never the password", async ({ page }) => {
  const described = await call(page, { action: "describe" });
  const members = described.structuredContent.manifest.members as Array<Record<string, any>>;
  expect(members.map((m) => m.id).sort()).toEqual(
    ["accept-terms", "customers", "due-date", "email-alerts", "name", "notes", "plan", "seats", "tags", "team", "trip"],
  );
  expect(members.find((m) => m.label === "Password")).toBeUndefined();

  const due = members.find((m) => m.id === "due-date")!;
  expect(due.constraints).toMatchObject({ holds: "date", min: "2026-01-01", max: "2026-12-31" });
  const team = members.find((m) => m.id === "team")!;
  expect(team.constraints.options).toContainEqual({ value: "3", label: "Legal", disabled: true });
  const grid = members.find((m) => m.id === "customers")!;
  expect(grid.kind).toBe("grid");
  expect(grid.columns.map((c: { id: string }) => c.id)).toContain("region");
});

test("writes text, booleans and numbers through to the application", async ({ page }) => {
  expect((await operate(page, "name", { action: "setValue", value: "Ada Lovelace" })).isError).toBe(false);
  expect((await operate(page, "notes", { action: "setValue", value: "Call back Monday" })).isError).toBe(false);
  expect((await operate(page, "accept-terms", { action: "setValue", value: true })).isError).toBe(false);
  expect((await operate(page, "email-alerts", { action: "setValue", value: true })).isError).toBe(false);
  // A German field: written as a number, so 1500 is not misread as 1.5.
  expect((await operate(page, "seats", { action: "setValue", value: 1500 })).isError).toBe(false);

  await expect.poll(() => state(page)).toMatchObject({
    name: "Ada Lovelace",
    notes: "Call back Monday",
    terms: true,
    alerts: true,
    seats: 1500,
  });
});

test("chooses from radios, selects and multi-selects by their real values", async ({ page }) => {
  expect((await operate(page, "plan", { action: "setValue", value: "Pro" })).isError).toBe(false);
  // The option's value is the number 2; an agent sends text and the app still gets 2.
  expect((await operate(page, "team", { action: "setValue", value: "2" })).isError).toBe(false);
  expect((await operate(page, "tags", { action: "setValue", value: ["bug", "billing"] })).isError).toBe(false);

  await expect.poll(() => state(page)).toMatchObject({ plan: "Pro", team: 2, tags: ["bug", "billing"] });
});

test("sets a date and a range", async ({ page }) => {
  expect((await operate(page, "due-date", { action: "setValue", value: "2026-03-15" })).isError).toBe(false);
  expect(
    (await operate(page, "trip", { action: "setValue", value: { start: "2026-05-01", end: "2026-05-09" } })).isError,
  ).toBe(false);

  await expect.poll(() => state(page)).toMatchObject({
    due: "2026-03-15",
    trip: { start: "2026-05-01", end: "2026-05-09" },
  });
});

test("refuses what a component would refuse, and changes nothing", async ({ page }) => {
  const before = await state(page);

  const disabled = await operate(page, "team", { action: "setValue", value: "3" });
  expect(disabled.structuredContent).toMatchObject({ ok: false, code: "option-disabled" });

  const outOfRange = await operate(page, "due-date", { action: "setValue", value: "2027-01-10" });
  expect(outOfRange.structuredContent.ok).toBe(false);

  const tooMany = await operate(page, "tags", { action: "setValue", value: ["bug", "billing", "urgent"] });
  expect(tooMany.structuredContent.ok).toBe(false);

  const tooLong = await operate(page, "name", { action: "setValue", value: "x".repeat(41) });
  expect(tooLong.structuredContent.ok).toBe(false);

  const nobody = await operate(page, "password", { action: "setValue", value: "hunter2" });
  expect(nobody.structuredContent).toMatchObject({ ok: false, code: "unknown-target" });

  expect(await state(page)).toEqual(before);
});

test("operates the grid through its own validator", async ({ page }) => {
  const filtered = await operate(page, "customers", {
    action: "filter",
    column: "region",
    operator: "equals",
    value: "Kerala",
  });
  expect(filtered.structuredContent).toMatchObject({ ok: true });
  expect(filtered.structuredContent.rowsShowing).toBeLessThan(filtered.structuredContent.rowsTotal);
});
