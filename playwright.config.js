const { defineConfig } = require('@playwright/test');
const config = require('./qa.config.js');

module.exports = defineConfig({
  testDir: './',
  timeout: 45000,
  fullyParallel: false,
  workers: process.env.PW_WORKERS ? Number(process.env.PW_WORKERS) : 1,
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
  ],
  use: {
    trace: 'on-first-retry',
    baseURL: config.vet.baseURL,
  },
  projects: [
    {
      name: 'vet',
      testDir: './vet/tests',
      use: { baseURL: config.vet.baseURL },
    },
    {
      name: 'admin',
      testDir: './admin/tests',
      use: { baseURL: config.admin.baseURL },
    },
    {
      name: 'clientes',
      testDir: './clientes/tests',
      use: { baseURL: config.clientes.baseURL },
    },
    {
      name: 'api',
      testDir: './api/tests',
      use: { baseURL: config.api.baseURL },
    },
  ],
});