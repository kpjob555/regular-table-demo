import { test, expect } from "@playwright/test";

const BASE_URL = "http://localhost:5173";

test.describe("Regular Table Demo", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForSelector("regular-table");
    // Wait for thead to be populated
    await page.waitForFunction(() => {
      const th = document.querySelector("regular-table thead th[draggable='true']");
      return th !== null;
    });
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

  test("column headers are draggable and reorderable", async ({ page }) => {
    // Get meta.x values for the column headers
    const metaInfo = await page.evaluate(() => {
      const table = document.querySelector("regular-table") as HTMLElement & {
        getMeta: (el: HTMLElement) => { x: number; y: number; value: string };
      };
      const ths = table.querySelectorAll("thead th");
      return Array.from(ths).map((th) => ({
        text: th.textContent?.trim(),
        x: table.getMeta(th).x,
      }));
    });

    // Drag Kind (meta.x=2, visual index 3) to first position (visual index 1)
    await page.evaluate(() => {
      const ths = document.querySelectorAll("regular-table thead th");
      const srcTh = ths[3]; // Kind (meta.x=2)
      const tgtTh = ths[1]; // Name (first data column)

      const dt = new DataTransfer();
      srcTh.dispatchEvent(
        new DragEvent("dragstart", { bubbles: true, cancelable: true, dataTransfer: dt }),
      );
      tgtTh.dispatchEvent(
        new DragEvent("dragover", { bubbles: true, cancelable: true, dataTransfer: dt }),
      );
      tgtTh.dispatchEvent(
        new DragEvent("drop", { bubbles: true, cancelable: true, dataTransfer: dt }),
      );
      tgtTh.dispatchEvent(
        new DragEvent("dragend", { bubbles: true, cancelable: true, dataTransfer: dt }),
      );
    });

    await page.waitForTimeout(400);

    const afterTexts = await page.evaluate(() => {
      const ths = document.querySelectorAll("regular-table thead th");
      return Array.from(ths).map((th) => th.textContent?.trim() ?? "");
    });

    // Original: ["", "Name", "Size", "Kind", "Modified", "Writable"]
    // After dragging Kind (index 3 → index 1): ["", "Kind", "Name", "Size", "Modified", "Writable"]
    expect(afterTexts[1]).toBe("Kind");
    expect(afterTexts[2]).toBe("Name");
    expect(afterTexts[3]).toBe("Size");
  });

  test("directory row is expandable/collapsible", async ({ page }) => {
    await page.waitForSelector("regular-table tbody th.rt-directory");

    const directoryBefore = await page.locator("regular-table tbody th.rt-directory").count();

    // Use dispatchEvent to fire mousedown on the directory TH
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
    await page.waitForFunction(() => {
      const ths = document.querySelectorAll("regular-table thead th");
      return ths.length >= 6; // corner cell + 5 columns
    });

    const expectedHeaders = ["Name", "Size", "Kind", "Modified", "Writable"];
    const headers = page.locator("regular-table thead th");

    for (let i = 0; i < expectedHeaders.length; i++) {
      await expect(headers.nth(i + 1)).toContainText(expectedHeaders[i]);
    }
  });
});
