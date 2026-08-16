# mpc_tests / api

Pruebas **Newman** (colección Postman) para la API de MyPetCare. Apuntan al entorno de desarrollo en Render (`https://mypetcare-api-1.onrender.com`).

## Estructura

```
api/
├── build-collection.js                  # Genera la colección (mantenible)
├── package.json                         # Scripts de npm (newman)
├── collections/
│   └── mpc_api.postman_collection.json  # Colección generada
└── environments/
    └── mpc_dev.postman_environment.json # Credenciales/variables del entorno dev
```

## Cómo usarlas

### 1. Instalar dependencias

```bash
cd mpc_tests/api
npm install
```

### 2. Configurar credenciales (una sola vez)

Edita `environments/mpc_dev.postman_environment.json` y reemplaza los `CAMBIAME_*` con cuentas reales de prueba en Supabase:

- `VET_EMAIL` / `VET_PASSWORD` → cuenta de veterinario (rol clínica).
- `ADMIN_EMAIL` / `ADMIN_PASSWORD` → cuenta administradora (rol 999).
- `CLIENTE_EMAIL` / `CLIENTE_PASSWORD` → cuenta de cliente del portal.
- `ID_CLINICA` / `ID_MASCOTA` → ids reales de tu entorno (opcional; `ID_CLINICA` se auto-llena en la prueba "Info de mi clínica").

> No uses credenciales de producción. Estas son de prueba y quedan en el repo (privado).

### 3. Ejecutar las pruebas

```bash
npm test
```

Corre toda la colección: login (obtiene los 3 tokens) → health → vet → admin → portal clientes.

Solo el login (para verificar credenciales):

```bash
npm run test:auth
```

Solo una carpeta:

```bash
npx newman run collections/mpc_api.postman_collection.json \
  -e environments/mpc_dev.postman_environment.json \
  --folder "8. Vet · Inventario"
```

Reporte HTML:

```bash
npx newman run collections/mpc_api.postman_collection.json \
  -e environments/mpc_dev.postman_environment.json \
  -r htmlextra --reporter-htmlextra-export report.html
```

### 4. Modificar / agregar pruebas

Las pruebas se definen en `build-collection.js` (función `req(...)`). Tras editar:

```bash
npm run build   # regenera la colección
npm test
```

## Entorno objetivo

| Variable | Valor |
|---|---|
| `BASE_URL` | `https://mypetcare-api-1.onrender.com` (dev) |
| Local | `http://127.0.0.1:5000` |

## Notas

- El login usa el endpoint REST de Supabase Auth (`/auth/v1/token?grant_type=password`) con la anon key (es pública, la usan los frontends).
- Los endpoints del portal requieren el header `X-Clinica-Id` (se envía automáticamente con `{{ID_CLINICA}}`).
- Todos los requests con auth envían `Authorization: Bearer <token>` del role correspondiente.