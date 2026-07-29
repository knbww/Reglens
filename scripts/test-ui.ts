/**
 * Browser test of the primary RegLens journey.
 *
 * Drives a real Chromium against a running server and clicks through the
 * product the way a person would: demo sign-in, business switching, search,
 * policy actions, planner, reminders, monitoring, comparison, the AI Analyst,
 * reports, plan selection, onboarding a new business, and sign out.
 *
 *   npm run build && npm run start        # in one terminal
 *   npm run test:ui                       # in another
 *
 * Uses `playwright-core`, which ships no browsers. Point PLAYWRIGHT_CHROMIUM at
 * a Chromium/Chrome binary, or leave it unset to auto-detect a common install.
 * The script exits cleanly with a message if no browser is available.
 */
import { existsSync } from "node:fs";
import { homedir } from "node:os";

import { chromium, type Browser, type Page } from "playwright-core";

const BASE_URL = process.env.BASE_URL ?? "http://127.0.0.1:3000";

let passed = 0;
let failed = 0;
const failures: string[] = [];
const pageErrors: string[] = [];

function check(name: string, ok: boolean, detail = "") {
  if (ok) {
    passed += 1;
    console.log(`  [32m✓[0m ${name}`);
  } else {
    failed += 1;
    failures.push(name);
    console.log(`  [31m✗[0m ${name}${detail ? ` — ${detail}` : ""}`);
  }
}

function section(title: string) {
  console.log(`\n${title}`);
}

/** Finds a Chromium/Chrome binary without downloading one. */
function findBrowser(): string | null {
  const explicit = process.env.PLAYWRIGHT_CHROMIUM;
  if (explicit) return existsSync(explicit) ? explicit : null;

  const candidates = [
    `${homedir()}/.cache/ms-playwright/chromium-1228/chrome-linux64/chrome`,
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
    "/usr/bin/google-chrome-stable",
    "/usr/bin/google-chrome",
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Chromium.app/Contents/MacOS/Chromium",
  ];
  return candidates.find((path) => existsSync(path)) ?? null;
}


/**
 * Waits for expected text rather than sleeping a fixed amount. A write against
 * a remote database can take seconds — fixed waits make the suite report
 * failures that are really just latency.
 */
async function waitForText(page: Page, text: string | RegExp, timeout = 45_000): Promise<boolean> {
  try {
    await page.getByText(text).first().waitFor({ timeout });
    return true;
  } catch {
    return false;
  }
}

async function signInAsDemo(page: Page) {
  await page.goto(`${BASE_URL}/sign-in`, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: /demo account/i }).click();
  await page.waitForURL("**/dashboard", { timeout: 30_000 });
  await page.waitForLoadState("networkidle");
}

async function switchBusiness(page: Page, from: string, to: string): Promise<boolean> {
  await page.waitForTimeout(600);
  await page.getByRole("button", { name: new RegExp(from) }).first().click();
  await page.getByRole("listbox").waitFor({ state: "visible", timeout: 15_000 });
  await page.getByRole("listbox").getByRole("button", { name: new RegExp(to) }).first().click();
  await page
    .waitForFunction((name) => document.querySelector("h1")?.textContent?.includes(name), to, {
      timeout: 30_000,
    })
    .catch(() => {});
  await page.waitForLoadState("networkidle");
  return (await page.locator("h1").first().innerText()).includes(to);
}

