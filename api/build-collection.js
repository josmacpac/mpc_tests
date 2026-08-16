// Generador de la colección Postman para la API MyPetCare.
// Uso: node build-collection.js
// Genera: collections/mpc_api.postman_collection.json

const fs = require('fs');
const path = require('path');

const BASE = '{{BASE_URL}}';

function req(name, method, url, { folder = 'General', auth = null, clinicaId = null, body = null, test = null } = {}) {
  return { name, folder, method, url, auth, clinicaId, body, test };
}

// ---------------------------------------------------------------
// Definición de peticiones
// ---------------------------------------------------------------
const requests = [
  // --- Health ---
  req('Health /test-conexion', 'GET', `${BASE}/api/test-conexion`, {
    folder: '1. Health',
    test: () => pm.test('responde 200', () => pm.response.to.have.status(200)),
  }),

  // --- Auth ---
  req('Login Vet', 'POST', `{{SUPABASE_URL}}/auth/v1/token?grant_type=password`, {
    folder: '2. Auth Tokens',
    body: { email: '{{VET_EMAIL}}', password: '{{VET_PASSWORD}}' },
    test: () => {
      const d = pm.response.json();
      pm.test('login vet ok', () => { if (d.access_token) pm.environment.set('VET_TOKEN', d.access_token); });
      pm.test('status 200', () => pm.response.to.have.status(200));
    },
  }),
  req('Login Admin', 'POST', `{{SUPABASE_URL}}/auth/v1/token?grant_type=password`, {
    folder: '2. Auth Tokens',
    body: { email: '{{ADMIN_EMAIL}}', password: '{{ADMIN_PASSWORD}}' },
    test: () => {
      const d = pm.response.json();
      pm.test('login admin ok', () => { if (d.access_token) pm.environment.set('ADMIN_TOKEN', d.access_token); });
      pm.test('status 200', () => pm.response.to.have.status(200));
    },
  }),
  req('Login Cliente', 'POST', `{{SUPABASE_URL}}/auth/v1/token?grant_type=password`, {
    folder: '2. Auth Tokens',
    body: { email: '{{CLIENTE_EMAIL}}', password: '{{CLIENTE_PASSWORD}}' },
    test: () => {
      const d = pm.response.json();
      pm.test('login cliente ok', () => { if (d.access_token) pm.environment.set('CLIENTE_TOKEN', d.access_token); });
      pm.test('status 200', () => pm.response.to.have.status(200));
    },
  }),

  // --- Vet: Clínica ---
  req('Info de mi clínica', 'GET', `${BASE}/api/clinica-info`, {
    folder: '3. Vet · Clínica',
    auth: '{{VET_TOKEN}}',
    test: () => {
      pm.test('responde 200', () => pm.response.to.have.status(200));
      const d = pm.response.json();
      pm.test('trae datos de clínica', () => pm.expect(d).to.have.property('id_clinica'));
      if (d && d.id_clinica) pm.environment.set('ID_CLINICA', String(d.id_clinica));
    },
  }),

  // --- Vet: Clientes ---
  req('Listar clientes', 'GET', `${BASE}/api/clientes`, {
    folder: '4. Vet · Clientes',
    auth: '{{VET_TOKEN}}',
    test: () => pm.test('responde 200', () => pm.response.to.have.status(200)),
  }),

  // --- Vet: Mascotas ---
  req('Listar mascotas', 'GET', `${BASE}/api/mascotas`, {
    folder: '5. Vet · Mascotas',
    auth: '{{VET_TOKEN}}',
    test: () => pm.test('responde 200', () => pm.response.to.have.status(200)),
  }),

  // --- Vet: Consultas ---
  req('Catálogo de vacunas', 'GET', `${BASE}/api/catalogo-vacunas`, {
    folder: '6. Vet · Consultas',
    auth: '{{VET_TOKEN}}',
    test: () => pm.test('responde 200', () => pm.response.to.have.status(200)),
  }),
  req('Historial de mascota', 'GET', `${BASE}/api/historial-mascota/{{ID_MASCOTA}}`, {
    folder: '6. Vet · Consultas',
    auth: '{{VET_TOKEN}}',
    test: () => pm.test('responde 200', () => pm.response.to.have.status(200)),
  }),

  // --- Vet: Citas ---
  req('Listar citas', 'GET', `${BASE}/api/citas`, {
    folder: '7. Vet · Citas',
    auth: '{{VET_TOKEN}}',
    test: () => pm.test('responde 200', () => pm.response.to.have.status(200)),
  }),

  // --- Vet: Inventario ---
  req('Listar artículos', 'GET', `${BASE}/api/articulos`, {
    folder: '8. Vet · Inventario',
    auth: '{{VET_TOKEN}}',
    test: () => pm.test('responde 200', () => pm.response.to.have.status(200)),
  }),
  req('Listar proveedores', 'GET', `${BASE}/api/proveedores`, {
    folder: '8. Vet · Inventario',
    auth: '{{VET_TOKEN}}',
    test: () => pm.test('responde 200', () => pm.response.to.have.status(200)),
  }),
  req('Existencias', 'GET', `${BASE}/api/existencias`, {
    folder: '8. Vet · Inventario',
    auth: '{{VET_TOKEN}}',
    test: () => pm.test('responde 200', () => pm.response.to.have.status(200)),
  }),
  req('Stock disponible', 'GET', `${BASE}/api/stock_disponible`, {
    folder: '8. Vet · Inventario',
    auth: '{{VET_TOKEN}}',
    test: () => pm.test('responde 200', () => pm.response.to.have.status(200)),
  }),

  // --- Vet: Reportes ---
  req('Dashboard', 'GET', `${BASE}/api/reportes/dashboard`, {
    folder: '9. Vet · Reportes',
    auth: '{{VET_TOKEN}}',
    test: () => pm.test('responde 200', () => pm.response.to.have.status(200)),
  }),
  req('Reporte de ventas', 'GET', `${BASE}/api/reportes/ventas`, {
    folder: '9. Vet · Reportes',
    auth: '{{VET_TOKEN}}',
    test: () => pm.test('responde 200', () => pm.response.to.have.status(200)),
  }),

  // --- Vet: Soporte ---
  req('Anuncios (soporte)', 'GET', `${BASE}/api/soporte/anuncios`, {
    folder: '10. Vet · Soporte',
    auth: '{{VET_TOKEN}}',
    test: () => pm.test('responde 200', () => pm.response.to.have.status(200)),
  }),
  req('Suscripción (soporte)', 'GET', `${BASE}/api/soporte/suscripcion`, {
    folder: '10. Vet · Soporte',
    auth: '{{VET_TOKEN}}',
    test: () => pm.test('responde 200', () => pm.response.to.have.status(200)),
  }),
  req('Mis tickets', 'GET', `${BASE}/api/soporte/tickets`, {
    folder: '10. Vet · Soporte',
    auth: '{{VET_TOKEN}}',
    test: () => pm.test('responde 200', () => pm.response.to.have.status(200)),
  }),

  // --- Admin ---
  req('Listar clínicas (admin)', 'GET', `${BASE}/api/admin/clinicas`, {
    folder: '11. Admin',
    auth: '{{ADMIN_TOKEN}}',
    test: () => pm.test('responde 200', () => pm.response.to.have.status(200)),
  }),
  req('Listar usuarios (admin)', 'GET', `${BASE}/api/admin/usuarios`, {
    folder: '11. Admin',
    auth: '{{ADMIN_TOKEN}}',
    test: () => pm.test('responde 200', () => pm.response.to.have.status(200)),
  }),
  req('Tickets (admin)', 'GET', `${BASE}/api/admin/tickets`, {
    folder: '11. Admin',
    auth: '{{ADMIN_TOKEN}}',
    test: () => pm.test('responde 200', () => pm.response.to.have.status(200)),
  }),
  req('Suscripción de clínica (admin)', 'GET', `${BASE}/api/admin/clinicas/{{ID_CLINICA}}/suscripcion`, {
    folder: '11. Admin',
    auth: '{{ADMIN_TOKEN}}',
    test: () => pm.test('responde 200', () => pm.response.to.have.status(200)),
  }),

  // --- Portal Clientes ---
  req('Clínicas disponibles', 'GET', `${BASE}/api/portal/clinicas`, {
    folder: '12. Portal Clientes',
    auth: '{{CLIENTE_TOKEN}}',
    clinicaId: true,
    test: () => pm.test('responde 200', () => pm.response.to.have.status(200)),
  }),
  req('Mis clínicas', 'GET', `${BASE}/api/portal/mis-clinicas`, {
    folder: '12. Portal Clientes',
    auth: '{{CLIENTE_TOKEN}}',
    clinicaId: true,
    test: () => pm.test('responde 200', () => pm.response.to.have.status(200)),
  }),
  req('Mis mascotas', 'GET', `${BASE}/api/portal/mascotas`, {
    folder: '12. Portal Clientes',
    auth: '{{CLIENTE_TOKEN}}',
    clinicaId: true,
    test: () => pm.test('responde 200', () => pm.response.to.have.status(200)),
  }),
  req('Servicios', 'GET', `${BASE}/api/portal/servicios`, {
    folder: '12. Portal Clientes',
    auth: '{{CLIENTE_TOKEN}}',
    clinicaId: true,
    test: () => pm.test('responde 200', () => pm.response.to.have.status(200)),
  }),
  req('Mis citas', 'GET', `${BASE}/api/portal/citas`, {
    folder: '12. Portal Clientes',
    auth: '{{CLIENTE_TOKEN}}',
    clinicaId: true,
    test: () => pm.test('responde 200', () => pm.response.to.have.status(200)),
  }),
];

