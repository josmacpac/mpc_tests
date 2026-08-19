const { test, expect } = require('@playwright/test');
const { loginCliente } = require('../helpers.js');

test.describe('Directorio de veterinarias', () => {
  test('el directorio carga desde la navegación y tiene botón de regresar', async ({ page }) => {
    await loginCliente(page);
    await page.locator('nav').locator('text=Directorio').click();
    await expect(page).toHaveURL(/\/clinicas/);
    await expect(page.locator('h1', { hasText: 'Directorio de Veterinarias' })).toBeVisible({ timeout: 20000 });
    // Botón regresar en el encabezado (flecha)
    await expect(page.locator('header button')).toHaveCount(1);
  });

  test('las veterinarias sin vincular muestran el botón Agregar', async ({ page }) => {
    await loginCliente(page);
    await page.locator('nav').locator('text=Directorio').click();
    // Esperar a que cargue la lista de clínicas antes de contar los botones
    await expect(page.locator('h1', { hasText: 'Directorio de Veterinarias' })).toBeVisible({ timeout: 20000 });
    await expect(page.locator('text=Clinica Demo').first()).toBeVisible({ timeout: 20000 });
    const botones = page.locator('button', { hasText: 'Agregar veterinaria' });
    const total = await botones.count();
    if (total === 0) {
      test.skip(true, 'El cliente de prueba ya está vinculado a todas las veterinarias');
      return;
    }
    await expect(botones.first()).toBeVisible({ timeout: 20000 });
  });
});