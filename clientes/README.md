# Playwright E2E: portal de clientes (mpc_clientes)

BaseURL dev: `https://clientesdev.netlify.app`

Cubre los flujos principales del portal y las nuevas funcionalidades:

| Spec | Qué valida |
|---|---|
| `smoke.spec.js` | La app carga y redirige a `/login` sin sesión |
| `login.spec.js` | Login correcto → home; credenciales inválidas → error |
| `home.spec.js` | Mascotas de la clínica activa, clínica visible, nav inferior (sin Perfil), ícono de perfil |
| `citas.spec.js` | Lista de citas y agendar con **modal de confirmación** |
| `directorio.spec.js` | Directorio carga con botón regresar y botón "Agregar veterinaria" |
| `perfil.spec.js` | Perfil desde el encabezado, veterinarias vinculadas, cerrar sesión |
| `registro.spec.js` | Detección de cuenta existente → modal "Ya existe una cuenta" |

## Cuenta de prueba

- `test_user2@y3n.store` / `Test2_user_2026` — cliente con clínica 4 (Clinica Demo) activa y
  2 mascotas (Firulais QA, Michi QA). Vive en el proyecto Supabase restaurado
  (`hslhhtbolndfmjhfgtxi`), recreada con `python scripts/crear_cuentas_test.py` en
  `mypetcare_api`.

## Requisitos

- La API dev (`mypetcare-api-1`) debe estar apuntando al proyecto restaurado (env vars en
  Render), o el login devolverá 401.
- Los tests de agendar cita se saltan si no hay veterinarios/horarios disponibles.
