// E2E temporal del flujo "Escanear cartilla con IA" (issue #6).
// Se corre con: node e2e-cartilla.tmp.cjs   (desde mpc_tests/)
const { chromium } = require('playwright')
const { readFileSync } = require('node:fs')

const env = {}
for (const linea of readFileSync('./environments/local.env', 'utf8').split('\n')) {
  const m = linea.match(/^([A-Z0-9_]+)=(.*)$/)
  if (m) env[m[1]] = m[2]
}

const BASE = 'http://localhost/app-clientes/'
// Foto de prueba (cartilla sintética con sticker); se puede sobreescribir con CARTILLA_FOTO.
const FOTO = process.env.CARTILLA_FOTO || '/tmp/opencode/cartilla_teste.jpg'
const pasos = []
const ok = (nombre) => { pasos.push(`PASS  ${nombre}`); console.log(`PASS  ${nombre}`) }
const fail = (nombre, detalle) => {
  pasos.push(`FAIL  ${nombre} :: ${detalle}`)
  console.log(`FAIL  ${nombre} :: ${detalle}`)
}

;(async () => {
  const browser = await chromium.launch()
  const page = await browser.newPage()
  const erroresConsola = []
  page.on('console', (msg) => { if (msg.type() === 'error') erroresConsola.push(msg.text()) })
  page.on('pageerror', (e) => erroresConsola.push(String(e)))

  try {
    // 1. Login
    await page.goto(BASE + 'login', { waitUntil: 'domcontentloaded' })
    await page.fill('input[type="email"]', env.CLIENTE_EMAIL)
    await page.fill('input[type="password"]', env.CLIENTE_PASSWORD)
    await Promise.all([
      page.waitForURL((u) => u.pathname === '/' || u.pathname === '/app-clientes/', { timeout: 25000 }),
      page.click('button[type="submit"]'),
    ])
    ok('login')

    // 2. Ir a Mascotas y abrir el perfil de la primera mascota
    await page.locator('nav button', { hasText: 'Mascotas' }).click()
    const tarjeta = page.locator('ul li > button').first()
    await tarjeta.waitFor({ timeout: 15000 })
    await tarjeta.click()
    ok('detalle de mascota abierto')

    // 3. Botón "Escanear cartilla con IA" (debe quedar sobre los acordeones)
    const botonCartilla = page.getByRole('button', { name: 'Escanear cartilla con IA' })
    await botonCartilla.waitFor({ timeout: 15000 })
    const cajaCartilla = await botonCartilla.boundingBox()
    const cajaAcordeon = await page.getByRole('button', { name: 'Consultas médicas' }).boundingBox()
    if (!cajaCartilla || !cajaAcordeon) throw new Error('no se pudo medir la posición del botón')
    if (cajaCartilla.y >= cajaAcordeon.y) {
      throw new Error(`botón muy abajo: cartilla y=${Math.round(cajaCartilla.y)} >= acordeón y=${Math.round(cajaAcordeon.y)}`)
    }
    ok(`botón encima del acordeón (y=${Math.round(cajaCartilla.y)} < ${Math.round(cajaAcordeon.y)})`)
    await botonCartilla.click()
    await page.getByText('Cartilla de vacunación', { exact: true }).waitFor({ timeout: 10000 })
    ok('vista CartillaIAView abierta')

    // 4. Subir la foto de la cartilla y analizar
    await page.locator('input[type="file"][aria-label*="cartilla"]').setInputFiles(FOTO)
    const analizar = page.getByRole('button', { name: 'Analizar cartilla con IA' })
    await analizar.waitFor({ timeout: 10000 })
    await analizar.click()
    await page.getByText('Datos detectados para').waitFor({ timeout: 60000 })
    ok('análisis IA con resultado')

    // 5. Acciones de confirmación
    await page.getByRole('button', { name: 'Aceptar', exact: true }).waitFor({ timeout: 5000 })
    await page.getByRole('button', { name: 'Intentar de nuevo' }).waitFor({ timeout: 5000 })
    await page.getByRole('button', { name: 'Cancelar', exact: true }).waitFor({ timeout: 5000 })
    const sello = await page.getByText('Sello o firma').isVisible()
    if (!sello) throw new Error('falta la fila "Sello o firma"')
    ok('confirmación con Aceptar / Intentar de nuevo / Cancelar')

    // 6. "Intentar de nuevo" vuelve a la captura
    await page.getByRole('button', { name: 'Intentar de nuevo' }).click()
    await page.getByRole('button', { name: 'Analizar cartilla con IA' }).waitFor({ timeout: 10000 })
    ok('intentar de nuevo limpia y permite re-analizar')

    // 7. Re-analizar y Aceptar
    await page.locator('input[type="file"][aria-label*="cartilla"]').setInputFiles(FOTO)
    await page.getByRole('button', { name: 'Analizar cartilla con IA' }).click()
    await page.getByText('Datos detectados para').waitFor({ timeout: 60000 })
    await page.getByRole('button', { name: 'Aceptar', exact: true }).click()
    await page.getByText('Datos confirmados').waitFor({ timeout: 10000 })
    ok('aceptar confirma los datos')

    // 8. Volver al perfil
    await page.getByRole('button', { name: 'Volver al perfil' }).last().click()
    await page.getByRole('button', { name: 'Escanear cartilla con IA' }).waitFor({ timeout: 10000 })
    ok('vuelve al perfil')

    const erroresRelevantes = erroresConsola.filter((t) => !t.includes('favicon'))
    if (erroresRelevantes.length) fail('consola sin errores', erroresRelevantes.join(' | '))
    else ok('consola sin errores')
  } catch (e) {
    fail('flujo', e.message)
    await page.screenshot({ path: '/tmp/opencode/e2e-cartilla-fallo.png', fullPage: true })
    console.log('--- consola ---')
    console.log(erroresConsola.join('\n'))
  } finally {
    await browser.close()
  }

  const fallidos = pasos.filter((p) => p.startsWith('FAIL')).length
  console.log(`\nTOTAL: ${pasos.length - fallidos}/${pasos.length} PASS`)
  process.exit(fallidos ? 1 : 0)
})()
