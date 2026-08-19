const { test, expect } = require('@playwright/test');
const { loginCliente } = require('../helpers.js');

test.describe('Home del portal de clientes', () => {
  test.beforeEach(async ({ page }) => {
    await loginCliente(page);
  });

  test('muestra las mascotas de la clínica activa', async ({ page }) => {
    await expect(page.locator('h2', { hasText: 'Tus mascotas' })).toBeVisible({ timeout: 20000 });
    await expect(page.locator('text=Firulais QA')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('text=Michi QA')).toBeVisible({ timeout: 15000 });
  });

  test('muestra la clínica actual en el encabezado', async ({ page }) => {
    await expect(page.locator('header')).toContainText('Clinica Demo', { timeout: 20000 });
  });

  test('la navegación inferior tiene Mascotas/Citas/Directorio (sin Perfil)', async ({ page }) => {
    const nav = page.locator('nav');
    await expect(nav.locator('text=Mascotas')).toBeVisible();
    await expect(nav.locator('text=Citas')).toBeVisible();
    await expect(nav.locator('text=Directorio')).toBeVisible();
    await expect(nav.locator('text=Perfil')).toHaveCount(0);
  });

  test('el ícono de perfil está en el encabezado', async ({ page }) => {
    await expect(page.locator('header a[aria-label="Mi perfil"]')).toBeVisible({ timeout: 20000 });
  });
});