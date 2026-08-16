const { test, expect } = require('@playwright/test');
const { loginVet } = require('../helpers.js');

const vistas = [
  { url: '/citas',  elemento: '#filtroFecha' },
  { url: '/reportes', elemento: '#nombreClinica' },
  { url: '/clientes', elemento: '#nombreClinica' },
  { url: '/articulos', elemento: '#nombreClinica' },
];

test.describe('Vistas del panel vet', () => {
  for (const v of vistas) {
    test(`carga la vista ${v.url}`, async ({ page }) => {
      await loginVet(page);
      await page.goto(v.url);
      await expect(page).toHaveURL(new RegExp(`${v.url}$`));
      await expect(page.locator('#nombreClinica')).toContainText('Clinica Demo', { timeout: 20000 });
      if (v.elemento) {
        await expect(page.locator(v.elemento).first()).toBeVisible({ timeout: 20000 });
      }
    });
  }
});