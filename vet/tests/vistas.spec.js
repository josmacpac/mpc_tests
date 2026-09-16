const { test, expect } = require('@playwright/test');
const { loginVet, waitForPageReady } = require('../helpers.js');

const vistas = [
  { url: 'citas.html',  elemento: '#filtroFecha' },
  { url: 'reportes.html', elemento: '#nombreClinica' },
  { url: 'clientes.html', elemento: '#nombreClinica' },
  { url: 'articulos.html', elemento: '#nombreClinica' },
];

test.describe('Vistas del panel vet', () => {
  for (const v of vistas) {
    test(`carga la vista ${v.url}`, async ({ page }) => {
      await loginVet(page);
      await page.goto(v.url);
      await waitForPageReady(page);
      await expect(page).toHaveURL(new RegExp(`vet/${v.url.replace('.html', '')}`));
      await expect(page.locator('#nombreClinica')).toContainText('Clinica_pruebas2', { timeout: 20000 });
      if (v.elemento) {
        await expect(page.locator(v.elemento).first()).toBeVisible({ timeout: 20000 });
      }
    });
  }
});
