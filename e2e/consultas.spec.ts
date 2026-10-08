import { expect, test, type Page } from '@playwright/test'
import { cargarEscenario } from './escenario'

const lista = (page: Page) => page.getByRole('list', { name: 'Pedidos' }).getByRole('listitem')
const resumen = (page: Page) => page.getByLabel('Resumen de la lista')
const estado = (page: Page, nombre: string) => page.getByRole('group', { name: 'Estado' }).getByRole('button', { name: nombre, exact: true })
const buscar = (page: Page, texto: string) => page.getByLabel('Buscar pedidos').fill(texto)

async function filtrar(page: Page, campo: string, opcion: string) {
  await page.getByRole('button', { name: /^Filtros/ }).click()
  const hoja = page.getByRole('dialog', { name: 'Filtros' })
  await hoja.getByLabel(campo, { exact: true }).selectOption({ label: opcion })
  return hoja
}

test.beforeEach(async ({ page }) => {
  await cargarEscenario(page)
})

test('el dashboard responde cuánto me deben, quién y qué está pendiente', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByLabel('Total por cobrar')).toHaveText('$360.000')
  await expect(page.getByLabel('Clientes con saldo')).toHaveText('2')
  await expect(page.getByLabel('Pedidos pendientes')).toHaveText('3')
  await expect(page.getByLabel('Pedidos pagados')).toHaveText('1')

  // Este mes: lo vendido por fecha de venta y lo cobrado por fecha de abono.
  await expect(page.getByLabel('Vendido este mes')).toHaveText('$400.000')
  await expect(page.getByLabel('Cobrado este mes')).toHaveText('$190.000')
  await expect(page.getByLabel('Pendiente este mes')).toHaveText('$210.000')

  await expect(page.getByRole('list', { name: 'Clientes con mayor saldo' }).getByRole('listitem')).toHaveText([
    'María López$320.000',
    'Carlos Gómez$40.000',
  ])
  const recientes = page.getByRole('list', { name: 'Pendientes recientes' }).getByRole('listitem')
  await expect(recientes).toHaveText([
    /#0004 · Carlos GómezNovaventa — Campaña 10Pendiente\$40\.000/,
    /#0001 · María LópezÉsika — Campaña 10Pendiente\$170\.000/,
    /#0002 · María LópezNovaventa — Campaña 5Pendiente\$150\.000/,
  ])

  // Desde el dashboard se llega al pedido y al cliente.
  await recientes.nth(1).getByRole('link').click()
  await expect(page.getByRole('heading', { name: 'Pedido #0001' })).toBeVisible()
  await page.getByRole('button', { name: 'Volver', exact: true }).click()
  await page.getByRole('list', { name: 'Clientes con mayor saldo' }).getByRole('link', { name: /María López/ }).click()
  await expect(page.getByLabel('Saldo pendiente del cliente')).toHaveText('$320.000')

  // Al abonar, el dashboard se actualiza.
  await page.getByRole('link', { name: /Pedido #0001/ }).click()
  await page.getByRole('button', { name: '+ Registrar abono' }).click()
  await page.getByRole('button', { name: /Pagar todo/ }).click()
  await page.getByRole('dialog').getByRole('button', { name: 'Registrar abono' }).click()
  await page.getByRole('navigation', { name: 'Principal' }).getByRole('link', { name: 'Inicio' }).click()
  await expect(page.getByLabel('Total por cobrar')).toHaveText('$190.000')
  await expect(page.getByLabel('Pedidos pagados')).toHaveText('2')
  await expect(page.getByLabel('Cobrado este mes')).toHaveText('$360.000')
})

