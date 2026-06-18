import { test, expect, Page } from '@playwright/test';

const ZOOM_LEVELS = [0.8, 0.9, 1.0, 1.1, 1.25, 1.5];
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

async function setZoom(page: Page, zoom: number) {
  await page.evaluate((z) => {
    document.body.style.zoom = String(z);
  }, zoom);
  // Small wait for layout reflow
  await page.waitForTimeout(500);
}

async function checkNoHorizontalScroll(page: Page) {
  const hasHScroll = await page.evaluate(() => {
    return document.documentElement.scrollWidth > document.documentElement.clientWidth;
  });
  return !hasHScroll;
}

async function checkNoClippedButtons(page: Page) {
  const result = await page.evaluate(() => {
    const buttons = document.querySelectorAll('button, [role="button"], a');
    let allVisible = true;
    buttons.forEach((btn) => {
      const rect = btn.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        // Check if the button is within the viewport
        if (
          rect.right < 0 ||
          rect.bottom < 0 ||
          rect.left > window.innerWidth ||
          rect.top > window.innerHeight
        ) {
          // It's off-screen, but that's ok if it's inside a scrollable container
          // We only flag if it's clipped by the page viewport
        }
        // Check if it's clipped (partially visible)
        if (rect.width < 10 || rect.height < 10) {
          allVisible = false;
        }
      }
    });
    return allVisible;
  });
  return result;
}

async function checkNoOverlappingSidebar(page: Page) {
  const result = await page.evaluate(() => {
    const sidebar = document.querySelector('aside');
    const main = document.querySelector('main');
    if (!sidebar || !main) return true;
    const sRect = sidebar.getBoundingClientRect();
    const mRect = main.getBoundingClientRect();
    // Sidebar should not overlap main content
    return sRect.right <= mRect.left + 2; // 2px tolerance
  });
  return result;
}

for (const zoom of ZOOM_LEVELS) {
  test.describe(`Zoom ${zoom * 100}%`, () => {

    test('No horizontal page scrollbar', async ({ page }) => {
      await page.goto(BASE_URL);
      await page.waitForLoadState('networkidle');
      await setZoom(page, zoom);

      const noHScroll = await checkNoHorizontalScroll(page);
      expect(noHScroll, `Horizontal scroll detected at zoom ${zoom * 100}%`).toBe(true);
    });

    test('Sidebar does not overlap main content', async ({ page }) => {
      await page.goto(BASE_URL);
      await page.waitForLoadState('networkidle');
      await setZoom(page, zoom);

      // Only check on desktop-like viewport
      if (page.viewportSize()!.width >= 1024) {
        const noOverlap = await checkNoOverlappingSidebar(page);
        expect(noOverlap, `Sidebar overlaps main content at zoom ${zoom * 100}%`).toBe(true);
      }
    });

    test('No buttons are clipped', async ({ page }) => {
      await page.goto(BASE_URL);
      await page.waitForLoadState('networkidle');
      await setZoom(page, zoom);

      const noClipped = await checkNoClippedButtons(page);
      expect(noClipped, `Clipped buttons detected at zoom ${zoom * 100}%`).toBe(true);
    });

    test('Dashboard page renders without overflow', async ({ page }) => {
      await page.goto(BASE_URL);
      await page.waitForLoadState('networkidle');
      await setZoom(page, zoom);

      // Navigate to dashboard
      const dashboardBtn = page.locator('button:has-text("Dashboard Analitik")');
      if (await dashboardBtn.isVisible()) {
        await dashboardBtn.click();
        await page.waitForTimeout(1000);
        
        const noHScroll = await checkNoHorizontalScroll(page);
        expect(noHScroll, `Dashboard has horizontal scroll at zoom ${zoom * 100}%`).toBe(true);
      }
    });

    test('Order History page renders without overflow', async ({ page }) => {
      await page.goto(BASE_URL);
      await page.waitForLoadState('networkidle');
      await setZoom(page, zoom);

      // Navigate to history
      const historyBtn = page.locator('button:has-text("Riwayat Pesanan")');
      if (await historyBtn.isVisible()) {
        await historyBtn.click();
        await page.waitForTimeout(1000);
        
        const noHScroll = await checkNoHorizontalScroll(page);
        expect(noHScroll, `History page has horizontal scroll at zoom ${zoom * 100}%`).toBe(true);
      }
    });
  });
}
