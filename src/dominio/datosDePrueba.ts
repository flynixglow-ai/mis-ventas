// Escenario compartido por las pruebas del dominio. Hoy = 2026-10-07.
//
//  #1 María  · Ésika — Campaña 10      · 07/10 · $270.000 · abonado $100.000 · pago parcial
//  #2 María  · Novaventa — Campaña 5   · 20/09 · $450.000 · abonado $300.000 · parcial y vencido
//  #3 Carlos · Ésika — Campaña 10      · 05/10 · $90.000  · abonado $90.000  · pagado
//  #4 Carlos · Novaventa — Campaña 10  · 06/10 · $40.000  · sin abonos       · pendiente
import type { Abono, Campana, Cliente, Item, Marca, MetodoPago, PedidoVista } from './tipos'

export const HOY = '2026-10-07'
const CREADO = '2026-10-07T10:00:00.000Z'

export const esika: Marca = { id: 'esika', nombre: 'Ésika', activa: true, creadaEn: CREADO }
export const novaventa: Marca = { id: 'novaventa', nombre: 'Novaventa', activa: true, creadaEn: CREADO }

const campana = (id: string, marcaId: string, nombre: string): Campana => ({
  id,
  marcaId,
  nombre,
  estado: 'abierta',
  creadaEn: CREADO,
})
export const esika10 = campana('e10', 'esika', 'Campaña 10')
export const novaventa5 = campana('n5', 'novaventa', 'Campaña 5')
export const novaventa10 = campana('n10', 'novaventa', 'Campaña 10')

const cliente = (id: string, nombre: string, telefono: string): Cliente => ({
  id,
  nombre,
  telefono,
  notas: '',
  estado: 'activo',
  creadoEn: CREADO,
})
export const maria = cliente('maria', 'María López', '300 123 4567')
export const carlos = cliente('carlos', 'Carlos Gómez', '')

let secuencia = 0

export function item(pedidoId: string, nombre: string, cantidad: number, valorUnitario: number): Item {
  return { id: `i${++secuencia}`, pedidoId, nombre, cantidad, valorUnitario }
}

export function abono(pedidoId: string, valor: number, fecha: string, metodo: MetodoPago = 'efectivo'): Abono {
  const n = ++secuencia
  return { id: `a${n}`, pedidoId, valor, fecha, metodo, creadoEn: `${fecha}T12:00:00.${String(n).padStart(3, '0')}Z` }
}

export function vista(
  numero: number,
  quien: Cliente,
  marca: Marca,
  camp: Campana,
  fecha: string,
  productos: [nombre: string, cantidad: number, valorUnitario: number][],
  pagos: [valor: number, fecha: string, metodo?: MetodoPago][] = [],
  fechaLimite?: string,
): PedidoVista {
  const id = `p${numero}`
  return {
    pedido: {
      id,
      numero,
      clienteId: quien.id,
      marcaId: marca.id,
      campanaId: camp.id,
      fecha,
      fechaLimite,
      notas: '',
      creadoEn: `${fecha}T09:00:00.000Z`,
    },
    items: productos.map((p) => item(id, ...p)),
    abonos: pagos.map((p) => abono(id, ...p)),
    cliente: quien,
    marca,
    campana: camp,
  }
}

export function escenario(): PedidoVista[] {
  return [
    vista(
      1,
      maria,
      esika,
      esika10,
      '2026-10-07',
      [
        ['Perfume', 1, 120_000],
        ['Base', 1, 80_000],
        ['Labial', 2, 35_000],
      ],
      [[100_000, '2026-10-07', 'nequi']],
    ),
    vista(2, maria, novaventa, novaventa5, '2026-09-20', [['Crema', 3, 150_000]], [[300_000, '2026-09-25']], '2026-10-01'),
    vista(3, carlos, esika, esika10, '2026-10-05', [['Colonia', 1, 90_000]], [[90_000, '2026-10-06']]),
    vista(4, carlos, novaventa, novaventa10, '2026-10-06', [['Jabón', 2, 20_000]]),
  ]
}

export const numeros = (pedidos: readonly PedidoVista[]) => pedidos.map((v) => v.pedido.numero)
