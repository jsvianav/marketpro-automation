module.exports = {
  default: {
    paths: ['features/**/*.feature'],
    require: [
      'src/world/CustomWorld.ts',   // PRIMERO: registra setWorldConstructor antes que cualquier hook o step
      'step-definitions/**/*.ts',
    ],
    requireModule: ['ts-node/register'],
    format: [
      'progress-bar',
      'html:reports/report.html',
      'json:reports/report.json',
    ],
    formatOptions: {
      snippetInterface: 'async-await',
    },
    timeout: 60_000,  // ms por step — suficiente para navegación remota
    worldParameters: {
      baseUrl: process.env.BASE_URL || 'https://opencart.abstracta.us',
      headless: process.env.HEADLESS !== 'false',
    },
  },
};
