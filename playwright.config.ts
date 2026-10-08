import { defineConfig, devices } from '@playwright/test'

// Las pruebas corren contra la versión de producción, con el tamaño de un
// iPhone 12 Pro Max. Se usa el Google Chrome instalado en el computador
// (channel: 'chrome'): permite simular el modo sin conexión y no depende del
// navegador que descarga Playwright, que Windows puede bloquear.
export default defineConfig({
  testDir: 'e2e',
  fullyParallel: true,
  reporter: 'list',
  use: {
    ...devices['iPhone 12 Pro Max'],
    browserName: 'chromium',
    channel: 'chrome',
    baseURL: 'http://localhost:4173',
  },
  webServer: {
    command: 'npm run build && npm run preview -- --port 4173 --strictPort',
    url: 'http://localhost:4173',
    reuseExistingServer: true,
    timeout: 120_000,
  },
})
