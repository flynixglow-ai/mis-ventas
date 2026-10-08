import { expect, test, type Page } from '@playwright/test'

async function crearMarca(page: Page, nombre: string) {
  await page.getByRole('button', { name: 'Nueva' }).click()
  const hoja = page.getByRole('dialog', { name: 'Nueva marca' })
  await hoja.getByLabel('Nombre').fill(nombre)
  await hoja.getByRole('button', { name: 'Guardar' }).click()
  return hoja
}

async function crearCampana(page: Page, marca: string, nombre: string) {
  await page.getByRole('button', { name: 'Nueva' }).click()
  const hoja = page.getByRole('dialog', { name: 'Nueva campaña' })
  await hoja.getByRole('combobox').selectOption({ label: marca })
  await hoja.getByLabel('Nombre o número').fill(nombre)
  await hoja.getByRole('button', { name: 'Guardar' }).click()
  return hoja
}

async function crearCliente(page: Page, nombre: string, telefono = '') {
  await page.getByRole('button', { name: 'Nuevo' }).click()
  const hoja = page.getByRole('dialog', { name: 'Nuevo cliente' })
  await hoja.getByLabel('Nombre').fill(nombre)
  await hoja.getByLabel('Teléfono').fill(telefono)
  await hoja.getByRole('button', { name: 'Guardar' }).click()
  return hoja
}

test('marcas y campañas: crear, validar duplicados y conservar tras recargar', async ({ page }) => {
  await page.goto('/#/mas/marcas')
  await expect(page.getByText('Sin marcas')).toBeVisible()

  await expect(await crearMarca(page, 'Ésika')).toBeHidden()
  await expect(await crearMarca(page, 'Novaventa')).toBeHidden()

  const repetida = await crearMarca(page, 'esika')
  await expect(repetida.getByRole('alert')).toHaveText('Ya existe una marca con ese nombre.')
  await repetida.getByRole('button', { name: 'Cerrar' }).click()
  await expect(page.getByRole('list', { name: 'Marcas' }).getByRole('listitem')).toHaveCount(2)

  await page.goto('/#/mas/campanas')
  await expect(await crearCampana(page, 'Ésika', 'Campaña 10')).toBeHidden()
  await expect(await crearCampana(page, 'Ésika', 'Campaña 9')).toBeHidden()
  // La misma campaña numérica en otra marca es una campaña distinta.
  await expect(await crearCampana(page, 'Novaventa', 'Campaña 10')).toBeHidden()

  const duplicada = await crearCampana(page, 'Ésika', 'campaña 10')
  await expect(duplicada.getByRole('alert')).toHaveText('Esa marca ya tiene una campaña con ese nombre.')
  await duplicada.getByRole('button', { name: 'Cerrar' }).click()

  await page.reload()
  const deEsika = page.getByRole('list', { name: 'Campañas de Ésika' }).getByRole('listitem')
  await expect(deEsika).toHaveText(['Campaña 10', 'Campaña 9'])
  await expect(page.getByRole('list', { name: 'Campañas de Novaventa' }).getByRole('listitem')).toHaveText(['Campaña 10'])

  await page.goto('/#/mas/marcas')
  await expect(page.getByRole('button', { name: /Ésika/ })).toContainText('2 campañas')
  await expect(page.getByRole('button', { name: /Novaventa/ })).toContainText('1 campaña')
})

test('marca: editar, desactivar y eliminar con confirmación', async ({ page }) => {
  await page.goto('/#/mas/marcas')
  await crearMarca(page, 'Esica')
  await page.getByRole('button', { name: /Esica/ }).click()

  const hoja = page.getByRole('dialog', { name: 'Editar marca' })
  await hoja.getByLabel('Nombre').fill('Ésika')
  await hoja.getByRole('switch', { name: 'Marca activa' }).click()
  await hoja.getByRole('button', { name: 'Guardar' }).click()
  await expect(page.getByRole('button', { name: /Ésika/ })).toContainText('Inactiva')

  // Una marca inactiva no se ofrece al crear campañas.
  await page.goto('/#/mas/campanas')
  await page.getByRole('button', { name: 'Nueva' }).click()
  await expect(page.getByRole('dialog').getByRole('combobox').getByRole('option')).toHaveText(['Selecciona una marca'])

  await page.goto('/#/mas/marcas')
  await page.getByRole('button', { name: /Ésika/ }).click()
  await hoja.getByRole('button', { name: 'Eliminar marca' }).click()
  const confirmar = page.getByRole('alertdialog')
  await expect(confirmar).toContainText('¿Eliminar Ésika?')
  await confirmar.getByRole('button', { name: 'Cancelar' }).click()
  await expect(hoja).toBeVisible()

  await hoja.getByRole('button', { name: 'Eliminar marca' }).click()
  await confirmar.getByRole('button', { name: 'Eliminar' }).click()
  await expect(page.getByText('Sin marcas')).toBeVisible()
})

