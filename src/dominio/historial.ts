import { totalPedido } from './calculos'
import type { Abono, Fecha, Id, MetodoPago, PedidoDetallado } from './tipos'

export type TipoMovimiento = 'venta' | 'abono' | 'pagada'

export interface Movimiento {
  tipo: TipoMovimiento
  fecha: Fecha
  pedidoId: Id
  numero: number
  clienteId: Id
  /** venta: total del pedido · abono: valor recibido · pagada: 0 (saldo). */
  valor: number
  metodo?: MetodoPago
}

export const ETIQUETA_MOVIMIENTO: Record<TipoMovimiento, string> = {
  venta: 'Venta registrada',
  abono: 'Abono recibido',
  pagada: 'Venta pagada',
}

export function ordenarAbonos<T extends Pick<Abono, 'fecha' | 'creadoEn'>>(abonos: readonly T[]): T[] {
  return [...abonos].sort((a, b) => a.fecha.localeCompare(b.fecha) || a.creadoEn.localeCompare(b.creadoEn))
}

/**
 * El historial no se guarda: se deduce de pedidos y abonos, así nunca queda
 * desincronizado. Devuelve los movimientos del más reciente al más antiguo.
 */
export function construirHistorial(pedidos: readonly PedidoDetallado[]): Movimiento[] {
  // Se arma en orden cronológico con un desempate estable y al final se invierte.
  const filas: { mov: Movimiento; momento: string; paso: number }[] = []

  for (const { pedido, items, abonos } of pedidos) {
    const base = { pedidoId: pedido.id, numero: pedido.numero, clienteId: pedido.clienteId }
    const total = totalPedido(items)
    filas.push({
      mov: { ...base, tipo: 'venta', fecha: pedido.fecha, valor: total },
      momento: pedido.creadoEn,
      paso: 0,
    })

    let acumulado = 0
    let pagada = false
    for (const abono of ordenarAbonos(abonos)) {
      acumulado += abono.valor
      filas.push({
        mov: { ...base, tipo: 'abono', fecha: abono.fecha, valor: abono.valor, metodo: abono.metodo },
        momento: abono.creadoEn,
        paso: 1,
      })
      if (!pagada && total > 0 && acumulado >= total) {
        pagada = true
        filas.push({
          mov: { ...base, tipo: 'pagada', fecha: abono.fecha, valor: 0 },
          momento: abono.creadoEn,
          paso: 2,
        })
      }
    }
  }

  return filas
    .sort(
      (a, b) =>
        a.mov.fecha.localeCompare(b.mov.fecha) ||
        a.momento.localeCompare(b.momento) ||
        a.mov.numero - b.mov.numero ||
        a.paso - b.paso,
    )
    .reverse()
    .map((f) => f.mov)
}
