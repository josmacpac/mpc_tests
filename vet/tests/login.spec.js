const { test, expect } = require('@playwright/test');
const { loginVet } = require('../helpers.js');

test.describe('Login del panel vet', () => {
  test('login correcto redirige al dashboard', async ({ page }) => {
    await loginVet(page);
    await expect(page).toHaveURL(/index\.html/);
    await expect(page.locator('#btnLogout')).toHaveCount(1);
  });

  test('login con credenciales invalidas muestra error y se queda en login', async ({ page }) => {
    await page.goto('/login.html');
    await page.fill('#email-input', 'noexiste@y3n.store');
    await page.fill('#password-input', 'incorrecta');
    await page.click('#loginBtn');
    await expect(page).toHaveURL(/login\.html/);
  });
});