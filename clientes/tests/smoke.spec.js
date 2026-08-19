const { test, expect } = require('@playwright/test');

test.describe('Portal clientes (smoke)', () => {
  test('la app carga y redirige al login sin sesión', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#app')).toBeVisible({ timeout: 20000 });
    await expect(page).toHaveURL(/\/login/);
  });
});