test('filtros por estado', async ({ page }) => {
  await page.goto('/#/pedidos')
  await expect(lista(page)).toHaveCount(4)
  await expect(resumen(page)).toHaveText('Pedidos4Vendido$850.000Pendiente$360.000')

  await estado(page, 'Pendientes').click()
  await expect(lista(page)).toHaveText([/Carlos Gómez#0004/])
  await estado(page, 'Pago parcial').click()
  await expect(lista(page)).toHaveText([/María López#0001/, /María López#0002/])
  await estado(page, 'Vencidas').click()
  await expect(lista(page)).toHaveText([/#0002.*Pago parcialVencido/])
  await estado(page, 'Pagadas').click()
  await expect(lista(page)).toHaveText([/Carlos Gómez#0003/])
  await expect(resumen(page)).toHaveText('Pedido1Vendido$90.000Pendiente$0')
  await estado(page, 'Todas').click()
  await expect(lista(page)).toHaveCount(4)
})

test('filtro por marca + campaña: cuánto me deben de una campaña específica', async ({ page }) => {
  await page.goto('/#/pedidos')

  const hoja = await filtrar(page, 'Marca', 'Ésika')
  // Solo se ofrecen las campañas de la marca elegida.
  await expect(hoja.getByLabel('Campaña', { exact: true }).getByRole('option')).toHaveText(['Todas las campañas', 'Campaña 10'])
  await hoja.getByLabel('Campaña', { exact: true }).selectOption({ label: 'Campaña 10' })
  await hoja.getByRole('button', { name: 'Ver 2 pedidos' }).click()

  await expect(page.getByLabel('Filtros activos')).toHaveText('Ésika · Campaña 10')
  await expect(lista(page)).toHaveText([/#0003/, /#0001/])
  await expect(resumen(page)).toHaveText('Pedidos2Vendido$360.000Pendiente$170.000')

  // "Campaña 10" de Novaventa es otra campaña: no se mezcla.
  const otra = await filtrar(page, 'Marca', 'Novaventa')
  await expect(otra.getByLabel('Campaña', { exact: true })).toHaveValue('')
  await otra.getByLabel('Campaña', { exact: true }).selectOption({ label: 'Campaña 10' })
  await otra.getByRole('button', { name: 'Ver 1 pedido' }).click()
  await expect(lista(page)).toHaveText([/Carlos Gómez#0004/])
  await expect(resumen(page)).toHaveText('Pedido1Vendido$40.000Pendiente$40.000')

  // Los filtros se combinan con el estado y se conservan al abrir un pedido y volver.
  await estado(page, 'Pendientes').click()
  await lista(page).first().getByRole('link').click()
  await expect(page.getByRole('heading', { name: 'Pedido #0004' })).toBeVisible()
  await page.getByRole('button', { name: 'Volver', exact: true }).click()
  await expect(page.getByLabel('Filtros activos')).toHaveText('Novaventa · Campaña 10')
  await expect(estado(page, 'Pendientes')).toHaveAttribute('aria-pressed', 'true')
  await expect(lista(page)).toHaveCount(1)

  await page.getByRole('button', { name: 'Quitar', exact: true }).click()
  await estado(page, 'Todas').click()
  await expect(lista(page)).toHaveCount(4)
})

test('filtro por cliente y por fecha', async ({ page }) => {
  await page.goto('/#/pedidos')
  const hoja = await filtrar(page, 'Cliente', 'María López')
  await hoja.getByRole('button', { name: 'Ver 2 pedidos' }).click()
  await expect(lista(page)).toHaveText([/#0001/, /#0002/])
  await expect(resumen(page)).toContainText('Pendiente$320.000')

  // Solo lo vendido desde el primer día de este mes.
  await page.getByRole('button', { name: /^Filtros/ }).click()
  const hoy = new Date()
  const inicioMes = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-01`
  await hoja.getByLabel('Desde').fill(inicioMes)
  await hoja.getByRole('button', { name: 'Ver 1 pedido' }).click()
  await expect(lista(page)).toHaveText([/#0001/])
  await expect(page.getByRole('button', { name: 'Filtros (2)' })).toBeVisible()

  await page.getByRole('button', { name: 'Filtros (2)' }).click()
  await hoja.getByRole('button', { name: 'Quitar filtros' }).click()
  await hoja.getByRole('button', { name: 'Ver 4 pedidos' }).click()
  await expect(lista(page)).toHaveCount(4)
})

test('búsqueda por cliente, producto, marca, campaña y número', async ({ page }) => {
  await page.goto('/#/pedidos')

  await buscar(page, 'maria')
  await expect(lista(page)).toHaveText([/#0001/, /#0002/])
  await buscar(page, 'Perfume')
  await expect(lista(page)).toHaveText([/#0001/])
  await buscar(page, 'Ésika')
  await expect(lista(page)).toHaveText([/#0003/, /#0001/])
  await buscar(page, 'Campaña 5')
  await expect(lista(page)).toHaveText([/#0002/])
  await buscar(page, '#0004')
  await expect(lista(page)).toHaveText([/Carlos Gómez#0004/])
  await buscar(page, '#3')
  await expect(lista(page)).toHaveText([/#0003/])

  await buscar(page, 'zapatos')
  await expect(page.getByText('Sin resultados')).toBeVisible()
  await expect(resumen(page)).toHaveText('Pedidos0Vendido$0Pendiente$0')

  // La búsqueda se combina con el estado.
  await buscar(page, 'carlos')
  await estado(page, 'Pagadas').click()
  await expect(lista(page)).toHaveText([/#0003/])
})
