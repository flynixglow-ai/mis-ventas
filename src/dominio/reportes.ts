import { totalAbonado, totalPedido } from './calculos'
import { mesDe } from './fechas'
import type { Id, PedidoDetallado } from './tipos'

export interface Totales {
  vendido: number
  cobrado: number
  pendiente: number
  pedidos: number
  /** Pedidos con saldo mayor que 0 (pendientes y de pago parcial). */
  pedidosPendientes: number
  pedidosPagados: number
  clientes: number
  clientesConSaldo: number
}

/** Vendido, cobrado y pendiente de un conjunto de pedidos. */
export function calcularTotales(pedidos: readonly PedidoDetallado[]): Totales {
  const t = { vendido: 0, cobrado: 0, pendiente: 0, pedidos: 0, pedidosPendientes: 0, pedidosPagados: 0 }
  const clientes = new Set<Id>()
  const conSaldo = new Set<Id>()
  for (const { pedido, items, abonos } of pedidos) {
    const total = totalPedido(items)
    const abonado = totalAbonado(abonos)
    const saldo = total - abonado
    t.vendido += total
    t.cobrado += abonado
    t.pendiente += saldo
    t.pedidos++
    clientes.add(pedido.clienteId)
    if (saldo > 0) {
      t.pedidosPendientes++
      conSaldo.add(pedido.clienteId)
    } else {
      t.pedidosPagados++
    }
  }
  return { ...t, clientes: clientes.size, clientesConSaldo: conSaldo.size }
}

/**
 * Totales agrupados por cualquier dimensión del pedido. Ejemplos:
 *   agrupar(pedidos, (d) => d.pedido.marcaId)
 *   agrupar(pedidos, (d) => d.pedido.campanaId)
 *   agrupar(pedidos, (d) => d.pedido.clienteId)
 */
export function agrupar(
  pedidos: readonly PedidoDetallado[],
  clave: (detalle: PedidoDetallado) => string,
): Map<string, Totales> {
  const grupos = new Map<string, PedidoDetallado[]>()
  for (const detalle of pedidos) {
    const k = clave(detalle)
    const grupo = grupos.get(k)
    if (grupo) grupo.push(detalle)
    else grupos.set(k, [detalle])
  }
  return new Map([...grupos].map(([k, grupo]) => [k, calcularTotales(grupo)]))
}

export interface TotalesMes {
  /** AAAA-MM */
  mes: string
  /** Pedidos cuya fecha de venta cae en el mes. */
  vendido: number
  /** Abonos recibidos en el mes, sin importar de qué mes sea el pedido. */
  cobrado: number
  /** Saldo actual de los pedidos vendidos en el mes. */
  pendiente: number
}

export function reportePorMes(pedidos: readonly PedidoDetallado[]): TotalesMes[] {
  const meses = new Map<string, TotalesMes>()
  const del = (mes: string) => {
    let t = meses.get(mes)
    if (!t) meses.set(mes, (t = { mes, vendido: 0, cobrado: 0, pendiente: 0 }))
    return t
  }
  for (const { pedido, items, abonos } of pedidos) {
    const total = totalPedido(items)
    const venta = del(mesDe(pedido.fecha))
    venta.vendido += total
    venta.pendiente += total - totalAbonado(abonos)
    for (const abono of abonos) del(mesDe(abono.fecha)).cobrado += abono.valor
  }
  return [...meses.values()].sort((a, b) => b.mes.localeCompare(a.mes))
}

export function reporteDelMes(pedidos: readonly PedidoDetallado[], mes: string): TotalesMes {
  return reportePorMes(pedidos).find((t) => t.mes === mes) ?? { mes, vendido: 0, cobrado: 0, pendiente: 0 }
}

export interface SaldoCliente {
  clienteId: Id
  saldo: number
}

/** Clientes con saldo, del mayor al menor. */
export function mayoresSaldos(pedidos: readonly PedidoDetallado[], limite = Infinity): SaldoCliente[] {
  return [...agrupar(pedidos, (d) => d.pedido.clienteId)]
    .map(([clienteId, t]) => ({ clienteId, saldo: t.pendiente }))
    .filter((c) => c.saldo > 0)
    .sort((a, b) => b.saldo - a.saldo)
    .slice(0, limite)
}

/** Pedidos con saldo, del más reciente al más antiguo. */
export function pendientesRecientes<T extends PedidoDetallado>(pedidos: readonly T[], limite = Infinity): T[] {
  return pedidos
    .filter((d) => totalPedido(d.items) - totalAbonado(d.abonos) > 0)
    .sort((a, b) => b.pedido.fecha.localeCompare(a.pedido.fecha) || b.pedido.numero - a.pedido.numero)
    .slice(0, limite)
}
