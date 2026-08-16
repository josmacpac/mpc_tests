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

En cada carpeta de frontend:

```bash
npm init -y
npm i -D @playwright/test
npx playwright install chromium
npx playwright test
```

Configurar `baseURL` en `playwright.config.js` apuntando al deploy dev correspondiente.

## Notas

- No subir credenciales reales: usar cuentas de prueba o variables de entorno.
- Los tests apuntan a dev; no tocar producción.