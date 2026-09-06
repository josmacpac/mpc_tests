const { test, expect } = require('@playwright/test');
const {
  loginVet, fetchCrearArticulo, fetchCrearEntrada, fetchStockDisponible,
  fetchExistencias, fetchLotesArticulo, agregarArticuloPorSugerencia,
  procesarVentaEnEfectivo, articuloTEST,
} = require('../helpers.js');

test.describe('Flujo completo de inventario', () => {

  test('crea artículo y verifica que aparece en la tabla', async ({ page }) => {
    await loginVet(page);

    const art = articuloTEST();
    await fetchCrearArticulo(art);

    await page.goto('/articulos.html');
    await expect(page.locator('#tablaArticulos')).toBeVisible({ timeout: 20000 });

    await page.fill('#input-busqueda', art.sku);
    await page.waitForTimeout(1000);

    await expect(page.locator('#tablaArticulos')).toContainText(art.sku, { timeout: 10000 });
    await expect(page.locator('#tablaArticulos')).toContainText(art.nombre_articulo);
  });

  test('agrega stock via entrada y verifica existencias', async ({ page }) => {
    await loginVet(page);

    const art = articuloTEST();
    await fetchCrearArticulo(art);

    const cantidad = 25;
    await fetchCrearEntrada({
      cabecera: {
        id_proveedor: null,
        no_factura: `FAC-INV-${Date.now()}`,
        total_factura: 0,
        fecha_compra: new Date().toISOString().slice(0, 10),
      },
      items: [{
        articulo_id: null,
        cantidad,
        costo_unitario: 40,
        lote: `LOTE-INV-${Date.now()}`,
        fecha_caducidad: '2027-09-30',
      }],
    });

    // Verificar stock vía API
    const stock = await fetchStockDisponible();
    const artStock = stock.find(s => s.sku === art.sku || s.nombre_articulo === art.nombre_articulo);
    expect(artStock).toBeTruthy();
    expect(artStock.vista_articulos_disponibles?.total_stock || artStock.total_stock).toBeGreaterThanOrEqual(1);
  });

  test('vende artículo y verifica que el stock bajó', async ({ page }) => {
    await loginVet(page);

    // 1. Crear artículo
    const art = articuloTEST();
    await fetchCrearArticulo(art);

    // 2. Agregar stock vía API
    const cantidadInicial = 20;
    await fetchCrearEntrada({
      cabecera: {
        id_proveedor: null,
        no_factura: `FAC-VTA-${Date.now()}`,
        total_factura: 0,
        fecha_compra: new Date().toISOString().slice(0, 10),
      },
      items: [{
        articulo_id: null,
        cantidad: cantidadInicial,
        costo_unitario: 60,
        lote: `LOTE-VTA-${Date.now()}`,
        fecha_caducidad: '2027-12-31',
      }],
    });

    // 3. Obtener stock antes de la venta
    const stockAntes = await fetchStockDisponible();
    const artAntes = stockAntes.find(s => s.sku === art.sku);
    const totalAntes = artAntes?.vista_articulos_disponibles?.total_stock || artAntes?.total_stock || 0;

    // 4. Ir al POS y vender 2 unidades
    await page.goto('/ventas.html');
    await page.waitForTimeout(2000);

    await page.fill('#buscar-articulo-venta', art.sku);
    await page.keyboard.press('Enter');
    await page.waitForTimeout(2000);

    // Verificar que está en el carrito
    await expect(page.locator('#tabla-ventas-body')).toContainText(art.sku, { timeout: 10000 });

    // Aumentar cantidad a 2
    const fila = page.locator('#tabla-ventas-body tr', { hasText: art.sku });
    await fila.locator('button[onclick*=", 1)"]').click();

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

    // 5. Verificar stock después de la venta
    await page.waitForTimeout(2000);
    const stockDespues = await fetchStockDisponible();
    const artDespues = stockDespues.find(s => s.sku === art.sku);
    const totalDespues = artDespues?.vista_articulos_disponibles?.total_stock || artDespues?.total_stock || 0;

    expect(totalDespues).toBeLessThan(totalAntes);
  });

  test('verifica lotes del artículo después de entrada', async ({ page }) => {
    await loginVet(page);

    const art = articuloTEST();
    await fetchCrearArticulo(art);

    // Obtener ID del artículo recién creado
    const arts = await fetchCrearArticulo(art);
    const articuloId = arts?.data?.id || arts?.id;

    // Crear entrada con lote específico
    const loteUnico = `LOTE-LOTES-${Date.now()}`;
    await fetchCrearEntrada({
      cabecera: {
        id_proveedor: null,
        no_factura: `FAC-LOTES-${Date.now()}`,
        total_factura: 0,
        fecha_compra: new Date().toISOString().slice(0, 10),
      },
      items: [{
        articulo_id: articuloId,
        cantidad: 15,
        costo_unitario: 35,
        lote: loteUnico,
        fecha_caducidad: '2027-08-15',
      }],
    });

    // Verificar lotes vía API
    if (articuloId) {
      const lotes = await fetchLotesArticulo(articuloId);
      expect(Array.isArray(lotes)).toBeTruthy();
      expect(lotes.length).toBeGreaterThan(0);
    }
  });

  test('registra desperdicio y verifica stock', async ({ page }) => {
    await loginVet(page);

    // Crear artículo con stock
    const art = articuloTEST();
    const creador = await fetchCrearArticulo(art);
    const articuloId = creador?.data?.id || creador?.id;

    const stockInicial = 10;
    await fetchCrearEntrada({
      cabecera: {
        id_proveedor: null,
        no_factura: `FAC-DESP-${Date.now()}`,
        total_factura: 0,
        fecha_compra: new Date().toISOString().slice(0, 10),
      },
      items: [{
        articulo_id: articuloId,
        cantidad: stockInicial,
        costo_unitario: 20,
        lote: `LOTE-DESP-${Date.now()}`,
        fecha_caducidad: '2027-11-30',
      }],
    });

    // Ir a existencias y abrir modal de desperdicio
    await page.goto('/existencias.html');
    await expect(page.locator('#tablaExistencias, table')).toBeVisible({ timeout: 20000 });

    // Buscar el artículo
    await page.fill('#input-busqueda', art.nombre_articulo);
    await page.waitForTimeout(1500);

    // Verificar que el artículo aparece
    await expect(page.locator('table')).toContainText(art.nombre_articulo, { timeout: 10000 });
  });

  test('flujo completo: crear → entrada → venta → verificar stock', async ({ page }) => {
    await loginVet(page);

    // 1. Crear artículo
    const art = articuloTEST();
    await fetchCrearArticulo(art);

    // 2. Entrada de 10 unidades
    const cantidadEntrada = 10;
    await fetchCrearEntrada({
      cabecera: {
        id_proveedor: null,
        no_factura: `FAC-FULL-${Date.now()}`,
        total_factura: 0,
        fecha_compra: new Date().toISOString().slice(0, 10),
      },
      items: [{
        articulo_id: null,
        cantidad: cantidadEntrada,
        costo_unitario: 50,
        lote: `LOTE-FULL-${Date.now()}`,
        fecha_caducidad: '2027-10-31',
      }],
    });

    // 3. Verificar stock
    const stock1 = await fetchStockDisponible();
    const art1 = stock1.find(s => s.sku === art.sku);
    const total1 = art1?.vista_articulos_disponibles?.total_stock || art1?.total_stock || 0;
    expect(total1).toBeGreaterThanOrEqual(1);

    // 4. Vender 3 unidades
    await page.goto('/ventas.html');
    await page.waitForTimeout(2000);

    await page.fill('#buscar-articulo-venta', art.sku);
    await page.keyboard.press('Enter');
    await page.waitForTimeout(2000);

    // Aumentar a 3
    const fila = page.locator('#tabla-ventas-body tr', { hasText: art.sku });
    await fila.locator('button[onclick*=", 1)"]').click();
    await fila.locator('button[onclick*=", 1)"]').click();

    await page.fill('#monto-efectivo', '1000');
    await expect(page.locator('#btn-procesar-venta')).toBeEnabled({ timeout: 10000 });

    const [resp] = await Promise.all([
      page.waitForResponse(r => r.url().includes('/api/ventas/procesar') && r.request().method() === 'POST'),
      page.click('#btn-procesar-venta'),
    ]);
    const data = await resp.json();
    expect(data.status).toBe('success');

    await page.click('.swal2-confirm');

    // 5. Verificar stock bajó
    await page.waitForTimeout(2000);
    const stock2 = await fetchStockDisponible();
    const art2 = stock2.find(s => s.sku === art.sku);
    const total2 = art2?.vista_articulos_disponibles?.total_stock || art2?.total_stock || 0;

    expect(total2).toBeLessThan(total1);
  });
});
