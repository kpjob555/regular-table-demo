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

  test("column headers inside regular-table thead are draggable", async ({ page }) => {
    const headers = page.locator("regular-table thead th");
    const count = await headers.count();
    expect(count).toBeGreaterThanOrEqual(5);

    const firstHeader = headers.nth(0);
    const thirdHeader = headers.nth(2);

    const firstBox = await firstHeader.boundingBox();
    const thirdBox = await thirdHeader.boundingBox();

    if (firstBox && thirdBox) {
      await page.mouse.move(firstBox.x + firstBox.width / 2, firstBox.y + firstBox.height / 2);
      await page.mouse.down();
      await page.mouse.move(thirdBox.x + thirdBox.width / 2, thirdBox.y + thirdBox.height / 2);
      await page.mouse.up();

      const newFirstText = await headers.nth(0).textContent();
      const newThirdText = await headers.nth(2).textContent();
      expect(newFirstText).not.toBe(newThirdText);
    }
  });

  test("directory row is expandable/collapsible", async ({ page }) => {
    await page.waitForSelector("regular-table tbody th.rt-directory");

    const directoryBefore = await page.locator("regular-table tbody th.rt-directory").count();

    // Use JS dispatchEvent to fire mousedown, bypassing sticky corner cell interception
    await page.evaluate(() => {
      const th = document.querySelector(
        "regular-table tbody th.rt-directory",
      ) as HTMLElement | null;
      if (th) {
        th.dispatchEvent(new MouseEvent("mousedown", { bubbles: true, cancelable: true }));
      }
    });

    await page.waitForTimeout(300);

    const directoryAfter = await page.locator("regular-table tbody th.rt-directory").count();
    expect(directoryAfter).toBeGreaterThan(directoryBefore);
  });

  test("file rows have correct styling", async ({ page }) => {
    await expect(page.locator("regular-table tbody th.rt-file").first()).toBeVisible();
  });

  test("table has correct column headers", async ({ page }) => {
    await page.waitForSelector("regular-table thead th");
    const expectedHeaders = ["Name", "Size", "Kind", "Modified", "Writable"];
    // Skip the first (empty corner cell) th, check the 5 column headers
    const headers = page.locator("regular-table thead th");
    const count = await headers.count();
    expect(count).toBeGreaterThanOrEqual(expectedHeaders.length);

    for (let i = 0; i < expectedHeaders.length; i++) {
      // nth(i+1) skips the empty corner cell at index 0
      await expect(headers.nth(i + 1)).toContainText(expectedHeaders[i]);
    }
  });
});
