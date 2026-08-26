import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Conversation" })).toBeVisible();
});

test("renders the contract fixture matrix and accessible component anatomy", async ({ page }) => {
  const fixtureNavigation = page.getByRole("complementary", { name: "Component fixtures" });
  await expect(fixtureNavigation.getByRole("button")).toHaveCount(9);

  const conversation = page.locator("[data-aifk-conversation]");
  await expect(conversation).toBeVisible();
  await expect(conversation.getByRole("list")).toBeVisible();
  await expect(conversation.getByRole("textbox", { name: "Message" })).toBeVisible();
  await expect(conversation.getByRole("button", { name: "Add attachment" })).toHaveAccessibleName("Add attachment");
  await expect(conversation.getByRole("button", { name: "Send message" })).toBeDisabled();
});

test("loads every declared scenario through the real registry fixture harness", async ({ page }) => {
  test.setTimeout(60_000);
  const componentSwitcher = page.getByRole("group", { name: "Component" });
  const fixtureNavigation = page.getByRole("complementary", { name: "Component fixtures" });
  const contracts = {
    Conversation: { component: "conversation", scenarios: ["Default", "Empty", "Streaming", "Interrupted", "Failed", "Long content", "Mixed roles", "Right to left", "Localization"] },
    Message: { component: "message", scenarios: ["Default", "Streaming", "Interrupted", "Failed", "Long content", "User role", "System role", "Without slots", "RTL"] },
    "Prompt input": { component: "prompt-input", scenarios: ["Default", "Ready", "Multiline", "Submitting", "Submit rejected", "With leading context", "With toolbar controls", "RTL"] },
    "Tool call": { component: "tool-call", scenarios: ["Default", "Pending", "Running", "Complete", "Failed", "Cancelled"] },
    File: { component: "file", scenarios: ["Default", "Loading", "Ready", "Failed", "Download unavailable"] },
  } as const;

  for (const [title, contract] of Object.entries(contracts)) {
    await componentSwitcher.getByRole("button", { name: new RegExp(`^${title}`) }).click();
    await expect(page.getByRole("heading", { name: title })).toBeVisible();
    for (const scenario of contract.scenarios) {
      await fixtureNavigation.getByRole("button", { name: new RegExp(`^${scenario}`) }).click();
      const frame = page.locator(".viewport-frame");
      await expect(frame).toHaveAttribute("data-fixture-component", contract.component);
      const scenarioId = scenario === "Right to left" ? "rtl" : scenario.toLowerCase().replaceAll(" ", "-");
      await expect(frame).toHaveAttribute("data-fixture-scenario", scenarioId);
      if (contract.component === "conversation") await expect(frame.locator("[data-aifk-conversation]")).toBeVisible();
      if (contract.component === "message") await expect(frame.locator("[data-aifk-message]")).toBeVisible();
      if (contract.component === "prompt-input") await expect(frame.getByRole("textbox", { name: "Message" })).toBeVisible();
      if (contract.component === "tool-call") await expect(frame.locator("[data-aifk-tool]")).toBeVisible();
      if (contract.component === "file") await expect(frame.locator("[data-slot=file]")).toBeVisible();
    }
  }
});

test("exercises prompt input keyboard, pending, and rejection semantics", async ({ page }) => {
  const componentSwitcher = page.getByRole("group", { name: "Component" });
  const fixtureNavigation = page.getByRole("complementary", { name: "Component fixtures" });
  await componentSwitcher.getByRole("button", { name: /^Prompt input/ }).click();

  await fixtureNavigation.getByRole("button", { name: /^Default/ }).click();
  const input = page.getByRole("textbox", { name: "Message" });
  await input.fill("First line");
  await input.press("Shift+Enter");
  await input.type("Second line");
  await expect(input).toHaveValue("First line\nSecond line");
  await input.press("Enter");
  await expect(page.locator("[data-fixture-submit-count]")).toContainText("Submitted 1");

  await fixtureNavigation.getByRole("button", { name: /^Submitting/ }).click();
  await input.fill("Keep this pending");
  await input.press("Enter");
  await expect(page.getByRole("button", { name: "Sending message" })).toHaveAttribute("aria-busy", "true");

  await fixtureNavigation.getByRole("button", { name: /^Submit rejected/ }).click();
  await input.fill("Keep this draft");
  await input.press("Enter");
  await expect(page.getByRole("alert")).toContainText("still here");
  await expect(input).toHaveValue("Keep this draft");
});

test("keeps hierarchy and content bounded at the 375px component viewport", async ({ page }) => {
  await page.getByRole("group", { name: "Preview viewport" }).getByRole("button", { name: "375" }).click();
  await page.getByRole("button", { name: /Long content/ }).click();

  const frame = page.locator(".viewport-frame");
  await expect(frame).toHaveCSS("width", "375px");
  const frameBox = await frame.boundingBox();
  expect(frameBox?.width).toBeGreaterThanOrEqual(374);
  expect(frameBox?.width).toBeLessThanOrEqual(377);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  expect(await frame.evaluate((element) => element.scrollWidth <= element.clientWidth + 1)).toBe(true);

  const userMessage = frame.locator('.aifk-message[data-role="user"]').first();
  const assistantMessage = frame.locator('.aifk-message[data-role="assistant"]').first();
  const userBox = await userMessage.boundingBox();
  const assistantBox = await assistantMessage.boundingBox();
  expect((userBox?.x ?? 0)).toBeGreaterThan(assistantBox?.x ?? 0);
  expect(userBox?.width ?? 0).toBeLessThan(frameBox?.width ?? 0);
});

