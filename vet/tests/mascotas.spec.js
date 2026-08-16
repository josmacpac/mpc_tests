const { test, expect } = require('@playwright/test');
const { loginVet } = require('../helpers.js');

test.describe('Pagina de mascotas', () => {
  test('carga la tabla de mascotas de la clinica demo', async ({ page }) => {
    await loginVet(page);
    await page.goto('/mascotas');
    await expect(page.locator('#nombreClinica')).toContainText('Clinica Demo', { timeout: 20000 });
    await expect(page.locator('#tablaMascotas')).toBeVisible();
    await expect(page.locator('#tablaMascotas tbody tr').first()).toBeVisible({ timeout: 20000 });
  });
});