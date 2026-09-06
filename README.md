# mpc_tests

Suite de pruebas QA para MyPetCare. Repo dedicado para no ensuciar los repos de las apps.

## Estructura

```
mpc_tests/
├── api/              # Pruebas de API
│   ├── collections/  # Newman (colecciones Postman)
│   ├── environments/ # Newman (entornos Postman)
│   └── tests/        # Playwright API tests (FEFO, rechazos)
├── vet/              # Playwright E2E para el panel veterinario
│   └── tests/        # Login, mascotas, clientes, consultas, citas, ventas, inventario
├── clientes/         # Playwright E2E para el portal de clientes
├── admin/            # Playwright E2E para el panel admin
└── environments/     # Archivos .env por ambiente (dev, prod, local)
```

## Ramas

- `main` / `master`: estado estable.
- `Development`: trabajo en curso. Todos los cambios van aquí y se apuntan a los entornos de desarrollo (Render/Netlify dev), nunca a producción.

## Entornos de desarrollo

| Componente | URL dev |
|---|---|
| API (Render) | https://mypetcare-api-1.onrender.com |
| Vet (Netlify) | https://mpc-vet-dev.netlify.app |
| Admin (Netlify) | https://mpc-admin-development.netlify.app |
| Clientes | https://clientesdev.netlify.app |

> **Nota:** la API dev y el portal de clientes apuntan al proyecto Supabase restaurado
> (`hslhhtbolndfmjhfgtxi.supabase.co`). El backup no incluía `auth.users`, por lo que las
> cuentas de prueba se recrearon con `python scripts/crear_cuentas_test.py` (en `mypetcare_api`).
> El servicio de Render debe tener `SUPABASE_URL`/`SUPABASE_SERVICE_KEY` apuntando a ese
> proyecto, o los tokens serán rechazados (401).

## Requisitos

- Node.js 18+ (Playwright, Newman).
- Python 3 (opcional, para scripts auxiliares de la API).

## API tests

### Newman (colecciones Postman)

Desde `api/`:

```bash
npm i -g newman
newman run collections/mpc_api.postman_collection.json \
  -e environments/mpc_dev.postman_environment.json \
  --env-var BASE_URL=https://mypetcare-api-1.onrender.com
```

Los endpoints requieren JWT de Supabase: la colección obtiene el token en un pre-request o usa variables `TOKEN_*` del environment.

### Playwright API tests (`api/tests/`)

Tests de lógica de negocio directos contra la API, sin UI:

```bash
npx playwright test --project=api
```

| Test | Qué valida |
|------|------------|
| `fefo.spec.js` — FEFO | Dos entradas con lotes de diferente caducidad, venta que cruza ambos lotes. Verifica que el lote más antiguo se agota primero |
| `fefo.spec.js` — Rechazo venta | Venta que excede stock total. Verifica HTTP 400 y que el stock no cambia |
| `fefo.spec.js` — Rechazo desperdicio | Desperdicio que excede stock del lote. Verifica HTTP 400 y que el stock se mantiene |

## Cómo correr las pruebas (todo desde la terminal)

Un solo script te pregunta **a qué ambiente** apuntar y **qué pruebas** correr:

```bash
cd mpc_tests
./run.sh
```

Menús: primero elige ambiente (1=local, 2=dev, 3=prod con confirmación) y luego las pruebas
(1=Newman API, 2=Playwright vet, 3=Playwright admin, 4=Playwright clientes, 5=Todo).

### Ambientes (`environments/`)

Cada archivo `.env` trae las URLs y los usuarios test. El script los carga y los pasa a
Newman y a Playwright automáticamente.

| Archivo | Uso |
|---|---|
| `environments/dev.env`  | Render + Netlify dev (recomendado) |
| `environments/local.env`| API local + frontends en localhost |
| `environments/prod.env` | Producción real (pide confirmación) |

Para cambiar las URLs o credenciales de prueba, edita el `.env` correspondiente (o agrega
un nuevo archivo). Sin el script, los defaults quedan en `qa.config.js` y en
`api/environments/mpc_dev.postman_environment.json`.

### Instalación previa (una sola vez)

```bash
cd mpc_tests
npm install
npx playwright install chromium
```

### Ejecución directa (sin el script)

```bash
# Playwright por proyecto
npm run test:vet              # todos los tests del vet
npm run test:admin            # todos los tests del admin
npm run test:clientes         # todos los tests de clientes
npm test                      # todos los proyectos Playwright

# Por ambiente (leen environments/*.env)
npm run test:dev              # todos contra dev
npm run test:dev:vet          # solo vet contra dev
npm run test:dev:admin        # solo admin contra dev
npm run test:prod             # todos contra producción

# Solo inventario
npx playwright test --project=vet -g "artículos|entradas|inventario"

# Solo FEFO (API)
npx playwright test --project=api

# Newman (API)
cd api && npm test            # toda la colección
npm run test:log              # + guarda reports/result.json y result-junit.xml
npm run test:html             # + genera reports/report.html
npm run test:auth             # solo login (verifica credenciales)
```

