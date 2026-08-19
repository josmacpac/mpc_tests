const { test, expect } = require('@playwright/test');
const { clientes } = require('../../qa.config.js');

test.describe('Registro del portal de clientes', () => {
  test('detecta una cuenta existente y muestra el modal de asociación', async ({ page }) => {
    await page.goto('/registro');
    await page.fill('input[type="text"]', 'QA Registro Nuevo');
    await page.fill('input[type="tel"]', '6141112233');
    await page.fill('input[type="email"]', clientes.email);
    await page.fill('input[type="password"]', clientes.password);
    await page.fill('input[type="password"] >> nth=1', clientes.password);

    await page.locator('button[type="submit"]').click();

    // El API devuelve existe=true -> modal de confirmación
    await expect(page.locator('text=Ya existe una cuenta')).toBeVisible({ timeout: 20000 });
    await expect(page.locator('button', { hasText: 'Sí, enviar enlace' })).toBeVisible();
    await expect(page.locator('button', { hasText: 'No, usar otro correo' })).toBeVisible();

    // Elegir "usar otro correo" cierra el modal y regresa el foco al correo
    await page.locator('button', { hasText: 'No, usar otro correo' }).click();
    await expect(page.locator('text=Ya existe una cuenta')).toHaveCount(0);
    await expect(page.locator('input[type="email"]')).toBeFocused();
  });
});