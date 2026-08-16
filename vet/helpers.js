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

module.exports = { loginVet, getVetToken, fetchClienteConMascotas };