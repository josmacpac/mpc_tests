const { test, expect } = require('@playwright/test');
const { loginVet } = require('../helpers.js');

test.describe('Módulo de clientes', () => {
  test('crea un nuevo cliente y aparece en la tabla', async ({ page }) => {
    await loginVet(page);
    await page.goto('/clientes');

    const nombreUnico = `Cliente QA ${Date.now()}`;

    await page.click('#btnAgregarCliente');
    await expect(page.locator('#modalAgregarCliente')).toHaveClass(/show/);

    await page.fill('#nombre_cliente', nombreUnico);
    await page.fill('#telefono', String(3000000000 + Math.floor(Math.random() * 899999999)));
    await page.fill('#email', `qa${Date.now()}@y3n.store`);
    await page.fill('#direccion', 'Calle QA #123, Chihuahua');

    await page.click('#formAgregarCliente button[type="submit"]');

    await expect(page.locator('#modalOpcionesAceptacion')).toHaveClass(/show/, { timeout: 20000 });
    await expect(page.locator('#tituloExito')).toHaveText('¡Cliente registrado!');
    await page.click('#btn-cerrar-exito');
    await expect(page.locator('#modalOpcionesAceptacion')).not.toHaveClass(/show/);

    await page.fill('#inputBuscarCliente', nombreUnico);
    await expect(page.locator('#tablaClientes tbody')).toContainText(nombreUnico, { timeout: 15000 });
  });
});