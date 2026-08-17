const { test, expect } = require('@playwright/test');
const { loginAdmin } = require('../helpers.js');

test.describe('Busqueda y alta de usuarios (admin)', () => {

  test('tabla de clinicas: busca y lista en orden alfabetico', async ({ page }) => {
    await loginAdmin(page);

    const filas = page.locator('#tbClinicas tr:visible');
    const countInicial = await filas.count();
    expect(countInicial).toBeGreaterThan(0);

    const nombres = await filas.locator('td:nth-child(2)').allTextContents();
    const ordenados = [...nombres].sort((a, b) => a.localeCompare(b, 'es'));
    expect(nombres).toEqual(ordenados);

    await page.fill('#buscarClinica', 'Clinica Demo');
    await expect(filas).toHaveCount(1);
    await expect(filas.first()).toContainText('Clinica Demo');

    await page.fill('#buscarClinica', 'zzz-no-existe');
    await expect(filas).toHaveCount(0);

    await page.fill('#buscarClinica', '');
    await expect(filas).toHaveCount(countInicial);
  });

  test('tabla de usuarios: busca y lista en orden alfabetico', async ({ page }) => {
    await loginAdmin(page);
    await page.click('a[data-view="usuarios"]');

    const filas = page.locator('#tbUsuarios tr:visible');
    await expect(filas.first()).toBeVisible({ timeout: 15000 });
    const countInicial = await filas.count();

    const nombres = await filas.locator('td:nth-child(1)').allTextContents();
    const ordenados = [...nombres].sort((a, b) => a.localeCompare(b, 'es'));
    expect(nombres).toEqual(ordenados);

    const primerNombre = nombres[0];
    await page.fill('#buscarUsuario', primerNombre);
    const coincidencias = await filas.count();
    expect(coincidencias).toBeGreaterThanOrEqual(1);
    expect(coincidencias).toBeLessThan(countInicial);
    const visibles = await filas.allTextContents();
    for (const texto of visibles) {
      expect(texto).toContain(primerNombre);
    }

    await page.fill('#buscarUsuario', 'zzz-no-existe');
    await expect(filas).toHaveCount(0);
  });

  test('agrega un usuario ligado a la Clinica Demo', async ({ page }) => {
    await loginAdmin(page);
    await page.click('a[data-view="usuarios"]');

    await page.click('#toggleFormUsuario');
    await expect(page.locator('#formNuevoUsuario')).toBeVisible();

    const opciones = await page.locator('#nu_clinica option').allTextContents();
    expect(opciones).toContain('Clinica Demo');

    const unico = Date.now();
    await page.fill('#nu_nombre', `QA Alta ${unico}`);
    await page.fill('#nu_email', `qa_alta_${unico}@y3n.store`);
    await page.fill('#nu_pass', 'Pass_test_2026');
    await page.selectOption('#nu_clinica', { label: 'Clinica Demo' });

    await page.click('#btnCrearUsuario');
    await expect(page.locator('#msgNuevoUsuario')).toContainText('clínica #4', { timeout: 20000 });

    const fila = page.locator('#tbUsuarios tr', { hasText: `qa_alta_${unico}@y3n.store` });
    await expect(fila).toBeVisible({ timeout: 15000 });
    await expect(fila).toContainText('Clinica Demo');
    await expect(fila).toContainText('QA Alta');
  });
});