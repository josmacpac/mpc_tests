const { test, expect } = require('@playwright/test');
const { loginVet } = require('../helpers.js');

test.describe('Cierre de sesión', () => {
  test('cierra sesión y regresa al login', async ({ page }) => {
    await loginVet(page);

    await page.click('button[data-bs-toggle="dropdown"]');
    await expect(page.locator('#btnLogout')).toBeVisible();
    await Promise.all([
      page.waitForURL(/login\.html/),
      page.click('#btnLogout'),
    ]);

    await expect(page.locator('#email-input')).toBeVisible({ timeout: 15000 });
    const storage = await page.evaluate(() => localStorage.length);
    expect(storage).toBe(0);
  });
});