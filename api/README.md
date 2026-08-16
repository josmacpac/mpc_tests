# mpc_tests

Carpeta de pruebas Newman para la API de MyPetCare.

## Instalación

```bash
npm i -g newman
```

## Ejecutar contra el entorno dev

```bash
newman run collections/mpc_api.postman_collection.json \
  -e environments/mpc_dev.postman_environment.json
```

## Variables de entorno (environment)

- `BASE_URL` → `https://mypetcare-api-1.onrender.com` (dev) o `http://127.0.0.1:5000` (local).
- Tokens de Supabase para los flujos con auth (clínica, admin, portal).

## Pendiente

- Crear colección base de endpoints públicos y autenticados.
- Script de pre-request para obtener token de Supabase e inyectarlo vía variables.