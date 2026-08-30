import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("navigates authored MDX with one page title and semantic tables", async ({ page }) => {
  await page.goto("/docs/components/conversation");
  await expect(page.getByRole("heading", { level: 1, name: "Conversation" })).toHaveCount(1);
  await expect(page.getByRole("region", { name: "Conversation interactive playground" })).toBeVisible();
  await expect(page.getByRole("table").first()).toBeVisible();
  await expect(page.getByRole("link", { name: "Message", exact: true })).toHaveAttribute("href", "/docs/components/message");
});

test("searches the complete documentation index and preserves deep links", async ({ page }) => {
  await page.goto("/docs");
  const trigger = page.getByRole("button", { name: "Search documentation" }).first();
  await trigger.click();
  const searchbox = page.getByRole("searchbox", { name: "Search documentation" });
  await searchbox.fill("aria-busy");
  await expect(page.getByRole("button", { name: /^Message Render/ })).toBeVisible();
  await searchbox.press("Shift+Tab");
  await expect(page.locator(".search-dialog :focus")).toHaveCount(1);
  await page.keyboard.press("Escape");
  await expect(trigger).toBeFocused();

  await trigger.click();
  await page.getByRole("searchbox", { name: "Search documentation" }).fill("file");
  await page.getByRole("button", { name: /^File Present file/ }).click();
  await expect(page).toHaveURL(/\/docs\/components\/file$/);
  await expect(page.getByRole("region", { name: "File interactive playground" })).toBeVisible();
});

test("renders every current component through a typed interactive playground", async ({ page }) => {
  const components = ["conversation", "message", "prompt-input", "file", "tool-call"] as const;
  for (const component of components) {
    await page.goto(`/docs/components/${component}`);
    await expect(page.locator(".component-playground")).toBeVisible();
    await expect(page.getByRole("complementary", { name: "Component controls" })).toBeVisible();
    await expect(page.getByRole("combobox", { name: "Scenario" })).toBeVisible();
  }
});

test("keeps the inspector left of a bounded sticky preview on desktop", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/docs/components/conversation");

  const controls = page.getByRole("complementary", { name: "Component controls" });
  const stage = page.getByRole("region", { name: "Component preview stage" });
  const controlsBox = await controls.boundingBox();
  const stageBox = await stage.boundingBox();
  expect(controlsBox).not.toBeNull();
  expect(stageBox).not.toBeNull();
  expect(controlsBox!.x).toBeLessThan(stageBox!.x);
  expect(await page.locator(".playground-stage-sticky").evaluate((node) => getComputedStyle(node).position)).toBe("sticky");

  await page.locator(".playground-stage-sticky").evaluate((node) => {
    const absoluteTop = node.getBoundingClientRect().top + window.scrollY;
    document.documentElement.style.scrollBehavior = "auto";
    window.scrollTo(0, absoluteTop - 76 + 96);
  });
  await page.waitForTimeout(200);
  const pinnedBox = await page.locator(".playground-stage-sticky").boundingBox();
  expect(pinnedBox).not.toBeNull();
  expect(pinnedBox!.y).toBeGreaterThanOrEqual(75);
  expect(pinnedBox!.y).toBeLessThanOrEqual(77);
  await expect(page.getByRole("button", { name: "Copy code" })).toBeVisible();
});

test("supports dark mode, source view, and component state changes", async ({ page }) => {
  await page.goto("/docs/components/file");
  await page.getByRole("button", { name: "Switch to dark theme" }).click();
  await expect(page.locator(".docs-root")).toHaveAttribute("data-aifk-theme", "dark");
  await page.getByRole("combobox", { name: "Scenario" }).selectOption("loading");
  await expect(page.getByText("Preparing file", { exact: true }).first()).toBeVisible();
  await page.getByRole("textbox", { name: "File name" }).fill("release-notes.md");
  await page.locator(".playground-control-groups summary").filter({ hasText: "Advanced" }).click();
  await page.locator('[data-playground-control="environment.language"] label').filter({ hasText: "JSX" }).click();
  await expect(page.getByRole("radio", { name: "JSX" })).toBeChecked();
  await page.getByRole("tab", { name: "Code" }).click();
  await expect(page.locator(".playground-code")).toContainText("<File.Root");
  await expect(page.locator(".playground-code")).toContainText('name: "release-notes.md"');
  await expect(page.locator(".playground-code")).not.toContainText(" as const");
  await expect(page.locator(".syntax-tag").filter({ hasText: "File.Root" }).first()).toBeVisible();
});

