const { test, expect } = require('@playwright/test');
const { loginCliente } = require('../helpers.js');

test.describe('Perfil del portal de clientes', () => {
  test('accede al perfil desde el ícono del encabezado y muestra sus veterinarias', async ({ page }) => {
    await loginCliente(page);
    await page.locator('header a[aria-label="Mi perfil"]').click();
    await expect(page).toHaveURL(/\/perfil/);
    await expect(page.locator('h1', { hasText: 'Mi Perfil' })).toBeVisible({ timeout: 20000 });
    await expect(page.locator('text=Test User2')).toBeVisible();
    await expect(page.locator('h3', { hasText: 'Mis veterinarias' })).toBeVisible();
    await expect(page.locator('text=Clinica Demo')).toBeVisible();
  });

  test('cerrar sesión regresa al login y limpia la sesión', async ({ page }) => {
    await loginCliente(page);
    await page.locator('header a[aria-label="Mi perfil"]').click();
    await page.locator('button', { hasText: 'Cerrar sesión' }).click();
    await expect(page).toHaveURL(/\/login/, { timeout: 15000 });
  });
});