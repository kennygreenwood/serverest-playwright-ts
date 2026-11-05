import { defineConfig } from '@playwright/test';

export default defineConfig({
  // Pasta onde ficam os arquivos de teste (*.spec.ts)
  testDir: './tests',

  // "list" mostra o resultado no terminal; "html" gera um relatório navegável
  reporter: [['list'], ['html', { open: 'never' }]],

  use: {
    // Endereço da API do ServeRest: nos testes basta escrever '/login', '/usuarios'...
    baseURL: 'https://serverest.dev',

    // Toda requisição avisa que espera resposta em JSON
    extraHTTPHeaders: {
      Accept: 'application/json',
    },
  },
});
