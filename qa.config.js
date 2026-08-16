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
  api: {
    baseURL: env('API_URL', 'https://mypetcare-api-1.onrender.com'),
    supabaseUrl: env('SUPABASE_URL', 'https://yedotxfgqjzmoaxnfhqw.supabase.co'),
    anonKey: env(
      'SUPABASE_ANON_KEY',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InllZG90eGZncWp6bW9heG5maHF3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI1OTI0MjcsImV4cCI6MjA4ODE2ODQyN30.FNFazTjkpT4FHCTHELNaJd5V_Uc-wP59NTlGeh5pTAs'
    ),
  },
};