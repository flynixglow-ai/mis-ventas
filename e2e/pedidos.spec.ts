import { expect, test, type Page } from '@playwright/test'

async function crearMarca(page: Page, nombre: string) {
  await page.goto('/#/mas/marcas')
  await page.getByRole('button', { name: 'Nueva' }).click()
  await page.getByLabel('Nombre').fill(nombre)
  await page.getByRole('button', { name: 'Guardar' }).click()
  await expect(page.getByRole('dialog')).toBeHidden()
}

async function crearCampana(page: Page, marca: string, nombre: string) {
  await page.goto('/#/mas/campanas')
  await page.getByRole('button', { name: 'Nueva' }).click()
  await page.getByRole('combobox').selectOption({ label: marca })
  await page.getByLabel('Nombre o número').fill(nombre)
  await page.getByRole('button', { name: 'Guardar' }).click()
  await expect(page.getByRole('dialog')).toBeHidden()
}

async function crearCliente(page: Page, nombre: string) {
  await page.goto('/#/clientes')
  await page.getByRole('button', { name: 'Nuevo', exact: true }).click()
  await page.getByLabel('Nombre').fill(nombre)
  await page.getByRole('button', { name: 'Guardar' }).click()
  await expect(page.getByRole('dialog')).toBeHidden()
}

/** Ésika (Campaña 10), Novaventa (Campaña 5 y 10) y María López. */
async function preparar(page: Page) {
  await crearMarca(page, 'Ésika')
  await crearMarca(page, 'Novaventa')
  await crearCampana(page, 'Ésika', 'Campaña 10')
  await crearCampana(page, 'Novaventa', 'Campaña 5')
  await crearCampana(page, 'Novaventa', 'Campaña 10')
  await crearCliente(page, 'María López')
}

const producto = (page: Page, n: number) => page.getByRole('listitem', { name: `Producto ${n}` })

async function llenarProducto(page: Page, n: number, nombre: string, cantidad: number, valor: number) {
  if (n > 1) await page.getByRole('button', { name: '+ Agregar producto' }).click()
  const fila = producto(page, n)
  await fila.getByLabel('Nombre del producto').fill(nombre)
  await fila.getByLabel('Cantidad').fill(String(cantidad))
  await fila.getByLabel('Valor unitario').fill(String(valor))
}

async function elegirCliente(page: Page, nombre: string) {
  await page.getByRole('button', { name: /^Cliente:/ }).click()
  await page.getByRole('dialog', { name: 'Seleccionar cliente' }).getByRole('button', { name: new RegExp(nombre) }).click()
}

async function elegirCampana(page: Page, marca: string, campana: string) {
  await page.getByLabel('Marca', { exact: true }).selectOption({ label: marca })
  await page.getByLabel('Campaña', { exact: true }).selectOption({ label: campana })
}

async function abonar(page: Page, valor: number, metodo = 'Efectivo') {
  await page.getByRole('button', { name: '+ Registrar abono' }).click()
  const hoja = page.getByRole('dialog', { name: 'Registrar abono' })
  await hoja.getByLabel('Valor del abono').fill(String(valor))
  await hoja.getByRole('radio', { name: metodo }).click()
  await hoja.getByRole('button', { name: 'Registrar abono' }).click()
  return hoja
}

const saldo = (page: Page) => page.getByLabel('Saldo pendiente', { exact: true })
const resumen = (page: Page) => page.getByLabel('Resumen')