// ---------------------------------------------------------------
// Construcción de la colección (Postman Collection v2.1)
// ---------------------------------------------------------------
// Convierte el cuerpo de una función (arrow, bloque o expresión) a líneas de JS.
function bodyOf(fn) {
  let s = Function.prototype.toString.call(fn);
  s = s.replace(/^(\(\)\s*=>|function\s*\(\)\s*|function\s*\()/, '');
  if (s.trimStart().startsWith('{')) {
    s = s.replace(/^\s*\{\s*/, '').replace(/\s*\}\s*$/, '');
  } else {
    s = 'return ' + s;
  }
  return s.trim().split('\n').map(l => l.trim());
}

function buildRequest(r) {
  const headers = [];
  if (r.auth) headers.push({ key: 'Authorization', value: `Bearer ${r.auth}`, type: 'text' });
  if (r.clinicaId) headers.push({ key: 'X-Clinica-Id', value: '{{ID_CLINICA}}', type: 'text' });
  headers.push({ key: 'Content-Type', value: 'application/json', type: 'text' });

  const item = {
    name: r.name,
    request: {
      method: r.method,
      header: headers,
      url: r.url,
      description: '',
    },
  };

  if (r.body) {
    item.request.body = {
      mode: 'raw',
      raw: JSON.stringify(r.body, null, 2),
      options: { raw: { language: 'json' } },
    };
  }

  if (r.test) {
    item.event = [{ listen: 'test', script: { type: 'text/javascript', exec: bodyOf(r.test) } }];
  }

  return item;
}

const folders = [...new Set(requests.map(r => r.folder))];
const items = folders.map(folder => ({
  name: folder,
  item: requests.filter(r => r.folder === folder).map(buildRequest),
}));

const collection = {
  info: {
    _postman_id: 'mpc-api-collection',
    name: 'MyPetCare API',
    description: 'Pruebas Newman de la API MyPetCare. Requiere variables de environment: VET/ADMIN/CLIENTE_TOKEN (los llena el folder Auth Tokens) y BASE_URL.',
    schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
  },
  item: items,
  variable: [
    { key: 'BASE_URL', value: 'https://mypetcare-api-1.onrender.com' },
    { key: 'VET_TOKEN', value: '' },
    { key: 'ADMIN_TOKEN', value: '' },
    { key: 'CLIENTE_TOKEN', value: '' },
  ],
};

const out = path.join(__dirname, 'collections', 'mpc_api.postman_collection.json');
fs.writeFileSync(out, JSON.stringify(collection, null, 2));
console.log(`Colección generada: ${out}`);