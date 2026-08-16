const env = (name, fallback) => {
  const v = process.env[name];
  return v && v.length > 0 ? v : fallback;
};

module.exports = {
  vet: {
    baseURL: env('VET_URL', 'https://mpc-vet-dev.netlify.app'),
    email: env('VET_EMAIL', 'demo@y3n.store'),
    password: env('VET_PASSWORD', 'd3mo53'),
  },
  admin: {
    baseURL: env('ADMIN_URL', 'https://mpc-admin-development.netlify.app'),
    email: env('ADMIN_EMAIL', 'test_user1@y3n.store'),
    password: env('ADMIN_PASSWORD', 'Test1_user_2026'),
  },
  clientes: {
    baseURL: env('CLIENTES_URL', 'PENDIENTE_DEPLOY'),
    email: env('CLIENTE_EMAIL', 'test_user2@y3n.store'),
    password: env('CLIENTE_PASSWORD', 'Test2_user_2026'),
  },
};