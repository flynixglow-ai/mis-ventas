import { expect, test, type Page } from '@playwright/test'
import { cargarEscenario } from './escenario'

test.beforeEach(async ({ page }) => {
  await cargarEscenario(page)
})

const filas = (page: Page, por: string) => page.getByRole('list', { name: `Por ${por}` }).getByRole('listitem')
const cifras = (vendido: string, cobrado: string, pendiente: string) => `Vendido$${vendido}Cobrado$${cobrado}Pendiente$${pendiente}`

test('reportes: vendido, cobrado y pendiente por todo, marca, campaña, cliente y mes', async ({ page }) => {
  await page.goto('/#/mas')
  await page.getByRole('link', { name: 'Reportes' }).click()
  await expect(page.getByLabel('Todo el negocio')).toHaveText(cifras('850.000', '490.000', '360.000'))

  await expect(filas(page, 'marca')).toHaveText([
    `Novaventa2 pedidos${cifras('490.000', '300.000', '190.000')}`,
    `Ésika2 pedidos${cifras('360.000', '190.000', '170.000')}`,
  ])

  // "Campaña 10" aparece dos veces, cada una con su marca y sus propias cifras.
  await page.getByRole('tab', { name: 'Campaña' }).click()
  await expect(filas(page, 'campaña')).toHaveText([
    `Ésika — Campaña 102 pedidos · 2 clientes${cifras('360.000', '190.000', '170.000')}`,
    `Novaventa — Campaña 51 pedido · 1 cliente${cifras('450.000', '300.000', '150.000')}`,
    `Novaventa — Campaña 101 pedido · 1 cliente${cifras('40.000', '0', '40.000')}`,
  ])

  await page.getByRole('tab', { name: 'Cliente' }).click()
  await expect(filas(page, 'cliente')).toHaveText([
    `María López2 pedidos${cifras('720.000', '400.000', '320.000')}`,
    `Carlos Gómez2 pedidos${cifras('130.000', '90.000', '40.000')}`,
  ])

  await page.getByRole('tab', { name: 'Mes' }).click()
  await expect(filas(page, 'mes')).toHaveCount(2)
  await expect(filas(page, 'mes').first()).toContainText(cifras('400.000', '190.000', '210.000'))
  await expect(filas(page, 'mes').last()).toContainText(cifras('450.000', '300.000', '150.000'))

  // El mes lleva a sus pedidos, y al volver se conserva la pestaña.
  await filas(page, 'mes').last().getByRole('link').click()
  await expect(page.getByRole('list', { name: 'Pedidos' }).getByRole('listitem')).toHaveText([/#0002/])
  await page.goBack()
  await expect(page.getByRole('tab', { name: 'Mes' })).toHaveAttribute('aria-selected', 'true')

  await page.getByRole('tab', { name: 'Marca' }).click()
  await filas(page, 'marca').last().getByRole('link').click()
  await expect(page.getByLabel('Filtros activos')).toHaveText('Ésika')
  await expect(page.getByRole('list', { name: 'Pedidos' }).getByRole('listitem')).toHaveCount(2)
})

test('detalle de campaña: totales, conteos, clientes y pedidos de esa campaña y esa marca', async ({ page }) => {
  await page.goto('/#/mas/campanas')
  const deEsika = page.getByRole('list', { name: 'Campañas de Ésika' })
  await expect(deEsika.getByRole('link', { name: /Campaña 10/ })).toContainText('$170.000')
  await deEsika.getByRole('link', { name: /Campaña 10/ }).click()

  await expect(page.getByRole('heading', { name: 'Campaña 10' })).toBeVisible()
  await expect(page.getByLabel('Marca de la campaña')).toHaveText('Ésika')
  await expect(page.getByLabel('Total pendiente de la campaña')).toHaveText('$170.000')
  await expect(page.getByLabel('Totales de la campaña')).toHaveText(cifras('360.000', '190.000', '170.000'))
  const conteos = page.getByLabel('Conteos de la campaña')
  await expect(conteos.getByLabel('Clientes de la campaña')).toHaveText('2')
  await expect(conteos.getByLabel('Pedidos de la campaña')).toHaveText('2')
  await expect(conteos.getByLabel('Pendientes de la campaña')).toHaveText('1')
  await expect(conteos.getByLabel('Pagados de la campaña')).toHaveText('1')

  await expect(page.getByRole('list', { name: 'Clientes de la campaña' }).getByRole('listitem')).toHaveText([
    'María López1 pedido · $270.000$170.000',
    'Carlos Gómez1 pedido · $90.000Al día',
  ])
  await expect(page.getByRole('list', { name: 'Pedidos de la campaña' }).getByRole('listitem')).toHaveText([/#0003/, /#0001/])

  // La "Campaña 10" de Novaventa es otra: solo el pedido #0004.
  await page.goto('/#/mas/campanas')
  await page.getByRole('list', { name: 'Campañas de Novaventa' }).getByRole('link', { name: /Campaña 10/ }).click()
  await expect(page.getByLabel('Marca de la campaña')).toHaveText('Novaventa')
  await expect(page.getByLabel('Totales de la campaña')).toHaveText(cifras('40.000', '0', '40.000'))
  await expect(page.getByRole('list', { name: 'Pedidos de la campaña' }).getByRole('listitem')).toHaveText([/Carlos Gómez#0004/])

  // Una campaña con pedidos no se puede eliminar.
  await page.getByRole('button', { name: 'Editar campaña' }).click()
  await page.getByRole('button', { name: 'Eliminar campaña' }).click()
  await page.getByRole('alertdialog').getByRole('button', { name: 'Eliminar' }).click()
  await expect(page.getByRole('dialog').getByRole('alert')).toHaveText('Esta campaña tiene pedidos y no se puede eliminar.')
})

test('historial: ventas registradas, abonos recibidos y ventas pagadas', async ({ page }) => {
  await page.goto('/#/mas/historial')
  const movimientos = page.getByRole('listitem')
  await expect(movimientos).toHaveCount(8)
  await expect(movimientos.filter({ hasText: 'Venta registrada' })).toHaveCount(4)
  await expect(movimientos.filter({ hasText: 'Abono recibido' })).toHaveCount(3)
  await expect(movimientos.filter({ hasText: 'Venta pagada' })).toHaveText(['Venta pagadaPedido #0003 · Carlos GómezÉsika — Campaña 10Saldo $0'])
  await expect(movimientos.filter({ hasText: 'Venta registrada' }).filter({ hasText: '#0001' })).toHaveText(
    'Venta registradaPedido #0001 · María LópezÉsika — Campaña 10$270.000',
  )
  await expect(movimientos.filter({ hasText: 'Abono recibido' }).filter({ hasText: '#0001' })).toHaveText(
    'Abono recibidoPedido #0001 · María LópezNequi$100.000',
  )
  // Lo más antiguo queda al final.
  await expect(movimientos.last()).toContainText('Venta registradaPedido #0002')

  // Al pagar un pedido aparece su "Venta pagada".
  await movimientos.filter({ hasText: 'Venta registrada' }).filter({ hasText: '#0004' }).getByRole('link').click()
  await page.getByRole('button', { name: '+ Registrar abono' }).click()
  await page.getByRole('button', { name: /Pagar todo/ }).click()
  await page.getByRole('dialog').getByRole('button', { name: 'Registrar abono' }).click()
  await page.getByRole('button', { name: 'Volver', exact: true }).click()
  await expect(movimientos).toHaveCount(10)
  await expect(movimientos.first()).toHaveText('Venta pagadaPedido #0004 · Carlos GómezNovaventa — Campaña 10Saldo $0')
})

test('WhatsApp: resumen de pedidos pendientes del cliente', async ({ page }) => {
  await page.goto('/#/clientes')
  await page.getByRole('link', { name: /María López/ }).click()
  await page.getByRole('button', { name: 'Enviar resumen por WhatsApp' }).click()

  const hoja = page.getByRole('dialog', { name: 'Resumen para WhatsApp' })
  const mensaje = [
    'Hola María, te comparto el resumen de tus pedidos pendientes:',
    '',
    'Novaventa — Campaña 5',
    'Total: $450.000',
    'Pagado: $300.000',
    'Pendiente: $150.000',
    '',
    'Ésika — Campaña 10',
    'Total: $270.000',
    'Pagado: $100.000',
    'Pendiente: $170.000',
    '',
    'Total pendiente:',
    '$320.000',
  ].join('\n')
  await expect(hoja.getByLabel('Mensaje')).toHaveText(mensaje, { useInnerText: true })
  await expect(hoja.getByLabel('Mensaje')).not.toContainText(/deuda|préstamo/i)
  const enlace = hoja.getByRole('link', { name: 'Abrir WhatsApp' })
  await expect(enlace).toHaveAttribute('href', `https://wa.me/573001234567?text=${encodeURIComponent(mensaje)}`)
  await expect(enlace).toHaveAttribute('target', '_blank')

  // El indicativo de país se cambia en Ajustes.
  await page.goto('/#/mas/ajustes')
  await page.getByLabel('Indicativo de país para WhatsApp').fill('')
  await page.getByRole('button', { name: 'Guardar' }).click()
  await expect(page.getByRole('alert')).toContainText('de 1 a 4 números')
  await page.getByLabel('Indicativo de país para WhatsApp').fill('+52')
  await page.getByRole('button', { name: 'Guardar' }).click()
  await expect(page.getByRole('status')).toHaveText('Guardado')
  await page.reload()
  await expect(page.getByLabel('Indicativo de país para WhatsApp')).toHaveValue('52')
  await expect(page.getByText(/^\d+\.\d+\.\d+$/)).toBeVisible()

  await page.goto('/#/clientes')
  await page.getByRole('link', { name: /María López/ }).click()
  await page.getByRole('button', { name: 'Enviar resumen por WhatsApp' }).click()
  await expect(enlace).toHaveAttribute('href', /^https:\/\/wa\.me\/523001234567\?text=/)
  await hoja.getByRole('button', { name: 'Cerrar' }).click()

  // Sin teléfono, WhatsApp deja elegir el contacto; y solo se incluyen pedidos con saldo.
  await page.goto('/#/clientes')
  await page.getByRole('link', { name: /Carlos Gómez/ }).click()
  await page.getByRole('button', { name: 'Enviar resumen por WhatsApp' }).click()
  await expect(hoja).toContainText('no tiene teléfono guardado')
  await expect(enlace).toHaveAttribute('href', /^https:\/\/wa\.me\/\?text=Hola%20Carlos/)
  await expect(hoja.getByLabel('Mensaje')).toContainText('Novaventa — Campaña 10')
  await expect(hoja.getByLabel('Mensaje')).not.toContainText('Ésika')
  await hoja.getByRole('button', { name: 'Cerrar' }).click()

  // Un cliente al día no tiene nada que enviar.
  await page.getByRole('link', { name: /Pedido #0004/ }).click()
  await page.getByRole('button', { name: '+ Registrar abono' }).click()
  await page.getByRole('button', { name: /Pagar todo/ }).click()
  await page.getByRole('dialog').getByRole('button', { name: 'Registrar abono' }).click()
  await page.getByRole('button', { name: 'Volver', exact: true }).click()
  await expect(page.getByLabel('Saldo pendiente del cliente')).toHaveText('$0')
  await expect(page.getByRole('button', { name: 'Enviar resumen por WhatsApp' })).toBeHidden()
})