test('el ejemplo de María: pedido con tres productos, abono inicial y abonos hasta quedar pagado', async ({ page }) => {
  await preparar(page)
  await page.goto('/')
  await page.getByRole('link', { name: 'Nuevo pedido' }).click()

  await elegirCliente(page, 'María López')

  // Al elegir una marca solo aparecen sus campañas.
  const campana = page.getByLabel('Campaña', { exact: true })
  await expect(campana).toBeDisabled()
  await page.getByLabel('Marca', { exact: true }).selectOption({ label: 'Novaventa' })
  await expect(campana.getByRole('option')).toHaveText(['Elegir', 'Campaña 10', 'Campaña 5'])
  await page.getByLabel('Marca', { exact: true }).selectOption({ label: 'Ésika' })
  await expect(campana.getByRole('option')).toHaveText(['Elegir', 'Campaña 10'])
  await expect(campana.locator('option:checked')).toHaveText('Campaña 10')

  await llenarProducto(page, 1, 'Perfume', 1, 120000)
  await llenarProducto(page, 2, 'Base', 1, 80000)
  await llenarProducto(page, 3, 'Labial', 2, 35000)
  await expect(producto(page, 3)).toContainText('$70.000')
  await expect(resumen(page)).toContainText('Total$270.000')

  await page.getByLabel('Abono inicial').fill('100000')
  await page.getByRole('radio', { name: 'Nequi' }).click()
  await expect(resumen(page)).toContainText('Abono$100.000')
  await expect(resumen(page)).toContainText('Saldo$170.000')

  await page.getByRole('button', { name: 'Guardar pedido' }).click()

  await expect(page.getByRole('heading', { name: 'Pedido #0001' })).toBeVisible()
  await expect(saldo(page)).toHaveText('$170.000')
  await expect(page.getByLabel('Total del pedido')).toHaveText('$270.000')
  await expect(page.getByLabel('Total abonado')).toHaveText('$100.000')
  await expect(page.getByText('Pago parcial')).toBeVisible()
  await expect(page.getByText('Ésika', { exact: true })).toBeVisible()
  await expect(page.getByRole('list', { name: 'Productos' }).getByRole('listitem')).toHaveText([
    /Perfume1 × \$120\.000\$120\.000/,
    /Base1 × \$80\.000\$80\.000/,
    /Labial2 × \$35\.000\$70\.000/,
    /Total\$270\.000/,
  ])
  const historial = page.getByRole('list', { name: 'Historial de abonos' }).getByRole('listitem')
  await expect(historial).toHaveText([/Nequi\$100\.000/])

  await expect(await abonar(page, 70000)).toBeHidden()
  await expect(saldo(page)).toHaveText('$100.000')
  await expect(page.getByText('Pago parcial')).toBeVisible()

  // No se puede abonar más que el saldo, ni $0.
  const excedido = await abonar(page, 100001)
  await expect(excedido.getByRole('alert')).toHaveText('El abono no puede superar el saldo pendiente ($100.000).')
  await excedido.getByLabel('Valor del abono').fill('')
  await excedido.getByRole('button', { name: 'Registrar abono' }).click()
  await expect(excedido.getByRole('alert')).toHaveText('El abono debe ser mayor que $0.')

  await excedido.getByRole('button', { name: /Pagar todo/ }).click()
  await excedido.getByRole('radio', { name: 'Transferencia' }).click()
  await excedido.getByLabel('Nota').fill('Último pago')
  await excedido.getByRole('button', { name: 'Registrar abono' }).click()

  await expect(saldo(page)).toHaveText('$0')
  await expect(page.getByText('Pagado', { exact: true })).toBeVisible()
  await expect(page.getByLabel('Total abonado')).toHaveText('$270.000')
  await expect(historial).toHaveCount(3)
  await expect(historial.last()).toContainText('Transferencia · Último pago')
  await expect(page.getByRole('button', { name: '+ Registrar abono' })).toBeHidden()

  await page.goto('/')
  await expect(page.getByLabel('Total por cobrar')).toHaveText('$0')
})

