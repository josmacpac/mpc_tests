const { test, expect } = require('@playwright/test');

test.describe('Panel admin (smoke)', () => {
  test('la app carga y muestra el login', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#app')).toBeVisible({ timeout: 20000 });
    await expect(page.locator('#loginBtn')).toBeVisible();
  });
});