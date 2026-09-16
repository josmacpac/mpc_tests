const { test, expect } = require('@playwright/test');
const {
  loginVet, waitForPageReady, fetchCrearArticulo, fetchCrearEntrada, fetchStockDisponible,
  fetchExistencias, fetchLotesArticulo, agregarArticuloPorSugerencia,
  procesarVentaEnEfectivo, articuloTEST, fetchArticuloVenta, getStockTotal,
} = require('../helpers.js');

test.describe('Flujo completo de inventario', () => {

  test('crea artículo y verifica que aparece en la tabla', async ({ page }) => {
    await loginVet(page);

    const art = articuloTEST();
    await fetchCrearArticulo(art);

    // Recargar tabla después de crear vía API
    await page.goto('articulos.html');
    await waitForPageReady(page);
    await page.waitForFunction(() => document.querySelectorAll('#tablaArticulos tr').length > 0, { timeout: 15000 });

    await page.fill('#input-busqueda', art.sku);
    await page.waitForTimeout(1000);

    await expect(page.locator('#tablaArticulos')).toContainText(art.sku, { timeout: 10000 });
    await expect(page.locator('#tablaArticulos')).toContainText(art.nombre_articulo);
  });

  test('verifica existencias de un artículo con stock', async ({ page }) => {
    await loginVet(page);

    // Usar un artículo existente que ya tenga stock en la vista
    const art = await fetchArticuloVenta();
    expect(art).toBeTruthy();
    expect(art.sku).toBeTruthy();

    // Verificar vía API que tiene stock
    const stock = await fetchStockDisponible();
    const artStock = stock.find(s => s.sku === art.sku);
    expect(artStock).toBeTruthy();
    const totalStock = getStockTotal(artStock);
    expect(totalStock).toBeGreaterThanOrEqual(1);
  });

  test('vende artículo y verifica que el stock bajó', async ({ page }) => {
    await loginVet(page);

    // Usar artículo existente con stock
    const art = await fetchArticuloVenta();

    // Obtener stock antes
    const stockAntes = await fetchStockDisponible();
    const artAntes = stockAntes.find(s => s.sku === art.sku);
    const totalAntes = getStockTotal(artAntes);
    expect(totalAntes).toBeGreaterThanOrEqual(2);

    // Ir al POS y vender 1 unidad
    await page.goto('ventas.html');
    await waitForPageReady(page);
    await page.waitForTimeout(2000);

    await page.fill('#buscar-articulo-venta', art.sku);
    await page.keyboard.press('Enter');
    await page.waitForTimeout(2000);

    // Verificar que está en el carrito
    await expect(page.locator('#tabla-ventas-body')).toContainText(art.sku, { timeout: 10000 });

    // Procesar venta en efectivo
    await page.fill('#monto-efectivo', '500');
    await expect(page.locator('#btn-procesar-venta')).toBeEnabled({ timeout: 10000 });

    const [resp] = await Promise.all([
      page.waitForResponse(r => r.url().includes('/api/ventas/procesar') && r.request().method() === 'POST'),
      page.click('#btn-procesar-venta'),
    ]);
    const data = await resp.json();
    expect(data.status).toBe('success');

    // Cerrar modal
    await expect(page.locator('.swal2-title')).toHaveText(/exitosamente/i, { timeout: 15000 });
    await page.click('.swal2-confirm');

    // Verificar stock después
    await page.waitForTimeout(2000);
    const stockDespues = await fetchStockDisponible();
    const artDespues = stockDespues.find(s => s.sku === art.sku);
    const totalDespues = getStockTotal(artDespues);

    expect(totalDespues).toBeLessThan(totalAntes);
  });

  test('verifica lotes del artículo existente', async ({ page }) => {
    await loginVet(page);

    const art = await fetchArticuloVenta();
    expect(art).toBeTruthy();

    const lotes = await fetchLotesArticulo(art.id);
    expect(Array.isArray(lotes)).toBeTruthy();
    expect(lotes.length).toBeGreaterThan(0);
  });

  test('verificar existencias desde la interfaz', async ({ page }) => {
    await loginVet(page);

    // Ir a existencias y verificar que la tabla carga
    await page.goto('existencias.html');
    await waitForPageReady(page);
    await page.waitForFunction(() => document.querySelectorAll('#tablaExistencias tr').length > 0, { timeout: 20000 });

    // Verificar que hay artículos en la tabla
    const filas = await page.locator('#tablaExistencias tr').count();
    expect(filas).toBeGreaterThan(0);
  });

  test('flujo completo: vender artículo existente y verificar stock', async ({ page }) => {
    await loginVet(page);

    // 1. Obtener artículo existente con stock
    const art = await fetchArticuloVenta();

    // 2. Verificar stock
    const stock1 = await fetchStockDisponible();
    const art1 = stock1.find(s => s.sku === art.sku);
    const total1 = getStockTotal(art1);
    expect(total1).toBeGreaterThanOrEqual(2);

    // 3. Vender 1 unidad
    await page.goto('ventas.html');
    await waitForPageReady(page);
    await page.waitForTimeout(2000);

    await page.fill('#buscar-articulo-venta', art.sku);
    await page.keyboard.press('Enter');
    await page.waitForTimeout(2000);

    await page.fill('#monto-efectivo', '500');
    await expect(page.locator('#btn-procesar-venta')).toBeEnabled({ timeout: 10000 });

    const [resp] = await Promise.all([
      page.waitForResponse(r => r.url().includes('/api/ventas/procesar') && r.request().method() === 'POST'),
      page.click('#btn-procesar-venta'),
    ]);
    const data = await resp.json();
    expect(data.status).toBe('success');

    await page.click('.swal2-confirm');

    // 4. Verificar stock bajó
    await page.waitForTimeout(2000);
    const stock2 = await fetchStockDisponible();
    const art2 = stock2.find(s => s.sku === art.sku);
    const total2 = getStockTotal(art2);

    expect(total2).toBeLessThan(total1);
  });
});
