/**
 * Playwright UI smoke against production — clicks visible CTAs, checks forms render.
 */
import { chromium } from "playwright";
import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const BASE = (process.env.NEXT_TEST_BASE || "https://uncooked-v2.vercel.app").replace(/\/$/, "");
const outDir = join(process.cwd(), "docs", "security-evidence");
mkdirSync(outDir, { recursive: true });

const results = [];
function rec(name, ok, detail = "") {
  results.push({ name, ok, detail });
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? ` — ${detail}` : ""}`);
}

async function shot(page, name) {
  const path = join(outDir, `${name}.png`);
  await page.screenshot({ path, fullPage: true });
  return path;
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    ignoreHTTPSErrors: true,
  });
  const page = await context.newPage();
  page.setDefaultTimeout(45000);

  // Home
  await page.goto(BASE + "/", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1500);
  await shot(page, "01-home");
  const title = await page.title();
  rec("home loads", /opportia|uncooked/i.test(title) || (await page.locator("body").innerText()).length > 100, `title=${title}`);

  const navLinks = ["Events", "Opportunities", "About", "Contact", "Help"];
  for (const label of navLinks) {
    const link = page.getByRole("link", { name: new RegExp(label, "i") }).first();
    const visible = await link.isVisible().catch(() => false);
    rec(`nav link visible: ${label}`, visible);
  }

  // Click Events
  const eventsLink = page.getByRole("link", { name: /events/i }).first();
  if (await eventsLink.isVisible().catch(() => false)) {
    await eventsLink.click();
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(1200);
    await shot(page, "02-events");
    rec("events page after click", page.url().includes("/events"), page.url());
    const cards = await page.locator("a[href*='/events/'], article, [class*='card']").count();
    rec("events page has content cards/links", cards > 0, `count=${cards}`);
  } else {
    rec("events nav click", false, "link not found");
  }

  // Opportunities
  await page.goto(BASE + "/opportunities", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1200);
  await shot(page, "03-opportunities");
  rec("opportunities page", page.url().includes("/opportunities"));

  // Login form interactivity
  await page.goto(BASE + "/login", { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);
  await shot(page, "04-login");
  const email = page.locator('input[type="email"], input[name="email"]').first();
  const password = page.locator('input[type="password"]').first();
  const submit = page.locator('button[type="submit"]').first();
  rec("login email input", await email.isVisible().catch(() => false));
  rec("login password input", await password.isVisible().catch(() => false));
  rec("login submit button", await submit.isVisible().catch(() => false));

  if (await email.isVisible().catch(() => false)) {
    await email.fill("secprobe-ui@example.invalid");
    await password.fill("WrongPassword123!");
    await submit.click();
    await page.waitForTimeout(2000);
    await shot(page, "05-login-fail");
    const bodyText = await page.locator("body").innerText();
    const showedError = /invalid|incorrect|too many|sign-in|password|try again/i.test(bodyText);
    rec("login wrong password shows user-facing error", showedError, bodyText.slice(0, 200).replace(/\s+/g, " "));
  }

  // Signup
  await page.goto(BASE + "/signup", { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);
  await shot(page, "06-signup");
  rec("signup has password", await page.locator('input[type="password"]').first().isVisible().catch(() => false));
  rec("signup has submit", await page.locator('button[type="submit"]').first().isVisible().catch(() => false));

  // Contact form
  await page.goto(BASE + "/contact", { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);
  await shot(page, "07-contact");
  const contactSubmit = page.locator('button[type="submit"]').first();
  rec("contact submit visible", await contactSubmit.isVisible().catch(() => false));

  // Protected redirect
  await page.goto(BASE + "/dashboard", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1500);
  await shot(page, "08-dashboard-redirect");
  rec("dashboard redirects to login when anon", /login/i.test(page.url()), page.url());

  await page.goto(BASE + "/admin", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1500);
  await shot(page, "09-admin-redirect");
  rec("admin redirects to login when anon", /login/i.test(page.url()), page.url());

  // Legal pages
  for (const p of ["/privacy", "/terms", "/security", "/cookies"]) {
    await page.goto(BASE + p, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(500);
    const text = await page.locator("body").innerText();
    rec(`legal page ${p} has substance`, text.length > 400, `chars=${text.length}`);
  }

  // Footer / brand
  await page.goto(BASE + "/", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(800);
  const homeText = await page.locator("body").innerText();
  rec("brand Opportia present on home", /opportia/i.test(homeText), homeText.slice(0, 120).replace(/\s+/g, " "));

  await browser.close();

  const summary = {
    target: BASE,
    when: new Date().toISOString(),
    pass: results.filter((r) => r.ok).length,
    fail: results.filter((r) => !r.ok).length,
    results,
  };
  writeFileSync(join(outDir, "ui-smoke-results.json"), JSON.stringify(summary, null, 2));
  console.log("---");
  console.log(JSON.stringify(summary, null, 2));
  if (summary.fail > 0) process.exitCode = 2;
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
