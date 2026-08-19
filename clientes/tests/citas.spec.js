const { test, expect } = require('@playwright/test');
const { loginCliente } = require('../helpers.js');

function toISO(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dia = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dia}`;
}

async function elegirFechaConVeterinarios(page, vetSelect) {
  const hoy = new Date();
  for (let i = 1; i <= 7; i++) {
    const iso = toISO(new Date(hoy.getTime() + i * 24 * 3600 * 1000));
    await page.locator('input[type="date"]').fill(iso);
    await expect(vetSelect).toBeEnabled({ timeout: 15000 });
    const conVets = await vetSelect.locator('option:not([disabled])').count();
    if (conVets > 0) return conVets;
  }
  return 0;
}

async function seleccionarPrimeraOpcionHabilitada(select) {
  const opt = select.locator('option:not([disabled])').first();
  const value = await opt.getAttribute('value');
  await select.selectOption(value);
}

test.describe('Citas del portal de clientes', () => {
  test('lista de citas carga y permite agendar', async ({ page }) => {
    await loginCliente(page);
    await page.locator('nav').locator('text=Citas').click();
    await expect(page.locator('h1', { hasText: 'Mis Citas' })).toBeVisible({ timeout: 20000 });
    await expect(page.locator('text=Agendar nueva cita')).toBeVisible();
  });

  test('agendar cita muestra el modal de confirmación con los detalles', async ({ page }) => {
    await loginCliente(page);
    await page.locator('nav').locator('text=Citas').click();
    await page.locator('text=Agendar nueva cita').click();
    await expect(page).toHaveURL(/\/citas\/nueva/);

    await page.locator('select').nth(0).selectOption({ label: 'Firulais QA' });
    await page.locator('select').nth(1).selectOption({ index: 1 }); // primer servicio

    const vetSelect = page.locator('select').nth(2);
    const conVets = await elegirFechaConVeterinarios(page, vetSelect);
    if (conVets === 0) {
      test.skip(true, 'No hay veterinarios disponibles en los próximos 7 días');
      return;
    }
    await seleccionarPrimeraOpcionHabilitada(vetSelect);

    const horaSelect = page.locator('select').nth(3);
    await expect(horaSelect).toBeEnabled({ timeout: 15000 });
    const conHoras = await horaSelect.locator('option:not([disabled])').count();
    if (conHoras === 0) {
      test.skip(true, 'No hay horarios disponibles para la combinación elegida');
      return;
    }
    await seleccionarPrimeraOpcionHabilitada(horaSelect);

    await page.locator('button[type="submit"]').click();
    // Modal de confirmación
    const modal = page.locator('div.bg-white.rounded-3xl');
    await expect(modal.locator('text=Confirmar cita').first()).toBeVisible({ timeout: 10000 });
    await expect(modal.locator('text=Firulais QA').first()).toBeVisible();
    await page.locator('button', { hasText: 'Confirmar cita' }).last().click();
    await expect(page).toHaveURL(/\/citas$/, { timeout: 15000 });
  });
});