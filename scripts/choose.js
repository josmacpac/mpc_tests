const { execSync } = require('child_process');
const readline = require('readline');

const proyectos = ['vet', 'admin', 'clientes', 'all'];
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

console.log('\nProyectos disponibles:');
proyectos.forEach((p, i) => console.log(`  ${i + 1}) ${p}`));
rl.question('\nElige un proyecto (1-4): ', (resp) => {
  rl.close();
  const idx = parseInt(resp, 10) - 1;
  const proy = proyectos[idx];
  if (!proy) {
    console.error('Opcion invalida.');
    process.exit(1);
  }
  const cmd = proy === 'all' ? 'npx playwright test' : `npx playwright test --project=${proy}`;
  console.log(`> Ejecutando: ${cmd}\n`);
  execSync(cmd, { stdio: 'inherit', cwd: __dirname + '/..' });
});