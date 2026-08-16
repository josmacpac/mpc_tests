const { expect } = require('@playwright/test');
const { admin } = require('../qa.config.js');

async function loginAdmin(page) {
  await page.goto('/');
  await page.fill('#email', admin.email);
  await page.fill('#pass', admin.password);
  await page.click('#loginBtn');
  await expect(page.locator('h2', { hasText: 'dadas de alta' })).toBeVisible({ timeout: 20000 });
}

module.exports = { loginAdmin };