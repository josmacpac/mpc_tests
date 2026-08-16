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
npm run test:choose        # selector interactivo de proyecto Playwright
npm run test:vet           # Playwright vet
npm run test:admin         # Playwright admin
npm run test:clientes      # Playwright clientes
npm test                   # Playwright: todos los proyectos

cd api
npm test                   # Newman: toda la colección
npm run test:log           # + guarda reports/result.json y result-junit.xml
npm run test:html          # + genera reports/report.html
npm run test:auth          # solo login (verifica credenciales)
```

Reporte HTML de Playwright:

```bash
npx playwright show-report
```

### Qué cubre cada proyecto

- **vet** (https://mpc-vet-dev.netlify.app) — `vet/tests/`: login correcto, login inválido, vista de mascotas, y carga de citas/reportes/clientes/artículos. Helper de login en `vet/helpers.js`.
- **admin** (https://mpc-admin-development.netlify.app) — `admin/tests/`: login, carga de clínicas, y **subida de logo** de la Clinica Demo (id 4) contra la API dev. Fixture en `admin/fixtures/logo-test.png`.
- **clientes** — pendiente: define su URL en `qa.config.js` (campo `clientes.baseURL`) y la prueba dejará de saltarse.

> **Ojo:** la prueba de logo sobrescribe el logo real de la clínica 4 en el entorno dev. Es esperado.

## Newman (API)

Las pruebas de API viven en `api/` (ver `api/README.md`). El script `run.sh` las corre
pasando las URLs/credenciales del ambiente elegido; también puedes correrlas directo:

## Cuentas de prueba (entorno dev)

| Cuenta | Rol | Email | Password |
|---|---|---|---|
| demo | Vet (clínica 4) | demo@y3n.store | d3mo53 |
| Test_user1 | Admin | test_user1@y3n.store | Test1_user_2026 |
| Test_user2 | Cliente portal | test_user2@y3n.store | Test2_user_2026 |

## Notas

- No subir credenciales reales: usar cuentas de prueba o variables de entorno.
- Los tests apuntan a dev; no tocar producción.