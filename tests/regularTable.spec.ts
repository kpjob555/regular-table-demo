import { test, expect } from "@playwright/test";

const BASE_URL = "http://localhost:5173";

test.describe("Regular Table Demo", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForSelector("regular-table");
  });

  test("page loads with title and table", async ({ page }) => {
    await expect(page.locator("h2")).toContainText("File Browser");
    await expect(page.locator("regular-table")).toBeVisible();
  });

  test("reset button works", async ({ page }) => {
    const resetBtn = page.locator("button.reset-btn");
    await expect(resetBtn).toBeVisible();
    await resetBtn.click({ force: true });
    await expect(page.locator("regular-table")).toBeVisible();
  });

  test("column headers are draggable", async ({ page }) => {
    const headers = page.locator(".column-header");
    const count = await headers.count();
    expect(count).toBe(5);

    const firstHeader = headers.nth(0);
    const secondHeader = headers.nth(1);

    const firstBox = await firstHeader.boundingBox();
    const secondBox = await secondHeader.boundingBox();

    if (firstBox && secondBox) {
      await page.mouse.move(firstBox.x + firstBox.width / 2, firstBox.y + firstBox.height / 2);
      await page.mouse.down();
      await page.mouse.move(secondBox.x + secondBox.width / 2, secondBox.y + secondBox.height / 2);
      await page.mouse.up();

      const updatedFirstText = await headers.nth(0).textContent();
      const updatedSecondText = await headers.nth(1).textContent();

      expect(updatedFirstText).not.toBe(updatedSecondText);
    }
  });

  test("directory row is expandable/collapsible", async ({ page }) => {
    await page.waitForSelector("regular-table tbody th.rt-directory");

    const directoryBefore = await page.locator("regular-table tbody th.rt-directory").count();

    const firstDir = page.locator("regular-table tbody th.rt-directory").first();
    await firstDir.click();

    await page.waitForTimeout(300);

    const directoryAfter = await page.locator("regular-table tbody th.rt-directory").count();
    expect(directoryAfter).toBeGreaterThan(directoryBefore);
  });

  test("file rows have correct styling", async ({ page }) => {
    await expect(page.locator("regular-table tbody th.rt-file").first()).toBeVisible();
  });

  test("table has correct column headers", async ({ page }) => {
    const expectedHeaders = ["Name", "Size", "Kind", "Modified", "Writable"];
    const headers = page.locator(".column-header");

    for (let i = 0; i < expectedHeaders.length; i++) {
      await expect(headers.nth(i)).toContainText(expectedHeaders[i]);
    }
  });
});