test("keeps edited conversation content synchronized across preview, code, and URL", async ({ page }) => {
  await page.goto("/docs/components/conversation");
  const userMessage = page.getByRole("textbox", { name: "User message" });
  await userMessage.fill("Show this exact value in preview and code.");
  await expect(page.getByRole("combobox", { name: "Scenario" })).toHaveValue("custom");
  await expect(page.locator('[data-aifk-message-part="text"]').filter({ hasText: "Show this exact value in preview and code." })).toBeVisible();
  await expect(page).toHaveURL(/pg\.props\.userMessage=/);
  const behaviorSummary = page.locator(".playground-control-groups summary").filter({ hasText: "Behavior" });
  const behaviorGroup = behaviorSummary.locator("..");
  await behaviorSummary.click();
  await page.getByRole("combobox", { name: "Runtime state" }).selectOption("failed");
  await expect(behaviorGroup).toHaveAttribute("open", "");
  await page.getByRole("tab", { name: "Code" }).click();
  await expect(page.locator(".playground-code")).toContainText('"Show this exact value in preview and code."');
  await page.reload();
  await page.getByRole("tab", { name: "Code" }).click();
  await expect(page.locator(".playground-code")).toContainText('"Show this exact value in preview and code."');
});

test("updates code when a scenario changes and exposes working callback feedback", async ({ page }) => {
  await page.goto("/docs/components/tool-call");
  await page.getByRole("combobox", { name: "Scenario" }).selectOption("failed");
  await page.getByRole("tab", { name: "Code" }).click();
  await expect(page.locator(".playground-code")).toContainText('status: "failed"');
  await expect(page.locator(".playground-code")).toContainText("The documentation index is unavailable");

  await page.goto("/docs/components/prompt-input");
  await page.getByRole("textbox", { name: "Message" }).fill("Inspect this callback");
  await expect(page).toHaveURL(/pg\.props\.value=/);
  await page.getByRole("tab", { name: "Code" }).click();
  await expect(page.locator(".playground-code")).toContainText('useState<string>("Inspect this callback")');
  await page.getByRole("tab", { name: "Preview" }).click();
  await expect(page.getByRole("textbox", { name: "Message" })).toHaveValue("Inspect this callback");
  await page.getByRole("textbox", { name: "Message" }).press("Enter");
  await expect(page.getByRole("status").filter({ hasText: 'onSubmit("Inspect this callback")' })).toBeVisible();
});

test("keeps the mobile shell usable and bounded", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/docs/components/prompt-input");
  await expect(page.getByRole("button", { name: "Toggle documentation navigation" })).toBeVisible();
  await page.getByRole("button", { name: "Toggle documentation navigation" }).click();
  await expect(page.getByRole("complementary", { name: "Documentation navigation" })).toHaveClass(/is-open/);
  await page.getByRole("button", { name: "Toggle documentation navigation" }).click();
  await expect(page.getByRole("complementary", { name: "Component controls" })).toBeVisible();
  const customize = page.getByRole("button", { name: /Customize/ });
  await expect(customize).toHaveAttribute("aria-expanded", "false");
  await expect(page.locator(".playground-inspector-body")).toBeHidden();
  await customize.click();
  await expect(customize).toHaveAttribute("aria-expanded", "true");
  await expect(page.locator(".playground-inspector-body").getByRole("combobox", { name: "Scenario" })).toBeVisible();
  expect(await page.locator(".playground-stage-sticky").evaluate((node) => getComputedStyle(node).position)).toBe("static");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
});

test("has no automatically detectable accessibility violations", async ({ page }) => {
  await page.goto("/docs");
  expect((await new AxeBuilder({ page }).include(".docs-root").analyze()).violations).toEqual([]);

  await page.goto("/docs/components/tool-call");
  await page.getByRole("button", { name: "Switch to dark theme" }).click();
  expect((await new AxeBuilder({ page }).include(".docs-root").analyze()).violations).toEqual([]);
});
