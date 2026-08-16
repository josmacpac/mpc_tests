const { test, expect } = require('@playwright/test');
const { loginAdmin } = require('../helpers.js');

test.describe('Logo de clinica', () => {
  test('sube el logo de la Clinica Demo (id 4) contra la API dev', async ({ page }) => {
    await loginAdmin(page);

    const fila = page.locator('tr', { hasText: 'Clinica Demo' }).first();
    await expect(fila).toBeVisible();

    const [resp] = await Promise.all([
      page.waitForResponse(r => r.url().includes('/api/admin/clinicas/4/logo') && r.request().method() === 'POST'),
      fila.locator('[data-logo-input="4"]').setInputFiles('admin/fixtures/logo-test.png'),
    ]);
    expect(resp.status()).toBe(200);

    await expect(fila.locator('img[alt="Logo"]')).toBeVisible({ timeout: 20000 });
  });
});