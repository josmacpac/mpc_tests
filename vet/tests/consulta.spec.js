const { test, expect } = require('@playwright/test');
const { loginVet, fetchClienteConMascotas, seleccionarClienteYMascota } = require('../helpers.js');

test.describe('Registrar consulta con receta', () => {
  test('guarda una consulta y su receta', async ({ page }) => {
    await loginVet(page);
    await page.goto('/consulta.html');

    const cliente = await fetchClienteConMascotas();

    // 1. Buscar y seleccionar el cliente
    await page.fill('#buscarCliente', cliente.nombre);
    const sugerencia = page.locator('#listaSugerencias .dropdown-item').first();
    await expect(sugerencia).toBeVisible({ timeout: 20000 });
    await sugerencia.click();

    await page.waitForFunction(() => {
      const sel = document.querySelector('#selectMascotasAsociadas');
      return sel && sel.options.length > 1;
    }, { timeout: 20000 });
    await page.selectOption('#selectMascotasAsociadas', { index: 1 });

    // 2. Signos vitales y motivo
    await page.fill('#cPeso', '12.5');
    await page.fill('#cTemp', '38.5');
    await page.fill('#cFC', '90');
    await page.selectOption('#cMotivo', { index: 1 });
    await page.fill('#cNotas', 'Consulta de prueba automatizada.');
    await page.fill('#cDiagnostico', 'Control general.');

    // 3. Veterinario (requerido)
    await page.selectOption('#selectVeterinario', { index: 1 });

    // 4. Habilitar receta y llenar el renglón de medicamento
    await page.check('#toggleReceta');
    await page.fill('.fila-medicamento .input-medicamento', 'Medicamento QA');
    await page.fill('.fila-medicamento .input-cantidad', '2');
    await page.fill('.fila-medicamento .input-dosis', '1/2 tableta');
    await page.fill('.fila-medicamento .input-periodicidad', 'Cada 12 horas');
    await page.fill('.fila-medicamento .input-duracion', 'Por 7 días');

    // 5. Guardar (el botón está fuera del <form>, dispara enviarConsulta())
    await page.click('button[onclick="enviarConsulta()"]');

    // 6. Swal de confirmación (ofrece imprimir receta)
    await expect(page.locator('.swal2-title')).toHaveText('Consulta finalizada', { timeout: 20000 });
    await expect(page.locator('.swal2-html-container')).toContainText('¿Desea imprimir la receta?');
    await page.click('.swal2-cancel');

    // 7. El formulario se resetea al terminar
    await expect(page.locator('#buscarCliente')).toHaveValue('', { timeout: 20000 });
  });

  test('muestra advertencia si no hay mascota seleccionada', async ({ page }) => {
    await loginVet(page);
    await page.goto('/consulta.html');

    await page.click('button[onclick="enviarConsulta()"]');

    await expect(page.locator('.swal2-title')).toHaveText('Atención', { timeout: 10000 });
    await expect(page.locator('.swal2-html-container')).toContainText('Debes seleccionar una mascota.');
  });

  test('exige completar la receta antes de guardar', async ({ page }) => {
    await loginVet(page);
    await page.goto('/consulta.html');

    await seleccionarClienteYMascota(page);
    await page.selectOption('#selectVeterinario', { index: 1 });

    // Receta activada pero sin dosis/periodicidad/duración
    await page.check('#toggleReceta');
    await page.fill('.fila-medicamento .input-medicamento', 'Medicamento incompleto');

    await page.click('button[onclick="enviarConsulta()"]');

    await expect(page.locator('.swal2-title')).toHaveText('Receta incompleta', { timeout: 10000 });
    await expect(page.locator('.swal2-html-container')).toContainText('medicamento(s) sin completar');
  });

  test('guarda una consulta con receta de dos medicamentos', async ({ page }) => {
    await loginVet(page);
    await page.goto('/consulta.html');

    await seleccionarClienteYMascota(page);

    await page.fill('#cPeso', '10.2');
    await page.fill('#cTemp', '38.6');
    await page.fill('#cFC', '88');
    await page.selectOption('#cMotivo', { index: 1 });
    await page.fill('#cNotas', 'Consulta con dos medicamentos.');
    await page.fill('#cDiagnostico', 'Control general.');
    await page.selectOption('#selectVeterinario', { index: 1 });

    await page.check('#toggleReceta');

    // Renglón 1
    await page.fill('.fila-medicamento .input-medicamento >> nth=0', 'Medicamento A');
    await page.fill('.fila-medicamento .input-cantidad >> nth=0', '1');
    await page.fill('.fila-medicamento .input-dosis >> nth=0', '1 tableta');
    await page.fill('.fila-medicamento .input-periodicidad >> nth=0', 'Cada 24 horas');
    await page.fill('.fila-medicamento .input-duracion >> nth=0', 'Por 5 días');

    // Renglón 2 (nuevo)
    await page.click('button[onclick="agregarFilaMedicamento()"]');
    await expect(page.locator('.fila-medicamento')).toHaveCount(2);
    await page.fill('.fila-medicamento .input-medicamento >> nth=1', 'Medicamento B');
    await page.fill('.fila-medicamento .input-cantidad >> nth=1', '2');
    await page.fill('.fila-medicamento .input-dosis >> nth=1', '1/2 tableta');
    await page.fill('.fila-medicamento .input-periodicidad >> nth=1', 'Cada 8 horas');
    await page.fill('.fila-medicamento .input-duracion >> nth=1', 'Por 3 días');

    await page.click('button[onclick="enviarConsulta()"]');

    await expect(page.locator('.swal2-title')).toHaveText('Consulta finalizada', { timeout: 20000 });
    await expect(page.locator('.swal2-html-container')).toContainText('¿Desea imprimir la receta?');
    await page.click('.swal2-cancel');
    await expect(page.locator('#buscarCliente')).toHaveValue('', { timeout: 20000 });
  });

  test('imprime la receta en una nueva ventana', async ({ page }) => {
    await loginVet(page);
    await page.goto('/consulta.html');

    await seleccionarClienteYMascota(page);
    await page.selectOption('#selectVeterinario', { index: 1 });
    await page.check('#toggleReceta');
    await page.fill('.fila-medicamento .input-medicamento', 'Medicamento QA');
    await page.fill('.fila-medicamento .input-cantidad', '1');
    await page.fill('.fila-medicamento .input-dosis', '1 tableta');
    await page.fill('.fila-medicamento .input-periodicidad', 'Cada 24 horas');
    await page.fill('.fila-medicamento .input-duracion', 'Por 7 días');

    // Guardar y aceptar imprimir → abre una ventana nueva con la receta
    const [popup] = await Promise.all([
      page.waitForEvent('popup', { timeout: 30000 }),
      (async () => {
        await page.click('button[onclick="enviarConsulta()"]');
        await expect(page.locator('.swal2-title')).toHaveText('Consulta finalizada', { timeout: 20000 });
        await page.click('.swal2-confirm');
      })(),
    ]);

    await popup.waitForLoadState('domcontentloaded', { timeout: 15000 });
    await expect(popup.locator('body')).toContainText('Receta Médica', { timeout: 15000 });
    await expect(popup.locator('body')).toContainText('Medicamento QA');
    await expect(popup.locator('body')).toContainText('Prescripción Médica');
  });
});