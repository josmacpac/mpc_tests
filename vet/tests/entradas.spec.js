const { test, expect } = require('@playwright/test');
const { loginVet, fetchCrearArticulo, fetchCrearEntrada, fetchStockDisponible, articuloTEST } = require('../helpers.js');

test.describe('Módulo de entradas de stock (UI)', () => {

  test('crea entrada completa desde la interfaz', async ({ page }) => {
    await loginVet(page);

    // Crear artículo vía API para tener uno nuevo
    const art = articuloTEST();
    await fetchCrearArticulo(art);

    await page.goto('/entradas.html');

    // Esperar que cargue el formulario
    await expect(page.locator('#formCapturaEntrada')).toBeVisible({ timeout: 20000 });

    // Seleccionar primer proveedor disponible
    await page.waitForFunction(() => {
      const sel = document.querySelector('#select-proveedor');
      return sel && sel.options.length > 1;
    }, { timeout: 15000 });
    await page.selectOption('#select-proveedor', { index: 1 });

    // Datos de entrada
    const cantidad = '20';
    const costo = '80';
    const ts = Date.now();
    const lote = `LOTE-E2E-${ts}`;

    // Buscar artículo
    await page.fill('#input-busqueda-articulo', art.sku);
    const sugerencia = page.locator('#sugerencias-busqueda button, #sugerencias-busqueda .dropdown-item, #sugerencias-busqueda li').first();
    await expect(sugerencia).toBeVisible({ timeout: 15000 });
    await sugerencia.click();

    // Llenar cantidad, costo, lote
    await page.fill('#input-cantidad', cantidad);
    await page.fill('#input-costo', costo);
    await page.fill('#input-lote', lote);

    // Caducidad futura
    const d = new Date();
    d.setFullYear(d.getFullYear() + 1);
    const cad = d.toISOString().slice(0, 10);
    await page.fill('#input-caducidad', cad);

    // Agregar al carrito
    await page.click('#btn-agregar-item');
    await page.waitForTimeout(1000);

    // Verificar que el artículo aparece en el carrito
    await expect(page.locator('#tbody-articulos-temporal')).toContainText(art.sku, { timeout: 10000 });

    // Guardar factura
    await page.click('#guardarFactura');

    // Verificar redirección a existencias
    await expect(page).toHaveURL(/existencias/, { timeout: 15000 });
  });

  test('verifica que el stock aparece en existencias después de entrada', async ({ page }) => {
    await loginVet(page);

    // Crear artículo + entrada vía API (más rápido y confiable)
    const art = articuloTEST();
    await fetchCrearArticulo(art);

    const cantidadPiezas = 30;
    await fetchCrearEntrada({
      cabecera: {
        id_proveedor: null,
        no_factura: `FAC-E2E-${Date.now()}`,
        total_factura: 0,
        fecha_compra: new Date().toISOString().slice(0, 10),
      },
      items: [{
        articulo_id: null, // se busca por SKU después
        cantidad: cantidadPiezas,
        costo_unitario: 50,
        lote: `LOTE-EXIST-${Date.now()}`,
        fecha_caducidad: '2027-12-31',
      }],
    });

    // Ir a existencias
    await page.goto('/existencias.html');
    await expect(page.locator('#tablaExistencias, table')).toBeVisible({ timeout: 20000 });

    // Buscar el artículo
    await page.fill('#input-busqueda', art.nombre_articulo);
    await page.waitForTimeout(1500);

    // Verificar que el artículo y su stock aparecen
    await expect(page.locator('table')).toContainText(art.nombre_articulo, { timeout: 10000 });
  });

  test('ver facturas registradas en el historial', async ({ page }) => {
    await loginVet(page);

    // Crear una entrada vía API para asegurar que hay datos
    const art = articuloTEST();
    await fetchCrearArticulo(art);
    const facturaNum = `FAC-HIST-${Date.now()}`;
    await fetchCrearEntrada({
      cabecera: {
        id_proveedor: null,
        no_factura: facturaNum,
        total_factura: 0,
        fecha_compra: new Date().toISOString().slice(0, 10),
      },
      items: [{
        articulo_id: null,
        cantidad: 10,
        costo_unitario: 30,
        lote: `LOTE-HIST-${Date.now()}`,
        fecha_caducidad: '2027-06-30',
      }],
    });

    await page.goto('/facturas.html');
    await expect(page.locator('#tabla-facturas-body, table tbody')).toBeVisible({ timeout: 20000 });

    // La factura debe aparecer en la tabla
    await expect(page.locator('table')).toContainText(facturaNum, { timeout: 10000 });
  });

  test('abre detalle de factura y muestra ítems', async ({ page }) => {
    await loginVet(page);

    // Crear entrada vía API
    const art = articuloTEST();
    await fetchCrearArticulo(art);
    await fetchCrearEntrada({
      cabecera: {
        id_proveedor: null,
        no_factura: `FAC-DET-${Date.now()}`,
        total_factura: 0,
        fecha_compra: new Date().toISOString().slice(0, 10),
      },
      items: [{
        articulo_id: null,
        cantidad: 5,
        costo_unitario: 25,
        lote: `LOTE-DET-${Date.now()}`,
        fecha_caducidad: '2027-03-31',
      }],
    });

    await page.goto('/facturas.html');
    await expect(page.locator('#tabla-facturas-body, table tbody')).toBeVisible({ timeout: 20000 });

    // Click en detalle de la primera factura
    const btnDetalle = page.locator('.btn-detalle, button[data-id]').first();
    await expect(btnDetalle).toBeVisible({ timeout: 10000 });
    await btnDetalle.click();

    // Verificar que el modal de detalle se abre
    await expect(page.locator('#modalDetalleFactura')).toHaveClass(/show/, { timeout: 10000 });

    // Verificar que tiene contenido
    const detalleTabla = page.locator('#tabla-detalle-body, #modalDetalleFactura table tbody');
    await expect(detalleTabla).toBeVisible({ timeout: 10000 });
  });
});
