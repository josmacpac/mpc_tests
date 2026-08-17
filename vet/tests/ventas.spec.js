const { test, expect } = require('@playwright/test');
const { loginVet, fetchArticuloVenta, agregarArticuloPorSugerencia, procesarVentaEnEfectivo } = require('../helpers.js');

test.describe('Módulo de ventas', () => {

  test('agrega un artículo al carrito desde las sugerencias y muestra totales', async ({ page }) => {
    await loginVet(page);
    await page.goto('/ventas.html');

    const art = await fetchArticuloVenta();
    await agregarArticuloPorSugerencia(page, art.nombre_articulo);

    const fila = page.locator('#tabla-ventas-body tr', { hasText: art.nombre_articulo });
    await expect(fila).toBeVisible();
    await expect(page.locator('#fila-vacia-venta')).toHaveCount(0);
    await expect(page.locator('#lbl-subtotal-venta')).not.toHaveText('$0.00');
    await expect(page.locator('#lbl-total-venta')).not.toHaveText('$0.00');
  });

  test('agrega un artículo al carrito escribiendo su SKU y presionando Enter', async ({ page }) => {
    await loginVet(page);
    await page.goto('/ventas.html');

    const art = await fetchArticuloVenta();
    await page.fill('#buscar-articulo-venta', art.sku);
    await page.keyboard.press('Enter');

    await expect(page.locator('#tabla-ventas-body')).toContainText(art.sku, { timeout: 10000 });
    await expect(page.locator('#tabla-ventas-body')).toContainText(art.nombre_articulo);
  });

  test('cambia cantidades y elimina artículos del carrito', async ({ page }) => {
    await loginVet(page);
    await page.goto('/ventas.html');

    const artA = await fetchArticuloVenta();
    const artB = await fetchArticuloVenta(artA.id);

    await agregarArticuloPorSugerencia(page, artA.nombre_articulo);
    await agregarArticuloPorSugerencia(page, artB.nombre_articulo);
    await expect(page.locator('#tabla-ventas-body tr')).toHaveCount(2);

    const filaA = page.locator('#tabla-ventas-body tr', { hasText: artA.nombre_articulo });

    // +1 → cantidad 2
    await filaA.locator('button[onclick*=", 1)"]').click();
    await expect(filaA.locator('input[readonly]')).toHaveValue('2');

    // −1 → cantidad 1
    await filaA.locator('button[onclick*=", -1)"]').click();
    await expect(filaA.locator('input[readonly]')).toHaveValue('1');

    // Eliminar artículo A → solo queda B
    await filaA.locator('button[onclick*="eliminarDelCarrito"]').click();
    await expect(page.locator('#tabla-ventas-body tr', { hasText: artA.nombre_articulo })).toHaveCount(0);
    await expect(page.locator('#tabla-ventas-body')).toContainText(artB.nombre_articulo);
  });

  test('procesa una venta en efectivo y muestra el modal de recibo con QR', async ({ page }) => {
    await loginVet(page);
    await page.goto('/ventas.html');

    const art = await fetchArticuloVenta();
    await agregarArticuloPorSugerencia(page, art.nombre_articulo);

    // Pagar de más en efectivo para que calcule cambio
    await page.fill('#monto-efectivo', '100');
    await expect(page.locator('#btn-procesar-venta')).toBeEnabled({ timeout: 10000 });

    const [resp] = await Promise.all([
      page.waitForResponse(r => r.url().includes('/api/ventas/procesar') && r.request().method() === 'POST'),
      page.click('#btn-procesar-venta'),
    ]);
    const data = await resp.json();
    expect(data.status).toBe('success');
    expect(data.folio || data.id_venta).toBeTruthy();

    // Modal de recibo
    await expect(page.locator('.swal2-title')).toHaveText('¡Venta Procesada Exitosamente!', { timeout: 15000 });
    await expect(page.locator('.swal2-html-container')).toContainText('CAMBIO A ENTREGAR');
    await expect(page.locator('#btn-swal-whatsapp')).toBeVisible();
    await expect(page.locator('#modal-qrcode canvas, #modal-qrcode img').first()).toBeVisible();

    // "Nueva Venta (Limpiar)" vacía el carrito
    await page.locator('.swal2-confirm').click();
    await expect(page.locator('#tabla-ventas-body')).toContainText('El carrito está vacío', { timeout: 10000 });
  });

  test('el recibo digital se abre por folio y muestra el ticket', async ({ page }) => {
    await loginVet(page);
    await page.goto('/ventas.html');

    const art = await fetchArticuloVenta();
    await agregarArticuloPorSugerencia(page, art.nombre_articulo);

    const folio = await procesarVentaEnEfectivo(page, '100');
    await page.locator('.swal2-confirm').click();

    await page.goto(`/recibo_venta.html?folio=${folio}`);
    await expect(page.locator('#ticket-folio')).toContainText(folio, { timeout: 15000 });
    await expect(page.locator('#ticket-items-body tr')).toHaveCount(1);
    await expect(page.locator('#ticket-items-body')).toContainText(art.nombre_articulo);
    await expect(page.locator('#ticket-total')).not.toHaveText('$0.00');
    await expect(page.locator('#clinica-nombre')).not.toHaveText('Clínica Veterinaria');
  });
});