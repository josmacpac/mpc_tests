const { test, expect } = require('@playwright/test');
const { loginAdmin } = require('../helpers.js');

test.describe('Login del panel admin', () => {
  test('login correcto muestra la vista de clinicas', async ({ page }) => {
    await loginAdmin(page);
    await expect(page.locator('h2', { hasText: 'dadas de alta' })).toBeVisible();
    await expect(page.locator('table').first()).toBeVisible();
  });

  test('login con credenciales invalidas se queda en login', async ({ page }) => {
    await page.goto('/');
    await page.fill('#email', 'nadie@y3n.store');
    await page.fill('#pass', 'incorrecta');
    await page.click('#loginBtn');
    await expect(page.locator('#loginBtn')).toBeVisible();
  });
});