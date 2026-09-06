const { test, expect } = require('@playwright/test');
const { loginVet, fetchCrearArticulo, fetchArticulos, articuloTEST } = require('../helpers.js');

test.describe('Módulo de artículos (CRUD)', () => {

  test('lista artículos y verifica que la tabla carga', async ({ page }) => {
    await loginVet(page);
    await page.goto('/articulos.html');

    const tabla = page.locator('#tablaArticulos');
    await expect(tabla).toBeVisible({ timeout: 20000 });
    const filas = await tabla.locator('tr').count();
    expect(filas).toBeGreaterThan(0);
  });

  test('busca artículo por nombre en la tabla', async ({ page }) => {
    await loginVet(page);
    await page.goto('/articulos.html');
    await expect(page.locator('#tablaArticulos')).toBeVisible({ timeout: 20000 });

    // Crear artículo temporal vía API para buscarlo
    const art = articuloTEST();
    await fetchCrearArticulo(art);

    await page.fill('#input-busqueda', art.nombre_articulo);
    await page.waitForTimeout(1000);

    const tabla = page.locator('#tablaArticulos');
    await expect(tabla).toContainText(art.nombre_articulo, { timeout: 10000 });
  });

  test('crea artículo nuevo con inventario inicial', async ({ page }) => {
    await loginVet(page);
    await page.goto('/articulos.html');
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
    await expect(page.locator('.swal2-title')).toHaveText(/éxito|creado|registrado/i, { timeout: 15000 });
    await page.click('.swal2-confirm');

    // Verificar que aparece en la tabla
    await page.fill('#input-busqueda', art.sku);
    await page.waitForTimeout(1000);
    await expect(page.locator('#tablaArticulos')).toContainText(art.sku, { timeout: 10000 });
  });

  test('rechaza SKU duplicado', async ({ page }) => {
    await loginVet(page);
    await page.goto('/articulos.html');
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
    const errorVisible = await page.locator('.swal2-title').isVisible({ timeout: 10000 });
    const errorText = errorVisible ? await page.locator('.swal2-title').textContent() : '';
    const esError = /error|duplicado|existe|registrado/i.test(errorText) ||
                    await page.locator('.swal2-html-container').isVisible();
    expect(esError).toBeTruthy();
  });

  test('edita artículo existente', async ({ page }) => {
    await loginVet(page);
    await page.goto('/articulos.html');
    await expect(page.locator('#tablaArticulos')).toBeVisible({ timeout: 20000 });

    // Crear artículo vía API
    const art = articuloTEST();
    await fetchCrearArticulo(art);

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
    await expect(page.locator('.swal2-title')).toHaveText(/éxito|actualizado|guardado/i, { timeout: 15000 });
    await page.click('.swal2-confirm');

    // Verificar en tabla
    await page.fill('#input-busqueda', art.sku);
    await page.waitForTimeout(1000);
    await expect(page.locator('#tablaArticulos')).toContainText(nuevoNombre, { timeout: 10000 });
  });

  test('elimina artículo', async ({ page }) => {
    await loginVet(page);
    await page.goto('/articulos.html');
    await expect(page.locator('#tablaArticulos')).toBeVisible({ timeout: 20000 });

    // Crear artículo vía API
    const art = articuloTEST();
    await fetchCrearArticulo(art);

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

    // Verificar que desaparece de la tabla
    await page.waitForTimeout(2000);
    await page.fill('#input-busqueda', art.sku);
    await page.waitForTimeout(1000);
    const filas = await page.locator('#tablaArticulos tr', { hasText: art.sku }).count();
    expect(filas).toBe(0);
  });
});
