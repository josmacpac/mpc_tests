const { test, expect } = require('@playwright/test');
const config = require('../../qa.config.js');

test.describe('Portal clientes (smoke)', () => {
  test('la app carga', async ({ page }) => {
    test.skip(
      config.clientes.baseURL.includes('PENDIENTE'),
      'URL del portal clientes dev aun no configurada en qa.config.js'
    );
    await page.goto('/');
    await expect(page.locator('#app')).toBeVisible({ timeout: 20000 });
  });
});