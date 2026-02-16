import { expect, test } from "@playwright/test";

// Use saved auth state
test.use({ storageState: "playwright/.auth/user.json" });

test.describe("Filter Fields Dropdown", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to a table view
    await page.goto(
      "http://localhost:3000/base/tnn6wio2n4o4u6z0lg6bgeeq/rlowln9ewhhz2beo7av44vbz",
    );
    await page.waitForLoadState("networkidle");
  });

  test("filter button exists and is visible", async ({ page }) => {
    const filterButton = page.getByTestId("filter-button");

    await expect(filterButton).toBeVisible();
  });

  test("filter button is enabled", async ({ page }) => {
    const filterButton = page.getByTestId("filter-button");

    await expect(filterButton).toBeEnabled();
  });

  test("filter button has filter icon", async ({ page }) => {
    const filterButton = page.getByTestId("filter-button");
    const icon = filterButton.locator("svg");

    await expect(icon).toBeVisible();
  });

  test("filter button shows default text", async ({ page }) => {
    const filterButton = page.getByTestId("filter-button");
    const text = await filterButton.textContent();

    expect(text).toContain("Filter");
  });

  test("clicking filter button opens dropdown", async ({ page }) => {
    const filterButton = page.getByTestId("filter-button");

    await filterButton.click();
    await page.waitForTimeout(300);

    // Check that dropdown content appears (filter form)
    const dropdownContent = page
      .locator('[role="menu"]')
      .or(page.locator(".filter-form"));
    const count = await dropdownContent.count();

    expect(count).toBeGreaterThan(0);
  });

  test("filter button stays enabled after opening dropdown", async ({
    page,
  }) => {
    const filterButton = page.getByTestId("filter-button");

    await filterButton.click();
    await page.waitForTimeout(300);

    await expect(filterButton).toBeEnabled();
  });
});
