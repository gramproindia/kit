/*
 * DateTimePicker in a real browser, through the documented example on the
 * date-pickers tab: picking a day, stepping and typing the time, typed entry,
 * and an axe pass with the time row open.
 */
import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { openTab } from "./helpers";

const card = (page: Page) =>
  page.locator("section", { has: page.getByRole("heading", { name: "Date and time" }) }).last();

async function openMeeting(page: Page) {
  await openTab(page, "dates");
  await card(page).getByRole("button", { name: "Open calendar" }).first().click();
  const popover = page.locator(".dp-popover");
  await expect(popover).toBeVisible();
  return popover;
}

test("a picked day takes the default time, and the minute steps by minuteStep", async ({ page }) => {
  const popover = await openMeeting(page);
  const enabled = popover.locator(".dp-day:not([disabled]):not([data-outside])");
  // The example's window can begin on a blocked weekend; look one month on if so.
  if ((await enabled.count()) === 0) await popover.getByRole("button", { name: "Next month" }).click();
  await enabled.first().click();

  // Still open: the time usually comes next.
  await expect(popover).toBeVisible();
  const meeting = card(page).getByRole("textbox", { name: "Meeting" });
  await expect(meeting).toHaveValue(/9:00\s*AM/);

  const minutes = popover.getByRole("spinbutton", { name: "Minutes" });
  await minutes.focus();
  await page.keyboard.press("ArrowUp");
  await expect(minutes).toHaveAttribute("aria-valuenow", "15");
  await expect(meeting).toHaveValue(/9:15\s*AM/);

  const hours = popover.getByRole("spinbutton", { name: "Hours" });
  await hours.focus();
  await page.keyboard.type("11");
  await page.keyboard.press("Enter");
  // Enter is "done": the calendar closes.
  await expect(popover).toBeHidden();
  await expect(meeting).toHaveValue(/11:15\s*AM/);
});

test("the AM/PM switch moves the time by twelve hours", async ({ page }) => {
  const popover = await openMeeting(page);
  const enabled = popover.locator(".dp-day:not([disabled]):not([data-outside])");
  if ((await enabled.count()) === 0) await popover.getByRole("button", { name: "Next month" }).click();
  await enabled.first().click();
  await popover.getByRole("button", { name: /AM or PM/ }).click();
  await expect(card(page).getByRole("textbox", { name: "Meeting" })).toHaveValue(/9:00\s*PM/);
});

test("typed entry reads a date and time, and posts the datetime-local shape", async ({ page }) => {
  await openTab(page, "dates");
  const logged = card(page).getByRole("textbox", { name: /Logged at/ });
  await logged.fill("2026-03-15 08:45:30");
  await logged.blur();
  await expect(logged).toHaveValue("Mar 15, 2026, 08:45:30");
  await expect(card(page).locator("code")).toHaveText("2026-03-15T08:45:30");

  // Something that is not a date and time is refused on blur, and the value stays.
  await logged.fill("tomorrow-ish");
  await logged.blur();
  await expect(card(page).getByRole("alert")).toHaveText("Enter a valid date");
  await expect(card(page).locator("code")).toHaveText("2026-03-15T08:45:30");
});

test("has no axe violations with the time row open", async ({ page }) => {
  await openMeeting(page);
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();
  expect(results.violations.map((violation) => violation.id)).toEqual([]);
});
