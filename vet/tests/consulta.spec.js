const { test, expect } = require('@playwright/test');
const { loginVet, fetchClienteConMascotas } = require('../helpers.js');

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
});