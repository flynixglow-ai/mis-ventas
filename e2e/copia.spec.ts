import { readFile } from 'node:fs/promises'
import { expect, test, type Download, type Page } from '@playwright/test'

// En las pruebas se fuerza la descarga directa en lugar del menú Compartir del sistema.
test.beforeEach(async ({ context }) => {
  await context.addInitScript(() => Object.defineProperty(navigator, 'share', { value: undefined }))
})

async function guardarHoja(page: Page) {
  await page.getByRole('button', { name: 'Guardar' }).click()
  await expect(page.getByRole('dialog')).toBeHidden()
}

/** Ésika — Campaña 10, María López y un pedido de $270.000 con abono de $100.000. */
async function cargarDatos(page: Page) {
  await page.goto('/#/mas/marcas')
  await page.getByRole('button', { name: 'Nueva' }).click()
  await page.getByLabel('Nombre').fill('Ésika')
  await guardarHoja(page)
  await page.goto('/#/mas/campanas')
  await page.getByRole('button', { name: 'Nueva' }).click()
  await page.getByLabel('Nombre o número').fill('Campaña 10')
  await guardarHoja(page)
  await page.goto('/#/clientes')
  await page.getByRole('button', { name: 'Nuevo', exact: true }).click()
  await page.getByLabel('Nombre').fill('María López')
  await guardarHoja(page)

  await page.goto('/#/pedidos/nuevo')
  await page.getByRole('button', { name: /^Cliente:/ }).click()
  await page.getByRole('dialog').getByRole('button', { name: /María López/ }).click()
  const fila = page.getByRole('listitem', { name: 'Producto 1' })
  await fila.getByLabel('Nombre del producto').fill('Perfume')
  await fila.getByLabel('Valor unitario').fill('270000')
  await page.getByLabel('Abono inicial').fill('100000')
  await page.getByRole('button', { name: 'Guardar pedido' }).click()
  await expect(page.getByRole('heading', { name: 'Pedido #0001' })).toBeVisible()
}

async function exportar(page: Page): Promise<Download> {
  await page.goto('/#/mas/copia')
  const [descarga] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: 'Exportar copia completa' }).click(),
  ])
  await expect(page.getByRole('status')).toContainText('Copia creada')
  return descarga
}

const elegirArchivo = (page: Page, archivo: string | { name: string; mimeType: string; buffer: Buffer }) =>
  page.getByLabel('Archivo de copia').setInputFiles(archivo)

test('exportar, perder datos y restaurar: todo vuelve como estaba', async ({ page }) => {
  await cargarDatos(page)

  // Inicio recuerda que nunca se ha hecho una copia.
  await page.goto('/')
  await expect(page.getByRole('link', { name: /Haz una copia de seguridad/ })).toContainText('Aún no has guardado ninguna copia')
  await page.getByRole('link', { name: /Haz una copia de seguridad/ }).click()
  await expect(page.getByLabel('Última copia')).toHaveText('Nunca')

  const descarga = await exportar(page)
  expect(descarga.suggestedFilename()).toMatch(/^mis-ventas-\d{4}-\d{2}-\d{2}\.json$/)
  const ruta = await descarga.path()
  const copia = JSON.parse(await readFile(ruta, 'utf8'))
  expect(copia).toMatchObject({ app: 'mis-ventas', formato: 1 })
  expect(copia.datos.pedidos).toHaveLength(1)
  expect(copia.datos.abonos[0]).toMatchObject({ valor: 100000, metodo: 'efectivo' })
  await expect(page.getByLabel('Última copia')).toHaveText('Hoy')
  await page.goto('/')
  await expect(page.getByRole('link', { name: /Haz una copia de seguridad/ })).toBeHidden()

  // Se pierde el pedido…
  await page.goto('/#/pedidos')
  await page.getByRole('link', { name: /María López/ }).click()
  await page.getByRole('button', { name: 'Eliminar pedido' }).click()
  await page.getByRole('alertdialog').getByRole('button', { name: 'Eliminar pedido' }).click()
  await expect(page.getByText('Sin pedidos')).toBeVisible()

  // …y se recupera con la copia, después de ver el resumen y confirmar.
  await page.goto('/#/mas/copia')
  await elegirArchivo(page, ruta)
  const hoja = page.getByRole('dialog', { name: 'Restaurar copia' })
  const tabla = hoja.getByRole('table', { name: 'Qué se va a importar' })
  await expect(tabla.getByRole('row', { name: /Pedidos/ })).toHaveText('Pedidos10')
  await expect(tabla.getByRole('row', { name: /Clientes/ })).toHaveText('Clientes11')
  await expect(tabla.getByRole('row', { name: /Por cobrar/ })).toHaveText('Por cobrar$170.000$0')
  await expect(hoja).toContainText('se reemplazarán')

  // Cancelar no cambia nada.
  await hoja.getByRole('button', { name: 'Cancelar' }).click()
  await page.goto('/#/pedidos')
  await expect(page.getByText('Sin pedidos')).toBeVisible()

  await page.goto('/#/mas/copia')
  await elegirArchivo(page, ruta)
  await hoja.getByRole('button', { name: 'Reemplazar mis datos' }).click()
  await expect(page.getByRole('status')).toContainText('Copia restaurada')

  await page.goto('/')
  await expect(page.getByLabel('Total por cobrar')).toHaveText('$170.000')
  await page.goto('/#/pedidos')
  await page.getByRole('link', { name: /María López/ }).click()
  await expect(page.getByRole('heading', { name: 'Pedido #0001' })).toBeVisible()
  await expect(page.getByLabel('Total abonado')).toHaveText('$100.000')
})

