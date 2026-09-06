const { test, expect, request } = require('@playwright/test');
const { vet, api } = require('../../qa.config.js');

// ---------------------------------------------------------------------------
// Helpers para tests de API de inventario
// ---------------------------------------------------------------------------

async function getToken() {
  const ctx = await request.newContext();
  const res = await ctx.post(`${api.supabaseUrl}/auth/v1/token?grant_type=password`, {
    headers: { apikey: api.anonKey, 'Content-Type': 'application/json' },
    data: { email: vet.email, password: vet.password },
  });
  const data = await res.json();
  expect(data.access_token).toBeTruthy();
  return { token: data.access_token, ctx };
}

function ts() { return Date.now(); }

async function crearArticulo(ctx, token, overrides = {}) {
  const id = ts();
  const body = {
    sku: `SKU-FEFO-${id}`,
    nombre_articulo: `Art FEFO ${id}`,
    presentacion: '4',
    categoria_articulo: '507',
    contenido_empaque: 1,
    precio_venta: 100,
    stock_minimo: 5,
    inventario_inicial: 0,
    ...overrides,
  };
  const res = await ctx.post(`${api.baseURL}/api/articulos`, {
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    data: body,
  });
  expect(res.ok()).toBeTruthy();
  const data = await res.json();
  return { ...body, id: data.data?.id || data.id, response: data };
}

async function crearEntrada(ctx, token, articuloId, cantidad, lote, caducidad) {
  const res = await ctx.post(`${api.baseURL}/api/entradas`, {
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    data: {
      cabecera: {
        id_proveedor: null,
        no_factura: `FAC-${ts()}`,
        total_factura: 0,
        fecha_compra: new Date().toISOString().slice(0, 10),
      },
      items: [{
        articulo_id: articuloId,
        cantidad,
        costo_unitario: 50,
        lote,
        fecha_caducidad: caducidad,
      }],
    },
  });
  return { ok: res.ok(), status: res.status(), data: await res.json() };
}

async function procesarVenta(ctx, token, articulo, cantidad, total) {
  const res = await ctx.post(`${api.baseURL}/api/ventas/procesar`, {
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    data: {
      carrito: [{
        id: articulo.id,
        nombre_articulo: articulo.nombre_articulo,
        cantidad,
        precio_venta: articulo.precio_venta,
      }],
      id_cliente: 1,
      pago_efectivo: total,
      pago_tarjeta: 0,
      total_venta: total,
    },
  });
  return { ok: res.ok(), status: res.status(), data: await res.json() };
}

async function getStock(ctx, token, articuloId) {
  const res = await ctx.get(`${api.baseURL}/api/stock_disponible`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  const lista = data.data || data || [];
  return lista.find(a => a.id === articuloId);
}

async function getLotes(ctx, token, articuloId) {
  const res = await ctx.get(`${api.baseURL}/api/existencias/lotes/${articuloId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  return data.data || data || [];
}

async function registrarDesperdicio(ctx, token, idArticulo, idExistencia, cantidad) {
  const res = await ctx.post(`${api.baseURL}/api/desperdicio`, {
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    data: {
      id_articulo: idArticulo,
      id_existencia: idExistencia,
      cantidad,
      motivo: 'Producto Caducado',
      motivo_general: 'Reporte de Merma / Desperdicio',
    },
  });
  return { ok: res.ok(), status: res.status(), data: await res.json() };
}

// ---------------------------------------------------------------------------
// Tests de lógica FEFO y rechazo de stock
// ---------------------------------------------------------------------------

test.describe('API — Lógica FEFO y control de stock', () => {

  test('FEFO: consume lote más antiguo primero', async () => {
    const { token, ctx } = await getToken();

    // 1. Crear artículo
    const art = await crearArticulo(ctx, token);
    expect(art.id).toBeTruthy();

    // 2. Entrada 1: lote antiguo (caduca antes)
    const loteAntiguo = `LOTE-ANT-${ts()}`;
    const e1 = await crearEntrada(ctx, token, art.id, 10, loteAntiguo, '2026-12-31');
    expect(e1.ok).toBeTruthy();

    // 3. Entrada 2: lote nuevo (caduca después)
    const loteNuevo = `LOTE-NUEVO-${ts()}`;
    const e2 = await crearEntrada(ctx, token, art.id, 10, loteNuevo, '2027-06-30');
    expect(e2.ok).toBeTruthy();

    // 4. Procesar venta de 15 (cruza ambos lotes: 10 del antiguo + 5 del nuevo)
    const venta = await procesarVenta(ctx, token, art, 15, 1500);
    expect(venta.ok).toBeTruthy();
    expect(venta.data.status).toBe('success');

    // 5. Verificar lotes
    const lotes = await getLotes(ctx, token, art.id);
    expect(lotes.length).toBeGreaterThanOrEqual(2);

    const loteA = lotes.find(l => l.lote === loteAntiguo || l.no_lote === loteAntiguo);
    const loteN = lotes.find(l => l.lote === loteNuevo || l.no_lote === loteNuevo);

    // El lote antiguo debe estar agotado
    if (loteA) {
      const stockA = loteA.cantidad_actual ?? loteA.stock ?? 0;
      expect(stockA).toBe(0);
    }

    // El lote nuevo debe tener 5 unidades restantes
    if (loteN) {
      const stockN = loteN.cantidad_actual ?? loteN.stock ?? 0;
      expect(stockN).toBe(5);
    }
  });

  test('rechaza venta que excede stock total', async () => {
    const { token, ctx } = await getToken();

    // 1. Crear artículo
    const art = await crearArticulo(ctx, token);

    // 2. Entrada con 5 unidades
    await crearEntrada(ctx, token, art.id, 5, `LOTE-RECHAZO-${ts()}`, '2027-12-31');

    // 3. Verificar stock
    const stock1 = await getStock(ctx, token, art.id);
    const total1 = stock1?.vista_articulos_disponibles?.total_stock || stock1?.total_stock || 0;
    expect(total1).toBe(5);

    // 4. Intentar vender 10 (excede stock)
    const venta = await procesarVenta(ctx, token, art, 10, 1000);
    expect(venta.ok).toBeFalsy();
    expect(venta.status).toBe(400);

    // 5. Verificar que el stock no cambió
    const stock2 = await getStock(ctx, token, art.id);
    const total2 = stock2?.vista_articulos_disponibles?.total_stock || stock2?.total_stock || 0;
    expect(total2).toBe(total1);
  });

  test('rechaza desperdicio que excede stock del lote', async () => {
    const { token, ctx } = await getToken();

    // 1. Crear artículo
    const art = await crearArticulo(ctx, token);

    // 2. Entrada con 3 unidades
    await crearEntrada(ctx, token, art.id, 3, `LOTE-DESP-RECHAZO-${ts()}`, '2027-12-31');

    // 3. Obtener lotes para sacar el id_existencia
    const lotes = await getLotes(ctx, token, art.id);
    expect(lotes.length).toBeGreaterThan(0);
    const lote = lotes[0];
    const idExistencia = lote.id_existencia ?? lote.id ?? lote.existencia_id;

    // 4. Intentar desperdiciar 10 (excede stock de 3)
    if (idExistencia) {
      const desp = await registrarDesperdicio(ctx, token, art.id, idExistencia, 10);
      expect(desp.ok).toBeFalsy();

      // 5. Verificar que el stock no cambió
      const stock = await getStock(ctx, token, art.id);
      const total = stock?.vista_articulos_disponibles?.total_stock || stock?.total_stock || 0;
      expect(total).toBe(3);
    }
  });
});