test("preserves semantic state across interruption, RTL, themes, and reduced motion", async ({ page }) => {
  await page.getByRole("button", { name: /Interrupted/ }).click();
  await expect(page.locator('.aifk-message[data-status="interrupted"]')).toContainText("Stopped by the user");
  await expect(page.getByRole("button", { name: "Continue" })).toBeVisible();

  await page.getByRole("button", { name: /Right to left/ }).click();
  await expect(page.locator(".viewport-frame")).toHaveAttribute("dir", "rtl");

  await page.getByRole("group", { name: "Theme" }).getByRole("button", { name: "Dark" }).click();
  await expect(page.locator("[data-aifk-theme=dark]")).toBeVisible();
  const reducedMotion = page
    .getByRole("complementary", { name: "Preview inspector" })
    .locator("label.toggle-row")
    .filter({ hasText: "Reduced motion" });
  await reducedMotion.click();
  await expect(reducedMotion.getByRole("checkbox")).toBeChecked();
  await expect(page.locator("[data-aifk-motion=none]")).toBeVisible();
});

test("has no automatically detectable accessibility violations in representative states", async ({ page }) => {
  const defaultResults = await new AxeBuilder({ page }).include("[data-aifk-root]").analyze();
  expect(defaultResults.violations).toEqual([]);

  await page.getByRole("button", { name: /Failed/ }).click();
  await page.getByRole("group", { name: "Theme" }).getByRole("button", { name: "Contrast" }).click();
  await page.getByRole("group", { name: "Preview viewport" }).getByRole("button", { name: "375" }).click();
  const stressResults = await new AxeBuilder({ page }).include("[data-aifk-root]").analyze();
  expect(stressResults.violations).toEqual([]);
});

test("captures reviewed light and dark component baselines", async ({ page }) => {
  const frame = page.locator(".viewport-frame");
  await expect(frame).toHaveScreenshot("conversation-default-light.webp");

  await page.getByRole("group", { name: "Theme" }).getByRole("button", { name: "Dark" }).click();
  await page.getByRole("group", { name: "Preview viewport" }).getByRole("button", { name: "375" }).click();
  await page.getByRole("button", { name: /Failed/ }).click();
  await expect(frame).toHaveScreenshot("conversation-failed-dark-375.webp");

  await page.getByRole("group", { name: "Theme" }).getByRole("button", { name: "Contrast" }).click();
  await expect(frame).toHaveScreenshot("conversation-failed-contrast-375.webp");
});

test("captures and scans representative registry components", async ({ page }) => {
  const componentSwitcher = page.getByRole("group", { name: "Component" });
  const fixtureNavigation = page.getByRole("complementary", { name: "Component fixtures" });
  const frame = page.locator(".viewport-frame");

  await componentSwitcher.getByRole("button", { name: /^Message/ }).click();
  await expect(frame.locator("[data-aifk-message]")).toBeVisible();
  expect((await new AxeBuilder({ page }).include(".viewport-frame").analyze()).violations).toEqual([]);
  await expect(frame).toHaveScreenshot("message-default-light.webp");

  await componentSwitcher.getByRole("button", { name: /^Prompt input/ }).click();
  await fixtureNavigation.getByRole("button", { name: /^Ready/ }).click();
  await expect(frame.getByRole("textbox", { name: "Message" })).toHaveValue("Review the release checklist");
  expect((await new AxeBuilder({ page }).include(".viewport-frame").analyze()).violations).toEqual([]);
  await expect(frame).toHaveScreenshot("prompt-input-ready-light.webp");

  await componentSwitcher.getByRole("button", { name: /^Tool call/ }).click();
  await fixtureNavigation.getByRole("button", { name: /^Failed/ }).click();
  await expect(frame.getByRole("alert")).toBeVisible();
  expect((await new AxeBuilder({ page }).include(".viewport-frame").analyze()).violations).toEqual([]);
  await expect(frame).toHaveScreenshot("tool-call-failed-light.webp");

  await componentSwitcher.getByRole("button", { name: /^File/ }).click();
  await expect(frame.locator("[data-slot=file]")).toBeVisible();
  expect((await new AxeBuilder({ page }).include(".viewport-frame").analyze()).violations).toEqual([]);
});

test("keeps touch actions at least 44px in a coarse-pointer browser", async ({ browser }) => {
  const context = await browser.newContext({ hasTouch: true, isMobile: true, viewport: { width: 390, height: 844 }, reducedMotion: "reduce" });
  const page = await context.newPage();
  await page.goto("http://127.0.0.1:5174/");
  const action = page.getByRole("button", { name: "Add attachment" });
  await expect(action).toBeVisible();
  const box = await action.boundingBox();
  expect(box?.width ?? 0).toBeGreaterThanOrEqual(44);
  expect(box?.height ?? 0).toBeGreaterThanOrEqual(44);
  const input = page.getByRole("textbox", { name: "Message" });
  await input.fill("Check the primary action target");
  const submit = page.getByRole("button", { name: "Send message" });
  await expect(submit).toBeEnabled();
  const submitBox = await submit.boundingBox();
  expect(submitBox?.width ?? 0).toBeGreaterThanOrEqual(44);
  expect(submitBox?.height ?? 0).toBeGreaterThanOrEqual(44);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  await context.close();
});
