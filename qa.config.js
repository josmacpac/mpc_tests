// qa.config.js — Configuración central deQA.
// Lee todas las URLs y credenciales de variables de entorno.
// Edita los archivos en environments/*.env para cambiar los valores por ambiente.

const req = (name) => {
  const v = process.env[name];
  if (!v) throw new Error(`Falta la variable de entorno: ${name}. Revisa el archivo en environments/*.env`);
  return v;
};

const opt = (name, fallback) => process.env[name] || fallback;

module.exports = {
  vet: {
    baseURL: req('VET_URL'),
    email: req('VET_EMAIL'),
    password: req('VET_PASSWORD'),
  },
  admin: {
    baseURL: req('ADMIN_URL'),
    email: req('ADMIN_EMAIL'),
    password: req('ADMIN_PASSWORD'),
  },
  clientes: {
    baseURL: req('CLIENTES_URL'),
    email: req('CLIENTE_EMAIL'),
    password: req('CLIENTE_PASSWORD'),
  },
  api: {
    baseURL: req('API_URL'),
    supabaseUrl: req('SUPABASE_URL'),
    anonKey: req('SUPABASE_ANON_KEY'),
  },
  ids: {
    clinica: opt('ID_CLINICA', '4'),
    mascota: opt('ID_MASCOTA', '1'),
  },
};
