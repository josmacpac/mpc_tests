const { expect } = require('@playwright/test');
const { clientes } = require('../qa.config.js');

async function loginCliente(page) {
  await page.goto('/login');
  await page.fill('input[type="email"]', clientes.email);
  await page.fill('input[type="password"]', clientes.password);
  await Promise.all([
    page.waitForURL(
      (url) => url.pathname === '/' || url.pathname === '/clinicas',
      { timeout: 25000 }
    ),
    page.click('button[type="submit"]'),
  ]);
}

module.exports = { loginCliente };