test('validaciones al crear, cliente nuevo desde el pedido y consecutivo que no se reutiliza', async ({ page }) => {
  await preparar(page)
  await page.goto('/#/pedidos/nuevo')

  // Sin pedidos previos y con dos marcas, no se preselecciona ninguna.
  await page.getByRole('button', { name: 'Guardar pedido' }).click()
  await expect(page.getByText('Selecciona un cliente.').first()).toBeVisible()
  await expect(page.getByText('Selecciona una marca.')).toBeVisible()
  await expect(page.getByText('Escribe el nombre del producto.')).toBeVisible()

  // Crear el cliente sin salir del pedido.
  await page.getByRole('button', { name: 'Cliente: Seleccionar cliente' }).click()
  await page.getByLabel('Buscar cliente').fill('Carlos Gómez')
  await page.getByRole('button', { name: '+ Crear cliente "Carlos Gómez"' }).click()
  const nuevo = page.getByRole('dialog', { name: 'Nuevo cliente' })
  await expect(nuevo.getByLabel('Nombre')).toHaveValue('Carlos Gómez')
  await nuevo.getByRole('button', { name: 'Guardar' }).click()
  await expect(page.getByRole('dialog')).toBeHidden()
  await expect(page.getByRole('button', { name: 'Cliente: Carlos Gómez' })).toBeVisible()
  // Crear el cliente no debe guardar el pedido por accidente.
  await expect(page.getByRole('heading', { name: 'Nuevo pedido' })).toBeVisible()

  await elegirCampana(page, 'Novaventa', 'Campaña 5')
  await llenarProducto(page, 1, 'Crema', 1, 300000)

  await page.getByLabel('Abono inicial').fill('300001')
  await page.getByRole('button', { name: 'Guardar pedido' }).click()
  await expect(page.getByRole('alert').filter({ hasText: 'no puede superar' }).first()).toBeVisible()
  await page.getByLabel('Abono inicial').fill('')

  await page.getByRole('button', { name: 'Guardar pedido' }).click()
  await expect(page.getByRole('heading', { name: 'Pedido #0001' })).toBeVisible()
  await expect(page.getByText('Pendiente', { exact: true })).toBeVisible()
  await expect(page.getByText('Este pedido aún no tiene abonos.')).toBeVisible()

  // Eliminar un pedido sin abonos y comprobar que su número no vuelve a usarse.
  await page.getByRole('button', { name: 'Eliminar pedido' }).click()
  const confirmar = page.getByRole('alertdialog')
  await expect(confirmar).toContainText('¿Eliminar el pedido #0001?')
  await confirmar.getByRole('button', { name: 'Eliminar pedido' }).click()
  await expect(page.getByRole('heading', { name: 'Pedido #0001' })).toBeHidden()

  await page.goto('/#/pedidos/nuevo')
  await elegirCliente(page, 'Carlos Gómez')
  await elegirCampana(page, 'Novaventa', 'Campaña 5')
  await llenarProducto(page, 1, 'Crema', 1, 300000)
  await page.getByRole('button', { name: 'Guardar pedido' }).click()
  await expect(page.getByRole('heading', { name: 'Pedido #0002' })).toBeVisible()
})

test('editar un pedido con abonos: el total no puede quedar por debajo de lo abonado', async ({ page }) => {
  await preparar(page)
  await page.goto('/#/pedidos/nuevo')
  await elegirCliente(page, 'María López')
  await elegirCampana(page, 'Ésika', 'Campaña 10')
  await llenarProducto(page, 1, 'Perfume', 1, 300000)
  await page.getByLabel('Abono inicial').fill('250000')
  await page.getByRole('button', { name: 'Guardar pedido' }).click()
  await expect(saldo(page)).toHaveText('$50.000')

  await page.getByRole('link', { name: 'Editar pedido' }).click()
  await expect(page.getByRole('heading', { name: 'Editar #0001' })).toBeVisible()
  await expect(producto(page, 1).getByLabel('Nombre del producto')).toHaveValue('Perfume')
  await expect(resumen(page)).toContainText('Abonado$250.000')

  await producto(page, 1).getByLabel('Valor unitario').fill('200000')
  await expect(resumen(page)).toContainText('Saldo-$50.000')
  await page.getByRole('button', { name: 'Guardar cambios' }).click()
  await expect(page.getByRole('alert')).toHaveText('El total ($200.000) no puede ser menor que lo ya abonado ($250.000).')

  // Aumentar el valor sí se permite, y se puede agregar otro producto.
  await producto(page, 1).getByLabel('Valor unitario').fill('320000')
  await llenarProducto(page, 2, 'Labial', 2, 35000)
  await page.getByLabel('Notas').fill('Entregar el viernes')
  await page.getByRole('button', { name: 'Guardar cambios' }).click()

  await expect(page.getByRole('heading', { name: 'Pedido #0001' })).toBeVisible()
  await expect(page.getByLabel('Total del pedido')).toHaveText('$390.000')
  await expect(saldo(page)).toHaveText('$140.000')
  await expect(page.getByText('Entregar el viernes')).toBeVisible()

  // Quitar un producto pide confirmación.
  await page.getByRole('link', { name: 'Editar pedido' }).click()
  await producto(page, 2).getByRole('button', { name: 'Quitar producto' }).click()
  await expect(page.getByRole('alertdialog')).toContainText('Se quitará "Labial"')
  await page.getByRole('alertdialog').getByRole('button', { name: 'Quitar' }).click()
  await page.getByRole('button', { name: 'Guardar cambios' }).click()
  await expect(page.getByLabel('Total del pedido')).toHaveText('$320.000')

  // Eliminar un abono pide confirmación y devuelve el saldo.
  await page.getByRole('button', { name: 'Eliminar abono de $250.000' }).click()
  await page.getByRole('alertdialog').getByRole('button', { name: 'Eliminar abono' }).click()
  await expect(saldo(page)).toHaveText('$320.000')
  await expect(page.getByText('Pendiente', { exact: true })).toBeVisible()

  // Eliminar un pedido con abonos lo advierte claramente.
  await abonar(page, 20000)
  await expect(saldo(page)).toHaveText('$300.000')
  await page.getByRole('button', { name: 'Eliminar pedido' }).click()
  await expect(page.getByRole('alertdialog')).toContainText('este pedido tiene 1 abono por $20.000')
  await page.getByRole('alertdialog').getByRole('button', { name: 'Cancelar' }).click()
  await expect(saldo(page)).toHaveText('$300.000')
})