Reporte HTML de Playwright:

```bash
npx playwright show-report
```

> **Workers:** por defecto Playwright corre con 1 worker (`workers: 1`) para no saturar la
> API de Render (plan free). Si quieres más velocidad (y una API más tolerante), sobrescribe
> con `PW_WORKERS=2 npx playwright test --project=vet`.

### Qué cubre cada proyecto

- **vet** (https://mpc-vet-dev.netlify.app) — `vet/tests/`:
  - **login/logout** (`login.spec.js`, `logout.spec.js`): sesión correcta, credenciales inválidas, cierre limpio
  - **mascotas** (`mascotas.spec.js`): tabla de mascotas carga correctamente
  - **clientes** (`clientes.spec.js`): registra cliente único y lo busca en la tabla
  - **consulta** (`consulta.spec.js`): flujo completo de consulta con receta médica (signos vitales, medicamentos, impresión)
  - **citas** (`citas.spec.js`): flujo completo (cliente → mascota → fecha → vet → servicio → horario). Se salta si no hay turnos configurados
  - **ventas** (`ventas.spec.js`): agregar artículos por sugerencia/SKU, cantidades, pago en efectivo con QR, recibo digital por folio
  - **artículos** (`articulos.spec.js`): CRUD completo — listar, buscar, crear, SKU duplicado, editar, eliminar
  - **entradas** (`entradas.spec.js`): crear entrada via UI, verificar existencias, historial de facturas, detalle de factura
  - **inventario** (`inventario.spec.js`): flujo completo — crear artículo → entrada de stock → verificar existencias → vender → verificar stock bajó → verificar lotes → registrar desperdicio
  - Helpers en `vet/helpers.js`: login, búsqueda de clientes/mascotas, artículos, procesamiento de ventas, helpers de inventario (CRUD vía API)
- **admin** (https://mpc-admin-development.netlify.app) — `admin/tests/`:
  - **login** (`login.spec.js`): login correcto muestra clínicas; credenciales inválidas se queda en login
  - **búsqueda de usuarios** (`busqueda_usuarios.spec.js`): tabla de clínicas ordenada alfabéticamente, búsqueda de usuarios, alta de usuario ligado a la Clinica Demo
  - **logo** (`logo.spec.js`): sube el logo de la Clinica Demo (id 4) contra la API dev. Fixture en `admin/fixtures/logo-test.png`
  - **smoke** (`smoke.spec.js`): la app carga y muestra el login
- **clientes** (https://clientesdev.netlify.app) — `clientes/tests/`:
  - **login** (`login.spec.js`): login correcto → home con clínica activa; credenciales inválidas muestran error.
  - **home** (`home.spec.js`): mascotas de la clínica activa, clínica visible en el encabezado, navegación inferior (Mascotas/Citas/Directorio) e ícono de perfil en la TopBar.
  - **citas** (`citas.spec.js`): lista de citas y flujo de agendar con **modal de confirmación** (revisa detalles y confirma). Se salta si no hay veterinarios/horarios disponibles.
  - **directorio** (`directorio.spec.js`): carga del directorio con botón regresar y botón "Agregar veterinaria" en clínicas sin vincular.
  - **perfil** (`perfil.spec.js`): acceso desde el ícono del encabezado, veterinarias vinculadas y cierre de sesión.
  - **registro** (`registro.spec.js`): detección de cuenta existente → modal "Ya existe una cuenta" con las opciones de asociar/otro correo.
  - La cuenta de prueba (`test_user2@y3n.store`) vive en el proyecto restaurado con clínica 4 activa y 2 mascotas.

> **Ojo:** la prueba de logo sobrescribe el logo real de la clínica 4 en el entorno dev. Es esperado.
> **Ojo:** las pruebas de crear cliente / consulta / cita / inventario **escriben datos** en la base dev de la clínica 4. Es esperado. Todos los tests crean datos únicos (`Date.now()`) para no interferirse entre sí.

### Resumen de cobertura

| Proyecto | Tests | Módulos cubiertos |
|----------|-------|-------------------|
| vet | 19 | Login, logout, mascotas, clientes, consultas, citas, ventas, artículos, entradas, inventario |
| admin | 4 | Login, búsqueda de usuarios, logo, smoke |
| clientes | 7 | Login, home, citas, directorio, perfil, registro, smoke |
| api | 3 | FEFO, rechazo de venta, rechazo de desperdicio |
| **Total** | **33** | |

## Cuentas de prueba (entorno dev)

| Cuenta | Rol | Email | Password |
|---|---|---|---|
| demo | Vet (clínica 4) | demo@y3n.store | d3mo53 |
| Test_user1 | Admin | test_user1@y3n.store | Test1_user_2026 |
| Test_user2 | Cliente portal | test_user2@y3n.store | Test2_user_2026 |

## Notas

- No subir credenciales reales: usar cuentas de prueba o variables de entorno.
- Los tests apuntan a dev; no tocar producción.