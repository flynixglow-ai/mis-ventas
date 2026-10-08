import { estadoPago, estaVencido, type EstadoPago } from './estados'
import type { Abono, Fecha, Item, Pedido } from './tipos'

type Producto = Pick<Item, 'cantidad' | 'valorUnitario'>
type Pago = Pick<Abono, 'valor'>

export function subtotalItem(item: Producto): number {
  return item.cantidad * item.valorUnitario
}

export function totalPedido(items: readonly Producto[]): number {
  return items.reduce((suma, item) => suma + subtotalItem(item), 0)
}

export function totalAbonado(abonos: readonly Pago[]): number {
  return abonos.reduce((suma, abono) => suma + abono.valor, 0)
}

/** Regla fundamental: el saldo siempre es total − abonos. Nunca se guarda. */
export function saldoPedido(items: readonly Producto[], abonos: readonly Pago[]): number {
  return totalPedido(items) - totalAbonado(abonos)
}

export interface ResumenPedido {
  total: number
  abonado: number
  saldo: number
  estado: EstadoPago
  vencido: boolean
}

export function resumirPedido(
  detalle: { pedido: Pick<Pedido, 'fechaLimite'>; items: readonly Producto[]; abonos: readonly Pago[] },
  hoy: Fecha,
): ResumenPedido {
  const total = totalPedido(detalle.items)
  const abonado = totalAbonado(detalle.abonos)
  const saldo = total - abonado
  return {
    total,
    abonado,
    saldo,
    estado: estadoPago(total, abonado),
    vencido: estaVencido(saldo, detalle.pedido.fechaLimite, hoy),
  }
}