test('varios pedidos del mismo cliente: saldos en cliente, lista e inicio, también sin conexión', async ({ page, context }) => {
  await preparar(page)

  await page.goto('/#/pedidos/nuevo')
  await elegirCliente(page, 'María López')
  await elegirCampana(page, 'Ésika', 'Campaña 10')
  await llenarProducto(page, 1, 'Perfume', 1, 270000)
  await page.getByLabel('Abono inicial').fill('100000')
  await page.getByRole('button', { name: 'Guardar pedido' }).click()
  await expect(page.getByRole('heading', { name: 'Pedido #0001' })).toBeVisible()

  // Sin conexión la app sigue funcionando y guardando.
  await page.evaluate(() => navigator.serviceWorker.ready)
  await context.setOffline(true)
  await page.reload()

  // Desde el cliente, el pedido nuevo ya trae al cliente y la última marca y campaña.
  await page.getByRole('link', { name: 'María López' }).click()
  await page.getByRole('link', { name: '+ Nuevo pedido para María' }).click()
  await expect(page.getByRole('button', { name: 'Cliente: María López' })).toBeVisible()
  await expect(page.getByLabel('Marca', { exact: true }).locator('option:checked')).toHaveText('Ésika')
  await elegirCampana(page, 'Novaventa', 'Campaña 5')
  await llenarProducto(page, 1, 'Crema', 3, 150000)
  await page.getByLabel('Abono inicial').fill('300000')
  await page.getByRole('button', { name: 'Guardar pedido' }).click()
  await expect(page.getByRole('heading', { name: 'Pedido #0002' })).toBeVisible()
  await expect(saldo(page)).toHaveText('$150.000')

  await page.reload()
  await expect(saldo(page)).toHaveText('$150.000')

  await page.getByRole('navigation', { name: 'Principal' }).getByRole('link', { name: 'Clientes' }).click()
  const fila = page.getByRole('link', { name: /María López/ })
  await expect(fila).toContainText('Compró $720.000 · Pagó $400.000')
  await expect(fila).toContainText('$320.000')
  await fila.click()
  await expect(page.getByLabel('Saldo pendiente del cliente')).toHaveText('$320.000')
  await expect(page.getByLabel('Total comprado')).toHaveText('$720.000')
  await expect(page.getByLabel('Total pagado')).toHaveText('$400.000')
  const pedidos = page.getByRole('list', { name: 'Pedidos del cliente' }).getByRole('listitem')
  await expect(pedidos).toHaveText([/Pedido #0002Novaventa — Campaña 5/, /Pedido #0001Ésika — Campaña 10/])
  // Con pedidos, el cliente ya no se puede eliminar.
  await expect(page.getByRole('button', { name: 'Eliminar cliente' })).toBeHidden()

  await page.getByRole('navigation', { name: 'Principal' }).getByRole('link', { name: 'Pedidos' }).click()
  await expect(page.getByRole('list', { name: 'Pedidos' }).getByRole('listitem')).toHaveCount(2)

  await page.getByRole('navigation', { name: 'Principal' }).getByRole('link', { name: 'Inicio' }).click()
  await expect(page.getByLabel('Total por cobrar')).toHaveText('$320.000')
})
