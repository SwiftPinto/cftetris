import { test, expect } from '@playwright/test';

// Helper: set auth cookie to bypass password gate
async function authenticate(page: import('@playwright/test').Page) {
  await page.goto('/', { waitUntil: 'networkidle' });
  // If we see the password gate, fill it in
  const gateInput = page.locator('.gate-box input');
  if (await gateInput.isVisible({ timeout: 2000 }).catch(() => false)) {
    await gateInput.fill('tetris');
    await page.locator('.gate-box button').click();
    await page.waitForSelector('.board-wrapper canvas', { timeout: 5000 });
    // Wait for React to finish rendering the Game component
    await page.waitForTimeout(300);
  }
}

test.describe('desktop layout', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('hides mobile elements (touch controls, mobile top bar, scores toggle)', async ({ page }) => {
    await authenticate(page);

    // Wait for desktop header to appear
    await page.waitForSelector('header.desktop-only', { timeout: 3000 });

    // Mobile elements should be hidden
    await expect(page.locator('.touch-controls')).not.toBeVisible();
    await expect(page.locator('.mobile-top-bar')).not.toBeVisible();
    await expect(page.locator('.mobile-scores-section')).not.toBeVisible();

    // Desktop elements should be visible
    await expect(page.locator('.desktop-only').first()).toBeVisible();
    await expect(page.locator('.side-panel.left-panel')).toBeVisible();
    await expect(page.locator('.side-panel.right-panel')).toBeVisible();
  });

  test('shows keyboard controls in start overlay', async ({ page }) => {
    await authenticate(page);

    // The start overlay should show keyboard controls
    await expect(page.locator('.controls-info')).toBeVisible();
    await expect(page.locator('.controls-info')).toContainText('Move');

    // Mobile prompt should be hidden
    await expect(page.locator('.start-prompt.mobile-only')).not.toBeVisible();
  });
});

test.describe('mobile layout (iPhone 15)', () => {
  test.use({ viewport: { width: 393, height: 852 } });

  test('shows touch controls, mobile top bar, and scores toggle', async ({ page }) => {
    await authenticate(page);

    // Start the game so touch controls become visible
    await page.locator('.start-overlay').click();
    // Wait for the game to start and touch controls to appear
    await page.waitForSelector('.touch-controls', { timeout: 3000 });

    // Mobile elements should be visible
    await expect(page.locator('.touch-controls')).toBeVisible();
    await expect(page.locator('.mobile-top-bar')).toBeVisible();
    await expect(page.locator('.mobile-scores-section')).toBeVisible();

    // Desktop elements should be hidden
    await expect(page.locator('.side-panel.left-panel')).not.toBeVisible();
    await expect(page.locator('.side-panel.right-panel')).not.toBeVisible();
    await expect(page.locator('.controls-info')).not.toBeVisible();
  });

  test('D-pad and action buttons are rendered', async ({ page }) => {
    await authenticate(page);
    await page.locator('.start-overlay').click();
    await page.waitForSelector('.dpad-up', { timeout: 3000 });

    // D-pad buttons should exist
    await expect(page.locator('.dpad-up')).toBeVisible();
    await expect(page.locator('.dpad-left')).toBeVisible();
    await expect(page.locator('.dpad-right')).toBeVisible();
    await expect(page.locator('.dpad-down')).toBeVisible();

    // Action buttons should exist
    await expect(page.locator('.hard-drop-btn')).toBeVisible();
    await expect(page.locator('.hold-btn')).toBeVisible();
  });

  test('shows "Tap to start" on start screen', async ({ page }) => {
    await authenticate(page);

    // Mobile prompt should be visible
    await expect(page.locator('.start-prompt.mobile-only')).toBeVisible();
    await expect(page.locator('.start-prompt.mobile-only')).toContainText('Tap to start');
  });

  test('scores toggle expands and collapses', async ({ page }) => {
    await authenticate(page);

    // Click the scores toggle
    const toggle = page.locator('.scores-toggle');
    await expect(toggle).toBeVisible();
    await toggle.click();

    // Mobile scores panel should appear
    await expect(page.locator('.mobile-scores')).toBeVisible();
    await expect(page.locator('.mobile-scores .high-scores')).toBeVisible();

    // Click again to collapse
    await toggle.click();
    await expect(page.locator('.mobile-scores')).not.toBeVisible();
  });
});

test.describe('landscape mobile', () => {
  test.use({ viewport: { width: 640, height: 360 } });

  test('rearranges to compact horizontal layout', async ({ page }) => {
    await authenticate(page);
    await page.locator('.start-overlay').click();
    await page.waitForSelector('.touch-controls', { timeout: 3000 });

    // Touch controls should still be visible in landscape
    await expect(page.locator('.touch-controls')).toBeVisible();

    // Scores section should be hidden in landscape (too cramped)
    await expect(page.locator('.mobile-scores-section')).not.toBeVisible();
  });
});

test.describe('cross-device consistency', () => {
  test('game board renders on all viewports', async ({ page }) => {
    await authenticate(page);

    // Board canvas should always be visible
    await expect(page.locator('.board-wrapper canvas')).toBeVisible();
  });

  test('password gate works', async ({ page }) => {
    await page.goto('/');

    // Should see the password gate
    await expect(page.locator('.gate-box')).toBeVisible();
    await expect(page.locator('.gate-box input')).toBeVisible();

    // Wrong password shows error
    await page.locator('.gate-box input').fill('wrong');
    await page.locator('.gate-box button').click();
    await expect(page.locator('.gate-error')).toBeVisible();

    // Correct password unlocks
    await page.locator('.gate-box input').fill('tetris');
    await page.locator('.gate-box button').click();
    await expect(page.locator('.board-wrapper canvas')).toBeVisible({ timeout: 5000 });
  });
});
