const { expect } = require('@playwright/test');
const { vet, api } = require('../qa.config.js');

async function loginVet(page) {
  await page.goto('/login.html');
  await page.fill('#email-input', vet.email);
  await page.fill('#password-input', vet.password);
  await Promise.all([
    page.waitForURL(/index\.html/),
    page.click('#loginBtn'),
  ]);
  await expect(page.locator('#nombreClinica')).not.toHaveText(/Cargando clínica/, { timeout: 20000 });
  await expect(page.locator('#userName')).not.toHaveText('Cargando...', { timeout: 20000 });
}

async function getVetToken() {
  const res = await fetch(`${api.supabaseUrl}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { apikey: api.anonKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: vet.email, password: vet.password }),
  });
  const data = await res.json();
  if (!data.access_token) throw new Error('No se pudo obtener token del vet: ' + JSON.stringify(data));
  return data.access_token;
}

async function fetchClienteConMascotas() {
  const token = await getVetToken();
  const headers = { Authorization: `Bearer ${token}` };

  const resMascotas = await fetch(`${api.baseURL}/api/mascotas`, { headers });
  const mascotas = await resMascotas.json();
  const mascota = (mascotas || []).find(m => m.id_cliente);
  if (!mascota) throw new Error('No hay mascotas registradas en la clínica de prueba');

  const resCliente = await fetch(`${api.baseURL}/api/clientes/${mascota.id_cliente}`, { headers });
  const cliente = await resCliente.json();
  if (!cliente || !cliente.id) throw new Error('No se pudo obtener el cliente del dueño de la mascota');
  return cliente;
}

async function seleccionarClienteYMascota(page) {
  const cliente = await fetchClienteConMascotas();
  await page.fill('#buscarCliente', cliente.nombre);
  const sugerencia = page.locator('#listaSugerencias .dropdown-item').first();
  await expect(sugerencia).toBeVisible({ timeout: 20000 });
  await sugerencia.click();
  await page.waitForFunction(() => {
    const sel = document.querySelector('#selectMascotasAsociadas');
    return sel && sel.options.length > 1;
  }, { timeout: 20000 });
  await page.selectOption('#selectMascotasAsociadas', { index: 1 });
  return cliente;
}

async function fetchArticuloVenta(omitirId) {
  const token = await getVetToken();
  const res = await fetch(`${api.baseURL}/api/stock_disponible`, { headers: { Authorization: `Bearer ${token}` } });
  const data = await res.json();
  const lista = data.data || data || [];
  const art = lista.find(a => a.sku && a.precio_venta && a.id !== omitirId) || lista.find(a => a.sku && a.precio_venta);
  if (!art) throw new Error('No hay artículos disponibles para la venta');
  return art;
}

async function agregarArticuloPorSugerencia(page, termino) {
  await page.fill('#buscar-articulo-venta', termino);
  const sugerencia = page.locator('#lista-sugerencias-venta button').first();
  await expect(sugerencia).toBeVisible({ timeout: 15000 });
  await sugerencia.click();
}

async function procesarVentaEnEfectivo(page, montoEfectivo = '100') {
  await page.fill('#monto-efectivo', montoEfectivo);
  await expect(page.locator('#btn-procesar-venta')).toBeEnabled({ timeout: 10000 });
  const [resp] = await Promise.all([
    page.waitForResponse(r => r.url().includes('/api/ventas/procesar') && r.request().method() === 'POST'),
    page.click('#btn-procesar-venta'),
  ]);
  const data = await resp.json();
  const folio = data.folio || data.id_venta;
  if (!folio) throw new Error('La API no devolvió folio de venta: ' + JSON.stringify(data));
  return folio;
}

module.exports = {
  loginVet, getVetToken, fetchClienteConMascotas,
  seleccionarClienteYMascota, fetchArticuloVenta, agregarArticuloPorSugerencia, procesarVentaEnEfectivo,
};