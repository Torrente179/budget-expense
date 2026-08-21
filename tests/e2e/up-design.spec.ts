import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

const reviewPath = "/__design/up";
const stressStates = [
  "loading",
  "empty",
  "error",
  "overspent",
  "completed goal",
  "long spanish",
  "large number",
  "negative",
  "multi currency",
] as const;
const runtimeErrorsByPage = new WeakMap<Page, string[]>();

function collectRuntimeErrors(page: Page) {
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(error.message));
  return errors;
}

async function expectNoHorizontalOverflow(page: Page) {
  const widths = await page.evaluate(() => ({
    client: document.documentElement.clientWidth,
    scroll: document.documentElement.scrollWidth,
  }));
  expect(widths.scroll).toBeLessThanOrEqual(widths.client + 1);
}

test.beforeEach(async ({ page }) => {
  runtimeErrorsByPage.set(page, collectRuntimeErrors(page));
  await page.goto(reviewPath);
  await expect(page).toHaveTitle(/UP Design Review/);
  await expect(
    page.getByRole("heading", {
      name: "UP-derived approval checkpoint",
      exact: true,
    })
  ).toBeVisible();
});

test("@visual populated approval checkpoint", async ({ page }) => {
  await expectNoHorizontalOverflow(page);
  await expect(page).toHaveScreenshot("up-approval-checkpoint.png", {
    animations: "disabled",
    fullPage: false,
    mask: [page.locator("nextjs-portal")],
  });
  expect(runtimeErrorsByPage.get(page)).toEqual([]);
});

test("@a11y populated checkpoint is axe-clean", async ({ page }) => {
  const results = await new AxeBuilder({ page })
    .exclude("nextjs-portal")
    .analyze();
  const violationSummary = results.violations.flatMap((violation) =>
    violation.nodes.map((node) =>
      [
        violation.id,
        node.target.join(" "),
        node.failureSummary?.replace(/\s+/g, " "),
      ].join(" | ")
    )
  );
  expect(
    violationSummary,
    violationSummary.join("\n")
  ).toEqual([]);
});

test("all deterministic stress states remain reachable and stable", async ({
  page,
}, testInfo) => {
  for (const state of stressStates) {
    const control = page.getByRole("button", { name: state, exact: true });
    await control.click();
    await expect(control).toHaveClass(/bg-coral/);
    await expectNoHorizontalOverflow(page);

    if (state === "long spanish") {
      await expect(
        page.getByRole("heading", { name: "Inicio", exact: true })
      ).toBeVisible();
    }
    if (state === "large number") {
      await expect(page.getByText("€987,654,321.09").first()).toBeVisible();
    }
    if (state === "negative") {
      await expect(page.getByText("-€1,284.57").first()).toBeVisible();
    }
  }

  if (testInfo.project.name.includes("phone")) {
    const shortTargets = await page.evaluate(() =>
      [...document.querySelectorAll<HTMLElement>(
        "a[href],button:not([disabled]),input:not([type='hidden']),select,textarea,[role='button'],[role='tab']"
      )]
        .filter((element) => {
          const rect = element.getBoundingClientRect();
          const style = getComputedStyle(element);
          return (
            element.tabIndex >= 0 &&
            element.getAttribute("aria-hidden") !== "true" &&
            rect.width > 1 &&
            rect.height > 1 &&
            style.display !== "none" &&
            style.visibility !== "hidden"
          );
        })
        .map((element) => {
          const rect = element.getBoundingClientRect();
          return {
            name:
              element.getAttribute("aria-label") ??
              element.textContent?.trim().replace(/\s+/g, " ").slice(0, 80),
            width: Math.round(rect.width),
            height: Math.round(rect.height),
          };
        })
        .filter((target) => target.width < 44 || target.height < 44)
    );
    expect(shortTargets).toEqual([]);
  }

  expect(runtimeErrorsByPage.get(page)).toEqual([]);
});

test.describe("normal motion", () => {
  test.use({ contextOptions: { reducedMotion: "no-preference" } });

  test("context sheet settles within the documented motion ceiling", async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== "reference-phone");
    await page.getByRole("button", { name: "Open transaction" }).click();
    await expect(page.getByRole("dialog")).toBeVisible();

    const durations = await page.evaluate(() =>
      document
        .getAnimations()
        .map((animation) => Number(animation.effect?.getTiming().duration ?? 0))
        .filter(Number.isFinite)
    );
    expect(durations.every((duration) => duration <= 650)).toBe(true);
  });
});
