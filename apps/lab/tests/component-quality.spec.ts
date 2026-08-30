import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import pixelmatch from "pixelmatch";
import { PNG } from "pngjs";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Conversation" })).toBeVisible();
});

test("keeps CSS Modules and Tailwind File visually equivalent", async ({ page }) => {
  await page.goto("/?parity=file");
  const css = page.locator('[data-flavor="css-modules"] [data-slot="file"]');
  const tailwind = page.locator('[data-flavor="tailwind"] [data-slot="file"]');
  await expect(css).toBeVisible();
  await expect(tailwind).toBeVisible();

  const measuredProperties = ["display", "width", "height", "gap", "padding", "color", "backgroundColor", "borderColor", "borderRadius", "fontSize", "lineHeight"] as const;
  const styles = async (locator: typeof css) => locator.evaluate((element, properties) => {
    const computed = getComputedStyle(element);
    return Object.fromEntries(properties.map((property) => [property, computed[property]]));
  }, measuredProperties);
  expect(await styles(tailwind)).toEqual(await styles(css));
  const cssImage = PNG.sync.read(await css.screenshot());
  const tailwindImage = PNG.sync.read(await tailwind.screenshot());
  expect({ width: tailwindImage.width, height: tailwindImage.height }).toEqual({ width: cssImage.width, height: cssImage.height });
  const mismatchedPixels = pixelmatch(cssImage.data, tailwindImage.data, undefined, cssImage.width, cssImage.height, { threshold: 0.1 });
  expect(mismatchedPixels / (cssImage.width * cssImage.height)).toBeLessThanOrEqual(0.01);
});

test("renders the contract fixture matrix and accessible component anatomy", async ({ page }) => {
  const fixtureNavigation = page.getByRole("complementary", { name: "Component fixtures" });
  const declaredCount = Number(await fixtureNavigation.locator(".panel-heading span").last().textContent());
  await expect(fixtureNavigation.locator("[data-fixture-scenario-option]")).toHaveCount(declaredCount);

  const conversation = page.locator("[data-aifk-conversation]");
  await expect(conversation).toBeVisible();
  await expect(conversation.getByRole("list")).toBeVisible();
  await expect(conversation.getByRole("textbox", { name: "Message" })).toBeVisible();
  await expect(conversation.getByRole("button", { name: "Add attachment" })).toHaveAccessibleName("Add attachment");
  await expect(conversation.getByRole("button", { name: "Send message" })).toBeDisabled();
});

test("loads every declared scenario through the real registry fixture harness", async ({ page }) => {
  test.setTimeout(60_000);
  const fixtureNavigation = page.getByRole("complementary", { name: "Component fixtures" });
  const componentOptions = page.locator("[data-component-option]");
  const componentIds = await componentOptions.evaluateAll((elements) => elements.map((element) => element.getAttribute("data-component-option")).filter(Boolean));

  for (const component of componentIds) {
    await page.locator(`[data-component-option="${component}"]`).click();
    const scenarioOptions = fixtureNavigation.locator("[data-fixture-scenario-option]");
    const scenarioIds = await scenarioOptions.evaluateAll((elements) => elements.map((element) => element.getAttribute("data-fixture-scenario-option")).filter(Boolean));
    for (const scenario of scenarioIds) {
      await fixtureNavigation.locator(`[data-fixture-scenario-option="${scenario}"]`).click();
      const frame = page.locator(".viewport-frame");
      await expect(frame).toHaveAttribute("data-fixture-component", component!);
      await expect(frame).toHaveAttribute("data-fixture-scenario", scenario!);
      if (component === "conversation") await expect(frame.locator("[data-aifk-conversation]")).toBeVisible();
      if (component === "message") await expect(frame.locator("[data-aifk-message]")).toBeVisible();
      if (component === "prompt-input") await expect(frame.getByRole("textbox", { name: "Message" })).toBeVisible();
      if (component === "tool-call") await expect(frame.locator("[data-aifk-tool]")).toBeVisible();
      if (component === "file") await expect(frame.locator("[data-slot=file]")).toBeVisible();
      if (component === "agent-progress") await expect(frame.locator('[data-fixture-pattern="agent-progress"]')).toBeVisible();
      if (component === "tool-approval") await expect(frame.locator('[data-fixture-pattern="tool-approval"]')).toBeVisible();
    }
  }
});

