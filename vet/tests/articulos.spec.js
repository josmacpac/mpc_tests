const { test, expect } = require('@playwright/test');
const { loginVet, waitForPageReady, fetchCrearArticulo, fetchArticulos, articuloTEST } = require('../helpers.js');

test.describe('Módulo de artículos (CRUD)', () => {

  test('lista artículos y verifica que la tabla carga', async ({ page }) => {
    await loginVet(page);
    await page.goto('articulos.html');
    await waitForPageReady(page);

    const tabla = page.locator('#tablaArticulos');
    await expect(tabla).toBeVisible({ timeout: 20000 });
    await page.waitForFunction(() => document.querySelectorAll('#tablaArticulos tr').length > 0, { timeout: 15000 });
    const filas = await tabla.locator('tr').count();
    expect(filas).toBeGreaterThan(0);
  });

  test('busca artículo por nombre en la tabla', async ({ page }) => {
    await loginVet(page);
    await page.goto('articulos.html');
    await waitForPageReady(page);
    await expect(page.locator('#tablaArticulos')).toBeVisible({ timeout: 20000 });

    // Crear artículo temporal vía API para buscarlo
    const art = articuloTEST();
    await fetchCrearArticulo(art);

    // Recargar la tabla después de crear vía API
    await page.goto('articulos.html');
    await waitForPageReady(page);
    await page.waitForFunction(() => document.querySelectorAll('#tablaArticulos tr').length > 0, { timeout: 15000 });

    await page.fill('#input-busqueda', art.nombre_articulo);
    await page.waitForTimeout(1000);

    const tabla = page.locator('#tablaArticulos');
    await expect(tabla).toContainText(art.nombre_articulo, { timeout: 10000 });
  });

  test('crea artículo nuevo con inventario inicial', async ({ page }) => {
    await loginVet(page);
    await page.goto('articulos.html');
    await waitForPageReady(page);
    await expect(page.locator('#tablaArticulos')).toBeVisible({ timeout: 20000 });

    const art = articuloTEST();

    // Abrir modal de alta
    await page.click('button[data-bs-target="#modalAltaArticulo"]');
    await expect(page.locator('#modalAltaArticulo')).toHaveClass(/show/, { timeout: 10000 });

    // Llenar formulario
    await page.fill('#modalAltaArticulo input[name="sku"]', art.sku);
    await page.fill('#modalAltaArticulo input[name="nombre_articulo"]', art.nombre_articulo);
    await page.selectOption('#modalAltaArticulo select[name="presentacion"]', art.presentacion);
    await page.selectOption('#modalAltaArticulo select[name="categoria_articulo"]', art.categoria_articulo);
    await page.fill('#modalAltaArticulo input[name="contenido_empaque"]', art.contenido_empaque);
    await page.fill('#modalAltaArticulo input[name="precio_venta"]', art.precio_venta);
    await page.fill('#modalAltaArticulo input[name="stock_minimo"]', art.stock_minimo);

    // Enviar formulario
    await page.click('#modalAltaArticulo button[type="submit"]');

    // Verificar SweetAlert de éxito
    await expect(page.locator('.swal2-title')).toHaveText(/éxito|excelente|creado|registrado/i, { timeout: 15000 });
    await page.click('.swal2-confirm');

    // Recargar tabla para reflejar el artículo nuevo
    await page.goto('articulos.html');
    await waitForPageReady(page);
    await page.waitForFunction(() => document.querySelectorAll('#tablaArticulos tr').length > 0, { timeout: 15000 });

    // Verificar que aparece en la tabla
    await page.fill('#input-busqueda', art.sku);
    await page.waitForTimeout(1000);
    await expect(page.locator('#tablaArticulos')).toContainText(art.sku, { timeout: 10000 });
  });

  test('rechaza SKU duplicado', async ({ page }) => {
    await loginVet(page);
    await page.goto('articulos.html');
    await waitForPageReady(page);
    await expect(page.locator('#tablaArticulos')).toBeVisible({ timeout: 20000 });

    const art = articuloTEST();
    await fetchCrearArticulo(art);

    // Intentar crear otro con el mismo SKU
    await page.click('button[data-bs-target="#modalAltaArticulo"]');
    await expect(page.locator('#modalAltaArticulo')).toHaveClass(/show/, { timeout: 10000 });

    await page.fill('#modalAltaArticulo input[name="sku"]', art.sku);
    await page.fill('#modalAltaArticulo input[name="nombre_articulo"]', 'Duplicado');
    await page.selectOption('#modalAltaArticulo select[name="presentacion"]', '4');
    await page.selectOption('#modalAltaArticulo select[name="categoria_articulo"]', '507');
    await page.fill('#modalAltaArticulo input[name="contenido_empaque"]', '1');
    await page.fill('#modalAltaArticulo input[name="precio_venta"]', '100');
    await page.fill('#modalAltaArticulo input[name="stock_minimo"]', '1');

    await page.click('#modalAltaArticulo button[type="submit"]');

    // Debe mostrar error (SweetAlert o mensaje de error)
    await expect(page.locator('.swal2-popup')).toBeVisible({ timeout: 10000 });
    const swalTitle = await page.locator('.swal2-title').textContent();
    const swalHtml = await page.locator('.swal2-html-container').textContent().catch(() => '');
    const esError = /error|duplicado|existe|registrado|problema/i.test(swalTitle + ' ' + swalHtml) ||
                    await page.locator('.swal2-icon-error').isVisible();
    expect(esError).toBeTruthy();
  });

  test('edita artículo existente', async ({ page }) => {
    await loginVet(page);
    await page.goto('articulos.html');
    await waitForPageReady(page);
    await expect(page.locator('#tablaArticulos')).toBeVisible({ timeout: 20000 });

    // Crear artículo vía API
    const art = articuloTEST();
    await fetchCrearArticulo(art);

    // Recargar la tabla después de crear vía API
    await page.goto('articulos.html');
    await waitForPageReady(page);
    await page.waitForFunction(() => document.querySelectorAll('#tablaArticulos tr').length > 0, { timeout: 15000 });

    // Buscar en la tabla
    await page.fill('#input-busqueda', art.sku);
    await page.waitForTimeout(1000);

    // Click en editar (botón con data-sku o similar)
    const fila = page.locator('#tablaArticulos tr', { hasText: art.sku });
    await expect(fila).toBeVisible({ timeout: 10000 });
    await fila.locator('button[data-bs-target="#modalEditarArticulo"]').click();
    await expect(page.locator('#modalEditarArticulo')).toHaveClass(/show/, { timeout: 10000 });

    // Cambiar nombre
    const nuevoNombre = `Editado QA ${Date.now()}`;
    await page.fill('#modalEditarArticulo #edit-articulo', nuevoNombre);
    await page.click('#modalEditarArticulo button[type="submit"]');

    // Verificar éxito
    await expect(page.locator('.swal2-popup')).toBeVisible({ timeout: 15000 });
    const editTitle = await page.locator('.swal2-title').textContent();
    const editHtml = await page.locator('.swal2-html-container').textContent().catch(() => '');
    expect((editTitle + ' ' + editHtml)).toMatch(/éxito|actualizado|guardado|correctamente|aviso/i);
    await page.click('.swal2-confirm');

    // Verificar en tabla
    await page.fill('#input-busqueda', art.sku);
    await page.waitForTimeout(1000);
    await expect(page.locator('#tablaArticulos')).toContainText(nuevoNombre, { timeout: 10000 });
  });

  test('elimina artículo', async ({ page }) => {
    await loginVet(page);
    await page.goto('articulos.html');
    await waitForPageReady(page);
    await expect(page.locator('#tablaArticulos')).toBeVisible({ timeout: 20000 });

    // Crear artículo vía API
    const art = articuloTEST();
    await fetchCrearArticulo(art);

    // Recargar la tabla después de crear vía API
    await page.goto('articulos.html');
    await waitForPageReady(page);
    await page.waitForFunction(() => document.querySelectorAll('#tablaArticulos tr').length > 0, { timeout: 15000 });

    // Buscar en la tabla
    await page.fill('#input-busqueda', art.sku);
    await page.waitForTimeout(1000);

    const fila = page.locator('#tablaArticulos tr', { hasText: art.sku });
    await expect(fila).toBeVisible({ timeout: 10000 });

    // Click en eliminar
    await fila.locator('button[onclick*="confirmarEliminar"]').click();

    // SweetAlert de confirmación
    await expect(page.locator('.swal2-title')).toBeVisible({ timeout: 10000 });
    await page.click('.swal2-confirm');

    // Esperar SweetAlert "¡Eliminado!" y que se cierre solo
    await expect(page.locator('.swal2-title')).toHaveText(/eliminado/i, { timeout: 10000 });
    await page.waitForFunction(() => !document.querySelector('.swal2-popup') || getComputedStyle(document.querySelector('.swal2-popup')).display === 'none', { timeout: 10000 });

    // Recargar la tabla
    await page.goto('articulos.html');
    await waitForPageReady(page);
    await page.waitForFunction(() => document.querySelectorAll('#tablaArticulos tr').length > 0, { timeout: 15000 });

    // Verificar que desaparece de la tabla
    await page.fill('#input-busqueda', art.sku);
    await page.waitForTimeout(1000);
    const filas = await page.locator('#tablaArticulos tr', { hasText: art.sku }).count();
    expect(filas).toBe(0);
  });
});