async function run(browser: Browser) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const page = await context.newPage();
  page.on("pageerror", (error) => pageErrors.push(String(error)));
  page.on("console", (message) => {
    if (message.type() === "error") pageErrors.push(message.text());
  });

  // ------------------------------------------------------- Authentication
  section("1. Authentication");
  await signInAsDemo(page);
  check("demo sign-in reaches the dashboard", page.url().includes("/dashboard"));
  check("dashboard shows the risk score", (await page.getByText("Policy Risk Score").count()) > 0);

  // ---------------------------------------------------- Business switching
  section("2. Demo business switching");
  check("switching to Sparc Technologies works", await switchBusiness(page, "Frostonic", "Sparc"));
  check(
    "the new business renders its own risk card",
    (await page.locator("text=/ 100 exposure/").first().innerText().catch(() => "")).length > 0,
  );
  check("switching to Ricos Boutique works", await switchBusiness(page, "Sparc", "Ricos"));

  // -------------------------------------------------------- Policy search
  section("3. Policy search");
  await page.goto(`${BASE_URL}/policies`, { waitUntil: "networkidle" });
  await page.getByLabel("Search policies").first().fill("textile");
  await page.keyboard.press("Enter");
  await page.waitForURL(/q=textile/, { timeout: 20_000 }).catch(() => {});
  await page.waitForLoadState("networkidle");
  check("keyword search returns results", (await page.locator("main h2").count()) > 0);

  await page.getByLabel("Regulatory topic").selectOption("textile_labeling");
  await page.waitForURL(/topic=textile_labeling/, { timeout: 20_000 }).catch(() => {});
  check("topic filter applies via the URL", page.url().includes("topic=textile_labeling"));

  await page.getByRole("button", { name: /Clear filters/i }).click();
  await page
    .waitForURL((url) => url.pathname === "/policies" && !url.search.includes("q="), { timeout: 20_000 })
    .catch(() => {});
  check(
    "clear filters resets the search",
    !page.url().includes("q=") && !page.url().includes("topic="),
    page.url(),
  );

  // -------------------------------------------------------- Policy detail
  section("4. Policy detail actions");
  await page.goto(`${BASE_URL}/policies/us-cpsc-flammability-1610`, { waitUntil: "networkidle" });
  check("policy detail renders", (await page.locator("h1").innerText()).includes("Flammability"));

  const saveButton = page.getByRole("button", { name: /Save policy|Saved/ });
  await saveButton.click();
  await saveButton.waitFor({ state: "visible" });
  await page.waitForFunction(
    () =>
      Array.from(document.querySelectorAll("button")).some(
        (b) => /Save policy|Saved/.test(b.textContent ?? "") && !b.hasAttribute("disabled"),
      ),
    undefined,
    { timeout: 15_000 },
  );
  check("save policy completes and re-enables", (await page.getByText(/Saved to your policy library|Removed from saved/).count()) > 0);

  await page.getByRole("button", { name: /Add to monitoring|Stop monitoring/ }).click();
  check(
    "monitoring toggle responds",
    await waitForText(page, /Added to monitoring|Removed from monitoring/),
  );

  await page.getByRole("button", { name: /Create action plan/ }).click();
  await page.waitForURL(/\/planner\?plan=/, { timeout: 30_000 });
  await page.waitForLoadState("networkidle");
  check("create action plan opens the planner", page.url().includes("/planner?plan="));

  // -------------------------------------------------------- Action planner
  section("5. Action planner");
  const checkbox = page.locator('input[type="checkbox"]').nth(1);
  const before = await checkbox.isChecked();
  await checkbox.click();
  const toggled = await page
    .waitForFunction(
      (was) =>
        (document.querySelectorAll('input[type="checkbox"]')[1] as HTMLInputElement | undefined)
          ?.checked !== was,
      before,
      { timeout: 45_000 },
    )
    .then(() => true)
    .catch(() => false);
  check("checklist item toggles and persists", toggled);

  await page.goto(`${BASE_URL}/planner?new=1`, { waitUntil: "networkidle" });
  await page.getByLabel("Title").fill("UI test task");
  await page.getByLabel("Checklist").fill("Step one\nStep two");
  await page.getByRole("button", { name: "Create task", exact: true }).click();
  check("new task appears in the planner", await waitForText(page, "UI test task"));

  // ------------------------------------------------------------ Reminders
  section("6. Reminders");
  await page.goto(`${BASE_URL}/reminders`, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: /New reminder/ }).click();
  await page.getByLabel("What is the reminder for?").fill("UI test reminder");
  await page.getByLabel("Date", { exact: true }).fill("2026-12-01");
  await page.getByRole("button", { name: "Create reminder", exact: true }).click();
  check("reminder is created", await waitForText(page, "UI test reminder"));

  // ----------------------------------------------------------- Monitoring
  section("7. Monitoring");
  await page.goto(`${BASE_URL}/monitoring`, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: /Run a check now/ }).click();
  check("simulated monitoring run reports back", await waitForText(page, /Checked \d+ monitored item/));

  const reviewButton = page.getByRole("button", { name: /Mark reviewed/ }).first();
  if ((await reviewButton.count()) > 0) {
    const beforeCount = await page.getByRole("button", { name: /Mark reviewed/ }).count();
    await reviewButton.click();
    const dropped = await page
      .waitForFunction(
        (n) =>
          Array.from(document.querySelectorAll("button")).filter((b) =>
            /Mark reviewed/.test(b.textContent ?? ""),
          ).length < n,
        beforeCount,
        { timeout: 45_000 },
      )
      .then(() => true)
      .catch(() => false);
    check("marking a change reviewed updates the feed", dropped);
  } else {
    check("marking a change reviewed updates the feed", false, "no unreviewed changes present");
  }

  // ----------------------------------------------------------- Comparison
  section("8. Jurisdiction comparison");
  await page.goto(`${BASE_URL}/compare`, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Compare", exact: true }).click();
  await page.waitForTimeout(2500);
  await page.waitForLoadState("networkidle");
  check("comparison table renders", (await page.locator("table").count()) > 0);

  const saveComparison = page.getByRole("button", { name: /Save comparison/ });
  if ((await saveComparison.count()) > 0) {
    await saveComparison.click();
    check("comparison saves", await waitForText(page, /Comparison saved/));
  } else {
    check("comparison saves", false, "save button not shown");
  }

  // --------------------------------------------------------- AI Analyst
  section("9. AI Policy Analyst");
  await page.goto(`${BASE_URL}/analyst`, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "What should I do next?", exact: true }).click();
  await page.waitForURL(/\/analyst\/.+/, { timeout: 90_000 });
  await page.getByText("Plain-language explanation").first().waitFor({ timeout: 90_000 });
  check("analyst returns a structured answer", true);
  check("answer lists its sources", (await page.getByText("Sources", { exact: true }).count()) > 0);
  check("answer carries the disclaimer", (await page.getByText(/does not constitute legal/).count()) > 0);

  const createTask = page.getByRole("button", { name: /^Create task$/ }).first();
  if ((await createTask.count()) > 0) {
    await createTask.click();
    check("a recommendation becomes a task", await waitForText(page, /Task created/));
  } else {
    check("a recommendation becomes a task", false, "no recommendations rendered");
  }

  await page.getByRole("button", { name: /Turn all into an action plan/ }).click();
  await page.waitForURL(/\/planner\?plan=/, { timeout: 30_000 });
  check("the answer converts into a full action plan", page.url().includes("/planner?plan="));

  // -------------------------------------------------------------- Reports
  section("10. Reports");
  await page.goto(`${BASE_URL}/reports`, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: /Generate compliance summary/ }).click();
  await page.waitForURL(/\/reports\/.+/, { timeout: 30_000 });
  await page.waitForLoadState("networkidle");
  check("report generates and opens", (await page.getByText("Compliance summary").count()) > 0);
  check("report contains the risk score", (await page.getByText("Policy Risk Score").count()) > 0);

  // -------------------------------------------------------- Notifications
  section("11. Notifications");
  await page.goto(`${BASE_URL}/notifications`, { waitUntil: "networkidle" });
  const markAll = page.getByRole("button", { name: /Mark all as read/ });
  if (await markAll.isEnabled()) {
    await markAll.click();
    check("mark all as read works", await waitForText(page, /^0 unread of/));
  } else {
    check("mark all as read works", true, "nothing unread");
  }

  // ------------------------------------------------------- Plan selection
  section("12. Plan selection");
  await page.goto(`${BASE_URL}/pricing`, { waitUntil: "networkidle" });
  // Pick whichever tier is not already selected, so the test is repeatable.
  const planButton = page
    .getByRole("button", { name: /^Switch to (Free|Pro|Business)$/ })
    .first();
  const planLabel = (await planButton.innerText()).replace("Switch to ", "").trim();
  await planButton.click();
  check(
    "plan selection persists",
    await waitForText(page, new RegExp(`You are now on the ${planLabel} plan`)),
    `tried ${planLabel}`,
  );

  // ------------------------------------------- Onboarding a new business
  section("13. Onboarding a new business");
  await page.goto(`${BASE_URL}/onboarding?new=1`, { waitUntil: "networkidle" });
  await page.getByLabel("Company name").fill("UI Test Co");
  await page
    .getByLabel("What does the business do?")
    .fill("A business created by the UI test to verify the onboarding survey end to end.");
  await page.getByLabel("State, province or region").selectOption("US-WA");
  await page.getByLabel("City").fill("Seattle");
  await page.getByRole("button", { name: /Continue/ }).click();
  await page.waitForTimeout(600);
  check("step 1 validates and advances", (await page.getByPlaceholder("Search industries…").count()) > 0);

  for (let step = 0; step < 4; step += 1) {
    await page.getByRole("button", { name: /Continue/ }).click();
    await page.waitForTimeout(400);
  }
  check("survey reaches the final step", (await page.getByText(/most important compliance concern/).count()) > 0);

  await page.locator('label:has-text("RegLens provides regulatory information") input[type="checkbox"]').check();
  await page.getByRole("button", { name: /Finish and open my dashboard/ }).click();
  await page.waitForURL("**/dashboard", { timeout: 30_000 });
  await page.waitForLoadState("networkidle");
  check(
    "onboarding creates the business and opens its dashboard",
    (await page.locator("h1").first().innerText()).includes("UI Test Co"),
  );

  // ------------------------------------------------------------- Cleanup
  section("14. Cleanup and sign out");
  await page.goto(`${BASE_URL}/settings`, { waitUntil: "networkidle" });
  page.once("dialog", (dialog) => dialog.accept());
  await page.locator('tr:has-text("UI Test Co")').getByRole("button", { name: /Delete/ }).click();
  await page.waitForTimeout(2500);
  await page.goto(`${BASE_URL}/settings`, { waitUntil: "networkidle" });
  check("deleting a business works", (await page.locator('tr:has-text("UI Test Co")').count()) === 0);

  await page.getByRole("button", { name: /Account menu/ }).click();
  await page.getByRole("button", { name: /Sign out/ }).click();
  await page.waitForURL(/\/sign-in/, { timeout: 30_000 });
  check("sign out returns to the sign-in page", page.url().includes("/sign-in"));
}