test("covers agent progress and approval decisions as interactive visual states", async ({ page }) => {
  const componentSwitcher = page.getByRole("group", { name: "Component" });
  const fixtureNavigation = page.getByRole("complementary", { name: "Component fixtures" });
  const frame = page.locator(".viewport-frame");

  await componentSwitcher.getByRole("button", { name: /^Agent progress/ }).click();
  await fixtureNavigation.getByRole("button", { name: /^Running/ }).click();
  await expect(frame.getByRole("heading", { name: "Audit release readiness" })).toBeVisible();
  await frame.getByRole("button", { name: "Stop" }).click();
  await expect(page.locator("[data-fixture-event]")).toContainText("onStop()");

  await fixtureNavigation.getByRole("button", { name: /^Failed/ }).click();
  await expect(frame.getByRole("alert")).toContainText("Accessibility review needs attention");

  await componentSwitcher.getByRole("button", { name: /^Tool approval/ }).click();
  await fixtureNavigation.getByRole("button", { name: /^Requested/ }).click();
  await expect(frame.getByText("Publish version 1.0.0 to the public registry.")).toBeVisible();
  await frame.getByRole("button", { name: "Approve" }).click();
  await expect(page.locator("[data-fixture-event]")).toContainText("onApprove()");

  await fixtureNavigation.getByRole("button", { name: /^Expired/ }).click();
  await expect(frame.getByRole("button", { name: "Approve" })).toBeDisabled();
  await expect(frame.getByRole("button", { name: "Reject" })).toBeDisabled();
  expect((await new AxeBuilder({ page }).include(".viewport-frame").analyze()).violations).toEqual([]);
});

test("keeps pattern visual contracts portable across themes and narrow layouts", async ({ page }) => {
  const componentSwitcher = page.getByRole("group", { name: "Component" });
  const fixtureNavigation = page.getByRole("complementary", { name: "Component fixtures" });
  const frame = page.locator(".viewport-frame");

  await componentSwitcher.getByRole("button", { name: /^Agent progress/ }).click();
  await page.getByRole("group", { name: "Theme" }).getByRole("button", { name: "Dark" }).click();
  await fixtureNavigation.getByRole("button", { name: /^Failed/ }).click();
  await expect(frame.locator("[data-aifk-theme=dark]")).toBeVisible();
  expect((await new AxeBuilder({ page }).include(".viewport-frame").analyze()).violations).toEqual([]);

  await componentSwitcher.getByRole("button", { name: /^Tool approval/ }).click();
  await fixtureNavigation.getByRole("button", { name: /^Expired/ }).click();
  await page.getByRole("group", { name: "Preview viewport" }).getByRole("button", { name: "375" }).click();
  await expect(frame).toHaveCSS("width", "375px");
  await expect(frame.locator('[data-fixture-pattern="tool-approval"]')).toBeVisible();
  expect(await frame.evaluate((element) => element.scrollWidth <= element.clientWidth + 1)).toBe(true);
  expect((await new AxeBuilder({ page }).include(".viewport-frame").analyze()).violations).toEqual([]);
});

