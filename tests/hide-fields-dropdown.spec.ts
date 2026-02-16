import { expect, test } from "@playwright/test";

// Use saved auth state
test.use({ storageState: "playwright/.auth/user.json" });

test.describe("Hide Fields Dropdown", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to a table view
    await page.goto(
      "http://localhost:3000/base/tnn6wio2n4o4u6z0lg6bgeeq/rlowln9ewhhz2beo7av44vbz",
    );
    await page.waitForLoadState("networkidle");
  });

  test("hide fields button exists and is visible", async ({ page }) => {
    const hideFieldsButton = page.getByTestId("hide-fields-button");

    await expect(hideFieldsButton).toBeVisible();
  });

  test("hide fields button is enabled", async ({ page }) => {
    const hideFieldsButton = page.getByTestId("hide-fields-button");

    await expect(hideFieldsButton).toBeEnabled();
  });

  test("hide fields button has eye icon", async ({ page }) => {
    const hideFieldsButton = page.getByTestId("hide-fields-button");
    const icon = hideFieldsButton.locator("svg");

    await expect(icon).toBeVisible();
  });

  test("hide fields button shows default text", async ({ page }) => {
    const hideFieldsButton = page.getByTestId("hide-fields-button");
    const text = await hideFieldsButton.textContent();

    expect(text).toContain("Hide fields");
  });

  test("clicking hide fields button opens dropdown", async ({ page }) => {
    const hideFieldsButton = page.getByTestId("hide-fields-button");

    await hideFieldsButton.click();
    await page.waitForTimeout(300);

    // Check that search input appears
    const searchInput = page.locator('input[placeholder="Find a field"]');
    await expect(searchInput).toBeVisible();
  });

  test("dropdown contains search input", async ({ page }) => {
    const hideFieldsButton = page.getByTestId("hide-fields-button");

    await hideFieldsButton.click();
    await page.waitForTimeout(300);

    const searchInput = page.locator('input[placeholder="Find a field"]');
    await expect(searchInput).toBeVisible();
  });

  test("search input has correct placeholder", async ({ page }) => {
    const hideFieldsButton = page.getByTestId("hide-fields-button");

    await hideFieldsButton.click();
    await page.waitForTimeout(300);

    const searchInput = page.locator('input[placeholder="Find a field"]');
    await expect(searchInput).toHaveAttribute("placeholder", "Find a field");
  });

  test("typing in search input works", async ({ page }) => {
    const hideFieldsButton = page.getByTestId("hide-fields-button");

    await hideFieldsButton.click();
    await page.waitForTimeout(300);

    const searchInput = page.locator('input[placeholder="Find a field"]');
    await searchInput.fill("test");
    await page.waitForTimeout(200);

    const value = await searchInput.inputValue();
    expect(value).toBe("test");
  });

  test("no results message appears with invalid search", async ({ page }) => {
    const hideFieldsButton = page.getByTestId("hide-fields-button");

    await hideFieldsButton.click();
    await page.waitForTimeout(300);

    const searchInput = page.locator('input[placeholder="Find a field"]');
    await searchInput.fill("xyznonexistentfield999");
    await page.waitForTimeout(300);

    const noResultsText = page.getByText("No results");
    await expect(noResultsText).toBeVisible();
  });

  test("hide all button exists", async ({ page }) => {
    const hideFieldsButton = page.getByTestId("hide-fields-button");

    await hideFieldsButton.click();
    await page.waitForTimeout(300);

    const hideAllButton = page.getByText("Hide all");
    await expect(hideAllButton).toBeVisible();
  });

  test("show all button exists", async ({ page }) => {
    const hideFieldsButton = page.getByTestId("hide-fields-button");

    await hideFieldsButton.click();
    await page.waitForTimeout(300);

    const showAllButton = page.getByText("Show all");
    await expect(showAllButton).toBeVisible();
  });

  test("hide all button can be clicked", async ({ page }) => {
    const hideFieldsButton = page.getByTestId("hide-fields-button");

    await hideFieldsButton.click();
    await page.waitForTimeout(300);

    const hideAllButton = page.getByText("Hide all");
    await hideAllButton.click();
    await page.waitForTimeout(300);

    // Button should still be visible after click
    await expect(hideAllButton).toBeVisible();
  });

  test("show all button can be clicked", async ({ page }) => {
    const hideFieldsButton = page.getByTestId("hide-fields-button");

    await hideFieldsButton.click();
    await page.waitForTimeout(300);

    const showAllButton = page.getByText("Show all");
    await showAllButton.click();
    await page.waitForTimeout(300);

    // Button should still be visible after click
    await expect(showAllButton).toBeVisible();
  });

  test("search can be cleared", async ({ page }) => {
    const hideFieldsButton = page.getByTestId("hide-fields-button");

    await hideFieldsButton.click();
    await page.waitForTimeout(300);

    const searchInput = page.locator('input[placeholder="Find a field"]');
    await searchInput.fill("test");
    await page.waitForTimeout(200);
    await searchInput.clear();
    await page.waitForTimeout(200);

    const value = await searchInput.inputValue();
    expect(value).toBe("");
  });

  test("hide fields button stays enabled after opening dropdown", async ({
    page,
  }) => {
    const hideFieldsButton = page.getByTestId("hide-fields-button");

    await hideFieldsButton.click();
    await page.waitForTimeout(300);

    await expect(hideFieldsButton).toBeEnabled();
  });
});
