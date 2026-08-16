const { expect } = require('@playwright/test');
const { vet } = require('../qa.config.js');

async function loginVet(page) {
  await page.goto('/login.html');
  await page.fill('#email-input', vet.email);
  await page.fill('#password-input', vet.password);
  await Promise.all([
    page.waitForURL(/index\.html/),
    page.click('#loginBtn'),
  ]);
  await expect(page.locator('#nombreClinica')).not.toHaveText(/Cargando clínica/, { timeout: 20000 });
  await expect(page.locator('#userName')).not.toHaveText('Cargando...', { timeout: 20000 });
}

module.exports = { loginVet };