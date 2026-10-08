import { expect, test } from '@playwright/test'

test('la barra inferior navega entre las secciones principales', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Mis Ventas' })).toBeVisible()
  await expect(page.getByText('Total por cobrar')).toBeVisible()

  const barra = page.getByRole('navigation', { name: 'Principal' })
  await barra.getByRole('link', { name: 'Pedidos' }).click()
  await expect(page.getByRole('heading', { name: 'Pedidos' })).toBeVisible()

  await barra.getByRole('link', { name: 'Clientes' }).click()
  await expect(page.getByRole('heading', { name: 'Clientes' })).toBeVisible()

  await barra.getByRole('link', { name: 'Más' }).click()
  for (const seccion of ['Historial', 'Reportes', 'Marcas', 'Campañas', 'Copia de seguridad', 'Ajustes']) {
    await expect(page.getByRole('link', { name: seccion })).toBeVisible()
  }
})

test('el botón ＋ abre Nuevo pedido y se puede volver', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('link', { name: 'Nuevo pedido' }).click()
  await expect(page.getByRole('heading', { name: 'Nuevo pedido' })).toBeVisible()
  await page.getByRole('button', { name: 'Volver' }).click()
  await expect(page.getByRole('heading', { name: 'Mis Ventas' })).toBeVisible()
})

test('es instalable: tiene manifiesto e íconos', async ({ page, request }) => {
  await page.goto('/')
  const href = await page.locator('link[rel="manifest"]').getAttribute('href')
  const manifiesto = await (await request.get(new URL(href!, page.url()).href)).json()
  expect(manifiesto.name).toBe('Mis Ventas')
  expect(manifiesto.display).toBe('standalone')
  for (const icono of manifiesto.icons) {
    const respuesta = await request.get(new URL(icono.src, page.url()).href)
    expect(respuesta.ok()).toBe(true)
  }
})

test('funciona sin conexión después de la primera carga', async ({ page, context }) => {
  await page.goto('/')
  await page.evaluate(async () => {
    const registro = await navigator.serviceWorker.ready
    if (!navigator.serviceWorker.controller) {
      await new Promise((listo) => navigator.serviceWorker.addEventListener('controllerchange', listo, { once: true }))
    }
    return registro.scope
  })

  await context.setOffline(true)
  await page.reload()
  await expect(page.getByRole('heading', { name: 'Mis Ventas' })).toBeVisible()
  await page.getByRole('navigation', { name: 'Principal' }).getByRole('link', { name: 'Clientes' }).click()
  await expect(page.getByRole('heading', { name: 'Clientes' })).toBeVisible()
})

test('la base de datos local se crea al abrir la app', async ({ page }) => {
  await page.goto('/')
  await expect
    .poll(() => page.evaluate(async () => (await indexedDB.databases()).map((b) => b.name)))
    .toContain('mis-ventas')
})
