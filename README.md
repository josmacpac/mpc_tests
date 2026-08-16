# mpc_tests

Suite de pruebas QA para MyPetCare. Repo dedicado para no ensuciar los repos de las apps.

## Estructura

```
mpc_tests/
├── api/          # Pruebas Newman (colecciones Postman) contra la API
│   ├── collections/
│   └── environments/
├── vet/          # Playwright E2E para el panel veterinario
├── clientes/     # Playwright E2E para el portal de clientes
└── admin/        # Playwright E2E para el panel admin
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
| Clientes | (pendiente) |

## Requisitos

- Node.js 18+ (Playwright, Newman).
- Python 3 (opcional, para scripts auxiliares de la API).

## Newman (API)

Desde `api/`:

```bash
npm i -g newman
newman run collections/mpc_api.postman_collection.json \
  -e environments/mpc_dev.postman_environment.json \
  --env-var BASE_URL=https://mypetcare-api-1.onrender.com
```

Los endpoints requieren JWT de Supabase: la colección obtiene el token en un pre-request o usa variables `TOKEN_*` del environment.

## Playwright (frontends)

Configuración raíz con **3 proyectos** (`vet`, `admin`, `clientes`). Las credenciales y URLs de cada entorno se definen en `qa.config.js`.

```bash
cd mpc_tests
npm install
npx playwright install chromium   # una sola vez
```

### Correr las pruebas (desde la terminal)

Elige proyecto de forma interactiva:

```bash
npm run test:choose
```

O directo por proyecto / todos:

```bash
npm run test:vet        # solo vet (7 pruebas: login, mascotas, citas, reportes, clientes, articulos)
npm run test:admin      # solo admin (4 pruebas: login, clinicas, subir logo)
npm run test:clientes   # solo clientes (se salta hasta configurar su URL)
npm test                # todos los proyectos
```

Solo un archivo de pruebas:

```bash
npx playwright test --project=vet vet/tests/login.spec.js
```

Reporte HTML (se abre en navegador, se guarda en `playwright-report/`):

```bash
npx playwright show-report
```

### Qué cubre cada proyecto

- **vet** (https://mpc-vet-dev.netlify.app) — `vet/tests/`: login correcto, login inválido, vista de mascotas, y carga de citas/reportes/clientes/artículos. Helper de login en `vet/helpers.js`.
- **admin** (https://mpc-admin-development.netlify.app) — `admin/tests/`: login, carga de clínicas, y **subida de logo** de la Clinica Demo (id 4) contra la API dev. Fixture en `admin/fixtures/logo-test.png`.
- **clientes** — pendiente: define su URL en `qa.config.js` (campo `clientes.baseURL`) y la prueba dejará de saltarse.

> **Ojo:** la prueba de logo sobrescribe el logo real de la clínica 4 en el entorno dev. Es esperado.

## Newman (API)

Las pruebas de API viven en `api/` (ver `api/README.md`).

```bash
cd api
npm install
npm test                 # corre toda la colección (login + health + vet + admin + portal)
npm run test:log         # igual y además guarda reports/result.json y result-junit.xml
npm run test:html        # genera reports/report.html (visual)
npm run test:auth        # solo el login (verifica credenciales)
```

Credenciales de prueba en `api/environments/mpc_dev.postman_environment.json`.

## Cuentas de prueba (entorno dev)

| Cuenta | Rol | Email | Password |
|---|---|---|---|
| demo | Vet (clínica 4) | demo@y3n.store | d3mo53 |
| Test_user1 | Admin | test_user1@y3n.store | Test1_user_2026 |
| Test_user2 | Cliente portal | test_user2@y3n.store | Test2_user_2026 |

## Notas

- No subir credenciales reales: usar cuentas de prueba o variables de entorno.
- Los tests apuntan a dev; no tocar producción.