async function main() {
  const executablePath = findBrowser();
  if (!executablePath) {
    console.log(
      "No Chromium/Chrome binary found. Set PLAYWRIGHT_CHROMIUM to one, or install Chrome, then re-run.\nSkipping UI tests.",
    );
    return;
  }

  try {
    const response = await fetch(BASE_URL, { redirect: "manual" });
    if (!response.ok && response.status !== 307 && response.status !== 302) {
      throw new Error(`unexpected status ${response.status}`);
    }
  } catch (error) {
    console.log(`No server at ${BASE_URL} (${(error as Error).message}). Start one with \`npm run start\`.`);
    failed += 1;
    failures.push("server reachable");
    return;
  }

  console.log(`RegLens UI tests against ${BASE_URL}\nBrowser: ${executablePath}`);
  const browser = await chromium.launch({ executablePath });
  try {
    await run(browser);
  } finally {
    await browser.close();
  }
}

main()
  .catch((error) => {
    console.error("\nUI tests crashed:", error);
    failed += 1;
    failures.push("unhandled error");
  })
  .finally(() => {
    console.log(`\n${passed} passed, ${failed} failed`);
    if (failures.length > 0) {
      console.log("Failed checks:");
      for (const failure of failures) console.log(`  - ${failure}`);
    }
    const unique = Array.from(new Set(pageErrors));
    if (unique.length > 0) {
      console.log("\nBrowser console errors:");
      for (const error of unique.slice(0, 10)) console.log(`  ${error.slice(0, 240)}`);
    }
    process.exit(failed > 0 ? 1 : 0);
  });
