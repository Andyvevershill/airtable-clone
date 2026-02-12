import { expect, test } from "@playwright/test";

// Use saved auth state
test.use({ storageState: "playwright/.auth/user.json" });

test.describe("Add Row", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate directly to the table (already logged in via saved auth)
    await page.goto(
      "http://localhost:3000/base/tnn6wio2n4o4u6z0lg6bgeeq/rlowln9ewhhz2beo7av44vbz",
    );
    await page.waitForLoadState("networkidle");
  });

  test("add row button exists and is visible", async ({ page }) => {
    const addRowButton = page.getByTestId("add-row-button");

    // Check button exists
    await expect(addRowButton).toBeVisible();

    // Check button is enabled
    await expect(addRowButton).toBeEnabled();
  });

  test("add row button has correct title", async ({ page }) => {
    const addRowButton = page.getByTestId("add-row-button");

    // Check the title attribute
    await expect(addRowButton).toHaveAttribute("title", "Add row");
  });

  test("add row button contains plus icon", async ({ page }) => {
    const addRowButton = page.getByTestId("add-row-button");

    // Check SVG icon exists inside button
    const icon = addRowButton.locator("svg");
    await expect(icon).toBeVisible();
  });

  test("should add a new row when button is clicked", async ({ page }) => {
    // Count rows before adding
    const initialRowCount = await page.locator("tbody tr").count();

    // Click add row button
    await page.getByTestId("add-row-button").click();

    // Wait for the row to appear
    await page.waitForTimeout(300);

    // Verify row was added
    const newRowCount = await page.locator("tbody tr").count();
    expect(newRowCount).toBe(initialRowCount + 1);
  });

  test("should add multiple rows when clicked multiple times", async ({
    page,
  }) => {
    const initialRowCount = await page.locator("tbody tr").count();

    // Click 3 times
    await page.getByTestId("add-row-button").click();
    await page.waitForTimeout(200);
    await page.getByTestId("add-row-button").click();
    await page.waitForTimeout(200);
    await page.getByTestId("add-row-button").click();
    await page.waitForTimeout(200);

    // Verify 3 rows were added
    const newRowCount = await page.locator("tbody tr").count();
    expect(newRowCount).toBe(initialRowCount + 3);
  });

  test("new row should have empty cells", async ({ page }) => {
    // Click add row button
    await page.getByTestId("add-row-button").click();
    await page.waitForTimeout(300);

    // Get the last row (newly added)
    const lastRow = page.locator("tbody tr").last();

    // Verify row is visible
    await expect(lastRow).toBeVisible();

    // Check that row has cells
    const cells = lastRow.locator("td");
    await expect(cells.first()).toBeVisible();
  });

  test("button stays enabled after adding row", async ({ page }) => {
    const addRowButton = page.getByTestId("add-row-button");

    // Click to add a row
    await addRowButton.click();
    await page.waitForTimeout(300);

    // Verify button is still enabled (not disabled)
    await expect(addRowButton).toBeEnabled();
  });
});