test('un archivo inválido no se restaura y los datos actuales no cambian', async ({ page }) => {
  await cargarDatos(page)
  const ruta = await (await exportar(page)).path()
  const copia = JSON.parse(await readFile(ruta, 'utf8'))
  const archivo = (nombre: string, contenido: string) => ({ name: nombre, mimeType: 'application/json', buffer: Buffer.from(contenido) })

  await elegirArchivo(page, archivo('foto.json', 'esto no es una copia'))
  await expect(page.getByRole('alert')).toContainText('No se puede restaurar este archivo. Tus datos actuales no se modificaron.')
  await expect(page.getByRole('alert')).toContainText('no se pudo leer')
  await expect(page.getByRole('dialog')).toBeHidden()

  await elegirArchivo(page, archivo('otra.json', JSON.stringify({ app: 'otra-app', formato: 1, datos: {} })))
  await expect(page.getByRole('alert')).toContainText('no es una copia de seguridad de Mis Ventas')

  // Estructura dañada: un pedido cuyo cliente no viene en la copia.
  await elegirArchivo(page, archivo('rota.json', JSON.stringify({ ...copia, datos: { ...copia.datos, clientes: [] } })))
  await expect(page.getByRole('alert')).toContainText('El pedido #1 es de un cliente que no está en la copia.')
  await expect(page.getByRole('dialog')).toBeHidden()

  await page.goto('/')
  await expect(page.getByLabel('Total por cobrar')).toHaveText('$170.000')
  await page.goto('/#/clientes')
  await expect(page.getByRole('link', { name: /María López/ })).toBeVisible()
})

test('cambiar de teléfono: la copia se restaura en una instalación vacía', async ({ page, browser }) => {
  await cargarDatos(page)
  const ruta = await (await exportar(page)).path()

  const otroTelefono = await browser.newContext()
  const nueva = await otroTelefono.newPage()
  await nueva.goto('/#/mas/copia')
  await expect(nueva.getByText('En este teléfono: 0 clientes, 0 pedidos y 0 abonos.')).toBeVisible()
  await expect(nueva.getByRole('button', { name: 'Exportar copia completa' })).toBeDisabled()

  await elegirArchivo(nueva, ruta)
  const hoja = nueva.getByRole('dialog', { name: 'Restaurar copia' })
  await expect(hoja).toContainText('Se cargarán los datos de la copia en este teléfono.')
  await hoja.getByRole('button', { name: 'Restaurar', exact: true }).click()
  await expect(nueva.getByRole('status')).toContainText('Ahora tienes 1 cliente y 1 pedido.')

  await nueva.goto('/#/clientes')
  await nueva.getByRole('link', { name: /María López/ }).click()
  await expect(nueva.getByLabel('Saldo pendiente del cliente')).toHaveText('$170.000')

  // El consecutivo continúa: el siguiente pedido es el #0002.
  await nueva.getByRole('link', { name: '+ Nuevo pedido para María' }).click()
  const fila = nueva.getByRole('listitem', { name: 'Producto 1' })
  await fila.getByLabel('Nombre del producto').fill('Base')
  await fila.getByLabel('Valor unitario').fill('80000')
  await nueva.getByRole('button', { name: 'Guardar pedido' }).click()
  await expect(nueva.getByRole('heading', { name: 'Pedido #0002' })).toBeVisible()
  await otroTelefono.close()
})

test('exportar CSV entrega pedidos, productos y abonos', async ({ page }) => {
  await cargarDatos(page)
  await page.goto('/#/mas/copia')
  const descargas: Download[] = []
  page.on('download', (d) => descargas.push(d))
  await page.getByRole('button', { name: 'Exportar CSV para Excel' }).click()
  await expect.poll(() => descargas.length).toBe(3)

  const nombres = descargas.map((d) => d.suggestedFilename()).sort()
  expect(nombres.map((n) => n.replace(/-\d{4}-\d{2}-\d{2}/, ''))).toEqual([
    'mis-ventas-abonos.csv',
    'mis-ventas-pedidos.csv',
    'mis-ventas-productos.csv',
  ])
  const pedidos = descargas.find((d) => d.suggestedFilename().includes('pedidos'))!
  const contenido = await readFile(await pedidos.path(), 'utf8')
  expect(contenido).toContain('Pedido;Cliente;Marca;Campaña')
  expect(contenido).toMatch(/1;María López;Ésika;Campaña 10;;\d{4}-\d{2}-\d{2};;270000;100000;170000;Pago parcial;No;/)
})
