const { test, expect } = require('@playwright/test');
const { loginVet, fetchClienteConMascotas } = require('../helpers.js');

function fechaFutura(dias = 2) {
  const d = new Date();
  d.setDate(d.getDate() + dias);
  return d.toISOString().slice(0, 10);
}

async function seleccionarClienteYMascota(page, nombre) {
  for (let intento = 0; intento < 4; intento++) {
    await page.fill('#modalCita #buscarCliente', nombre);
    const item = page.locator('#modalCita #listaSugerencias .dropdown-item').first();
    const visible = await item
      .waitFor({ state: 'visible', timeout: 6000 })
      .then(() => true)
      .catch(() => false);

    if (visible) {
      try {
        await item.click({ timeout: 8000 });
        await page.waitForFunction(() => {
          const sel = document.querySelector('#modalCita #selectMascotasAsociadas');
          return sel && sel.options.length > 1;
        }, { timeout: 10000 });
        await page.selectOption('#modalCita #selectMascotasAsociadas', { index: 1 });
        return;
      } catch (e) {
        // El dropdown se re-renderizó a mitad del clic; reintentar
      }
    }
    await page.waitForTimeout(1500);
  }
  throw new Error('No se pudo seleccionar cliente y mascota en el modal de cita');
}

test.describe('Módulo de citas', () => {
  test('agenda una nueva cita (skip si no hay horarios configurados)', async ({ page }) => {
    await loginVet(page);
    await page.goto('/citas');

    const cliente = await fetchClienteConMascotas();
    const nombreMascota = cliente.mascotas[0].nombre_mascota;

    await page.click('button[data-bs-target="#modalCita"]');
    await expect(page.locator('#modalCita')).toHaveClass(/show/);

    // Esperar a que terminen de cargar los datos iniciales (servicios) para
    // evitar la carrera del buscador (los handlers filtran antes de cargar).
    await page.waitForFunction(() => {
      const sel = document.querySelector('#selectServicioCita');
      return sel && sel.options.length > 1;
    }, { timeout: 15000 });

    // 1. Buscar y seleccionar el cliente (con reintentos ante la carrera del buscador)
    await seleccionarClienteYMascota(page, cliente.nombre);
    await expect(page.locator('#modalCita #selectMascotasAsociadas option:checked')).toHaveText(new RegExp(nombreMascota));

    // 2. Fecha futura → cargan veterinarios disponibles
    await page.fill('#fechaCitaInput', fechaFutura());
    await page.waitForFunction(() => {
      const sel = document.querySelector('#selectVeterinarioCita');
      if (!sel) return false;
      const opts = [...sel.options];
      return opts.length > 0 && opts[0].textContent !== 'Primero seleccione una fecha...';
    }, { timeout: 15000 });

    const vets = await page.$$eval('#selectVeterinarioCita option', os => os.map(o => o.value));
    if (!vets.some(Boolean)) {
      test.skip(true, 'No hay veterinarios/horarios configurados en la clínica (tabla horarios_veterinarios vacía)');
    }
    await page.selectOption('#selectVeterinarioCita', { index: 1 });

    // 3. Servicio
    await page.selectOption('#selectServicioCita', { index: 1 });

    // 4. Horario disponible
    await page.waitForFunction(() => {
      const sel = document.querySelector('#selectHorarioCita');
      return sel && !sel.disabled && sel.options.length > 1;
    }, { timeout: 15000 });

    const horarios = await page.$$eval('#selectHorarioCita option', os => os.map(o => o.value));
    if (!horarios.some(Boolean)) {
      test.skip(true, 'El veterinario/servicio no tiene horarios disponibles para la fecha elegida');
    }
    await page.selectOption('#selectHorarioCita', { index: 1 });

    // 5. Guardar
    await page.click('#formCita button[type="submit"]');
    await expect(page.locator('.swal2-title')).toHaveText('¡Cita Agendada!', { timeout: 15000 });
  });
});