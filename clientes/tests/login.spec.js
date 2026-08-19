const { test, expect } = require('@playwright/test');
const { loginCliente } = require('../helpers.js');

test.describe('Login del portal de clientes', () => {
  test('login correcto lleva al home con la clínica activa', async ({ page }) => {
    await loginCliente(page);
    await expect(page).toHaveURL(/\/$/);
    await expect(page.locator('h2', { hasText: 'Tus mascotas' })).toBeVisible({ timeout: 20000 });
  });

  test('credenciales inválidas muestran error y se queda en login', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'noexiste@y3n.store');
    await page.fill('input[type="password"]', 'incorrecta123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/login/);
    await expect(page.locator('text=Correo o contraseña incorrectos')).toBeVisible({ timeout: 15000 });
  });
});