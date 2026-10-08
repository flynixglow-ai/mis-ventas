import { expect, type Page } from '@playwright/test'

// Escenario compartido, cargado con "Restaurar copia" para no repetir clics.
// Las fechas son relativas a hoy para que "este mes" y "vencido" siempre apliquen.
//
//  #1 María  · Ésika — Campaña 10      · hoy          · $270.000 · abonado $100.000 · pago parcial
//  #2 María  · Novaventa — Campaña 5   · mes pasado   · $450.000 · abonado $300.000 · parcial y vencido
//  #3 Carlos · Ésika — Campaña 10      · hoy          · $90.000  · abonado $90.000  · pagado
//  #4 Carlos · Novaventa — Campaña 10  · hoy          · $40.000  · sin abonos       · pendiente

const iso = (f: Date) => `${f.getFullYear()}-${String(f.getMonth() + 1).padStart(2, '0')}-${String(f.getDate()).padStart(2, '0')}`
const ahora = new Date()
export const HOY = iso(ahora)
const delMesPasado = (dia: number) => iso(new Date(ahora.getFullYear(), ahora.getMonth() - 1, dia))
export const MES_PASADO = delMesPasado(10)
const CREADO = `${HOY}T10:00:00.000Z`

export function copiaEscenario() {
  const marca = (id: string, nombre: string) => ({ id, nombre, activa: true, creadaEn: CREADO })
  const campana = (id: string, marcaId: string, nombre: string) => ({ id, marcaId, nombre, estado: 'abierta', creadaEn: CREADO })
  const cliente = (id: string, nombre: string, telefono: string) => ({ id, nombre, telefono, notas: '', estado: 'activo', creadoEn: CREADO })
  const pedido = (numero: number, clienteId: string, marcaId: string, campanaId: string, fecha: string, fechaLimite?: string) => ({
    id: `p${numero}`,
    numero,
    clienteId,
    marcaId,
    campanaId,
    fecha,
    ...(fechaLimite ? { fechaLimite } : {}),
    notas: '',
    creadoEn: `${fecha}T09:0${numero}:00.000Z`,
  })
  let n = 0
  const item = (pedidoId: string, nombre: string, cantidad: number, valorUnitario: number) => ({
    id: `i${++n}`,
    pedidoId,
    orden: n,
    nombre,
    cantidad,
    valorUnitario,
  })
  const abono = (pedidoId: string, valor: number, fecha: string, metodo: string) => ({
    id: `a${++n}`,
    pedidoId,
    valor,
    fecha,
    metodo,
    creadoEn: `${fecha}T12:00:00.000Z`,
  })

  return {
    app: 'mis-ventas',
    formato: 1,
    versionEsquema: 1,
    exportadoEn: new Date().toISOString(),
    datos: {
      marcas: [marca('esika', 'Ésika'), marca('novaventa', 'Novaventa')],
      campanas: [campana('e10', 'esika', 'Campaña 10'), campana('n5', 'novaventa', 'Campaña 5'), campana('n10', 'novaventa', 'Campaña 10')],
      clientes: [cliente('maria', 'María López', '300 123 4567'), cliente('carlos', 'Carlos Gómez', '')],
      pedidos: [
        pedido(1, 'maria', 'esika', 'e10', HOY),
        pedido(2, 'maria', 'novaventa', 'n5', MES_PASADO, delMesPasado(20)),
        pedido(3, 'carlos', 'esika', 'e10', HOY),
        pedido(4, 'carlos', 'novaventa', 'n10', HOY),
      ],
      items: [
        item('p1', 'Perfume', 1, 120_000),
        item('p1', 'Base', 1, 80_000),
        item('p1', 'Labial', 2, 35_000),
        item('p2', 'Crema', 3, 150_000),
        item('p3', 'Colonia', 1, 90_000),
        item('p4', 'Jabón', 2, 20_000),
      ],
      abonos: [abono('p1', 100_000, HOY, 'nequi'), abono('p2', 300_000, delMesPasado(15), 'efectivo'), abono('p3', 90_000, HOY, 'efectivo')],
      meta: [{ clave: 'ultimoNumeroPedido', valor: 4 }],
    },
  }
}

export async function cargarEscenario(page: Page) {
  await page.goto('/#/mas/copia')
  await page.getByLabel('Archivo de copia').setInputFiles({
    name: 'escenario.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(copiaEscenario())),
  })
  await page.getByRole('dialog', { name: 'Restaurar copia' }).getByRole('button', { name: 'Restaurar', exact: true }).click()
  await expect(page.getByRole('status')).toContainText('Copia restaurada')
}