test("captures reviewed agent and approval pattern baselines", async ({ page }) => {
  const componentSwitcher = page.getByRole("group", { name: "Component" });
  const fixtureNavigation = page.getByRole("complementary", { name: "Component fixtures" });
  const frame = page.locator(".viewport-frame");
  const theme = page.getByRole("group", { name: "Theme" });
  const viewport = page.getByRole("group", { name: "Preview viewport" });

  await componentSwitcher.getByRole("button", { name: /^Agent progress/ }).click();
  await fixtureNavigation.getByRole("button", { name: /^Running/ }).click();
  await expect(frame).toHaveScreenshot("agent-progress-running-light.webp");
  await theme.getByRole("button", { name: "Dark" }).click();
  await fixtureNavigation.getByRole("button", { name: /^Failed/ }).click();
  await expect(frame).toHaveScreenshot("agent-progress-failed-dark.webp");
  await viewport.getByRole("button", { name: "375" }).click();
  await fixtureNavigation.getByRole("button", { name: /^Paused/ }).click();
  await expect(frame).toHaveScreenshot("agent-progress-paused-dark-375.webp");

  await componentSwitcher.getByRole("button", { name: /^Tool approval/ }).click();
  await theme.getByRole("button", { name: "Light" }).click();
  await viewport.getByRole("button", { name: "768" }).click();
  await fixtureNavigation.getByRole("button", { name: /^Requested/ }).click();
  await expect(frame).toHaveScreenshot("tool-approval-requested-light.webp");
  await theme.getByRole("button", { name: "Dark" }).click();
  await fixtureNavigation.getByRole("button", { name: /^Approved/ }).click();
  await expect(frame).toHaveScreenshot("tool-approval-approved-dark.webp");
  await viewport.getByRole("button", { name: "375" }).click();
  await fixtureNavigation.getByRole("button", { name: /^Expired/ }).click();
  await expect(frame).toHaveScreenshot("tool-approval-expired-dark-375.webp");
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
  await expect(page.locator("[data-fixture-event]")).toContainText('onSubmit("First line\\nSecond line")');

  await fixtureNavigation.getByRole("button", { name: /^Submitting/ }).click();
  await input.fill("Keep this pending");
  await input.press("Enter");
  await expect(page.getByRole("button", { name: "Sending message" })).toHaveAttribute("aria-busy", "true");

  await fixtureNavigation.getByRole("button", { name: /^Submit rejected/ }).click();
  await input.fill("Keep this draft");
  await input.press("Enter");
  await expect(page.getByRole("alert")).toContainText("Message could not be sent. Try again.");
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
  await expect(page.getByRole("button", { name: "Continue", exact: true })).toBeVisible();

  await page.getByRole("button", { name: /^RTL/ }).click();
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
  await expect(frame).toHaveScreenshot("file-default-light.webp");
});

test("enforces File lifecycle, safe download, keyboard, and unavailable-source semantics", async ({ page }) => {
  const componentSwitcher = page.getByRole("group", { name: "Component" });
  const fixtureNavigation = page.getByRole("complementary", { name: "Component fixtures" });
  const frame = page.locator(".viewport-frame");
  await componentSwitcher.getByRole("button", { name: /^File/ }).click();

  const download = frame.getByRole("link", { name: "Download product-brief.pdf" });
  await expect(download).toHaveAttribute("href", "https://example.com/product-brief.pdf");
  await expect(download).toHaveAttribute("download", "product-brief.pdf");
  await download.focus();
  await expect(download).toBeFocused();
  await download.evaluate((element) => {
    element.addEventListener("click", (event) => {
      event.preventDefault();
      element.setAttribute("data-keyboard-activated", "true");
    }, { once: true });
  });
  await download.press("Enter");
  await expect(download).toHaveAttribute("data-keyboard-activated", "true");

  await fixtureNavigation.getByRole("button", { name: /^Loading/ }).click();
  await expect(frame.locator("[data-slot=file]")).toHaveAttribute("aria-busy", "true");
  await expect(frame.getByText("Preparing file", { exact: true })).toHaveCount(1);
  await expect(frame.locator("[data-slot=file-download-unavailable]")).toHaveCount(0);
  await expect(frame.getByRole("link", { name: /Download/ })).toHaveCount(0);

  await fixtureNavigation.getByRole("button", { name: /^Failed/ }).click();
  await expect(frame.getByRole("alert")).toHaveText("File unavailable");
  await expect(frame.locator("[data-slot=file-download-unavailable]")).toHaveCount(0);
  await page.getByRole("group", { name: "Theme" }).getByRole("button", { name: "Dark" }).click();
  await page.getByRole("group", { name: "Preview viewport" }).getByRole("button", { name: "375" }).click();
  expect((await new AxeBuilder({ page }).include(".viewport-frame").analyze()).violations).toEqual([]);
  await expect(frame).toHaveScreenshot("file-failed-dark-375.webp");

  await fixtureNavigation.getByRole("button", { name: /^Provider ID/ }).click();
  await expect(frame.getByText("Download unavailable", { exact: true })).toHaveCount(1);
  await expect(frame.getByRole("link", { name: /Download/ })).toHaveCount(0);
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