test('campaña: no se puede crear sin marca y se puede editar y eliminar', async ({ page }) => {
  await page.goto('/#/mas/campanas')
  await expect(page.getByText('Primero crea una marca')).toBeVisible()
  await page.getByRole('link', { name: 'Ir a Marcas' }).click()
  await crearMarca(page, 'Ésika')

  await page.goto('/#/mas/campanas')
  await page.getByRole('button', { name: 'Nueva' }).click()
  const nueva = page.getByRole('dialog', { name: 'Nueva campaña' })
  // Con una sola marca activa, queda seleccionada.
  await expect(nueva.getByRole('combobox')).toHaveValue(/.+/)
  await nueva.getByRole('button', { name: 'Guardar' }).click()
  await expect(nueva.getByRole('alert')).toHaveText('Escribe el nombre o número de la campaña.')
  await nueva.getByLabel('Nombre o número').fill('Campaña 10')
  await nueva.getByLabel('Inicio').fill('2026-10-01')
  await nueva.getByLabel('Cierre').fill('2026-09-01')
  await nueva.getByRole('button', { name: 'Guardar' }).click()
  await expect(nueva.getByRole('alert')).toHaveText('No puede ser anterior a la fecha inicial.')
  await nueva.getByLabel('Cierre').fill('2026-10-21')
  await nueva.getByRole('button', { name: 'Guardar' }).click()

  const fila = page.getByRole('button', { name: /Campaña 10/ })
  await expect(fila).toContainText('01/10/2026 – 21/10/2026')
  await fila.click()
  const editar = page.getByRole('dialog', { name: 'Editar campaña' })
  await editar.getByLabel('Nombre o número').fill('Campaña 11')
  await editar.getByRole('button', { name: 'Guardar' }).click()
  await page.getByRole('button', { name: /Campaña 11/ }).click()
  await editar.getByRole('button', { name: 'Eliminar campaña' }).click()
  await page.getByRole('alertdialog').getByRole('button', { name: 'Eliminar' }).click()
  await expect(page.getByText('Sin campañas')).toBeVisible()
})

test('clientes: crear, buscar, editar, archivar, reactivar y eliminar', async ({ page }) => {
  await page.goto('/#/clientes')
  await expect(page.getByText('Sin clientes')).toBeVisible()

  const sinNombre = await crearCliente(page, '   ')
  await expect(sinNombre.getByRole('alert')).toHaveText('Escribe el nombre del cliente.')
  await sinNombre.getByLabel('Nombre').fill('María López')
  await sinNombre.getByLabel('Teléfono').fill('300 123 4567')
  await sinNombre.getByRole('button', { name: 'Guardar' }).click()
  await crearCliente(page, 'Carlos Gómez')

  const lista = page.getByRole('list', { name: 'Clientes' }).getByRole('listitem')
  await expect(lista).toHaveCount(2)

  await page.getByLabel('Buscar cliente').fill('maria')
  await expect(lista).toHaveCount(1)
  await expect(lista).toContainText('María López')
  await page.getByLabel('Buscar cliente').fill('zzz')
  await expect(page.getByText('Sin resultados')).toBeVisible()
  await page.getByLabel('Buscar cliente').fill('')

  await page.getByRole('link', { name: /María López/ }).click()
  await expect(page.getByRole('heading', { name: 'María López' })).toBeVisible()
  await expect(page.getByText('300 123 4567')).toBeVisible()

  await page.getByRole('button', { name: 'Editar datos' }).click()
  const editar = page.getByRole('dialog', { name: 'Editar cliente' })
  await editar.getByLabel('Teléfono').fill('310 000 0000')
  await editar.getByLabel('Notas').fill('Paga los viernes')
  await editar.getByRole('button', { name: 'Guardar' }).click()
  await expect(page.getByText('310 000 0000')).toBeVisible()
  await expect(page.getByText('Paga los viernes')).toBeVisible()

  await page.getByRole('button', { name: 'Archivar cliente' }).click()
  await page.getByRole('alertdialog').getByRole('button', { name: 'Archivar' }).click()
  await expect(page.getByText('Archivado', { exact: true })).toBeVisible()

  await page.getByRole('link', { name: 'Volver' }).click()
  await expect(lista).toHaveText([/Carlos Gómez/])
  await page.getByRole('tab', { name: 'Archivados (1)' }).click()
  await expect(lista).toHaveText([/María López/])

  await page.reload()
  await page.getByRole('tab', { name: 'Archivados (1)' }).click()
  await page.getByRole('link', { name: /María López/ }).click()
  await page.getByRole('button', { name: 'Volver a activar' }).click()
  await expect(page.getByText('Activo', { exact: true })).toBeVisible()

  await page.getByRole('button', { name: 'Eliminar cliente' }).click()
  await page.getByRole('alertdialog').getByRole('button', { name: 'Eliminar' }).click()
  await expect(page.getByRole('heading', { name: 'Clientes' })).toBeVisible()
  await expect(lista).toHaveText([/Carlos Gómez/])
  await expect(page.getByRole('tab')).toHaveCount(0)
})
