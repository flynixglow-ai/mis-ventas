import { resumirPedido } from './calculos'
import { formatearNumeroPedido, normalizar } from './formato'
import type { Fecha, Id, PedidoVista } from './tipos'

export type FiltroEstado = 'todas' | 'pendientes' | 'parcial' | 'vencidas' | 'pagadas'

export const ETIQUETA_FILTRO: Record<FiltroEstado, string> = {
  todas: 'Todas',
  pendientes: 'Pendientes',
  parcial: 'Pago parcial',
  vencidas: 'Vencidas',
  pagadas: 'Pagadas',
}

export interface FiltrosPedidos {
  estado?: FiltroEstado
  marcaId?: Id
  campanaId?: Id
  clienteId?: Id
  /** Fecha de venta, ambos extremos incluidos. */
  desde?: Fecha
  hasta?: Fecha
  texto?: string
}

function coincideEstado(vista: PedidoVista, estado: FiltroEstado, hoy: Fecha): boolean {
  if (estado === 'todas') return true
  const r = resumirPedido(vista, hoy)
  if (estado === 'vencidas') return r.vencido
  if (estado === 'pendientes') return r.estado === 'pendiente'
  if (estado === 'parcial') return r.estado === 'parcial'
  return r.estado === 'pagado'
}

/**
 * Busca por cliente, producto, marca, campaña o número de pedido.
 * Todas las palabras deben aparecer. "#25" y "#0025" buscan ese número exacto.
 */
export function coincideTexto(vista: PedidoVista, texto: string): boolean {
  const palabras = normalizar(texto).split(' ').filter(Boolean)
  if (palabras.length === 0) return true
  const contenido = normalizar(
    [
      vista.cliente.nombre,
      vista.marca.nombre,
      vista.campana.nombre,
      formatearNumeroPedido(vista.pedido.numero),
      ...vista.items.map((i) => i.nombre),
    ].join(' '),
  )
  return palabras.every((palabra) =>
    /^#\d+$/.test(palabra) ? Number(palabra.slice(1)) === vista.pedido.numero : contenido.includes(palabra),
  )
}

/** Devuelve los pedidos que cumplen todos los filtros, del más reciente al más antiguo. */
export function filtrarPedidos(pedidos: readonly PedidoVista[], filtros: FiltrosPedidos, hoy: Fecha): PedidoVista[] {
  const { estado = 'todas', marcaId, campanaId, clienteId, desde, hasta, texto = '' } = filtros
  return pedidos
    .filter(
      (v) =>
        (!marcaId || v.pedido.marcaId === marcaId) &&
        (!campanaId || v.pedido.campanaId === campanaId) &&
        (!clienteId || v.pedido.clienteId === clienteId) &&
        (!desde || v.pedido.fecha >= desde) &&
        (!hasta || v.pedido.fecha <= hasta) &&
        coincideEstado(v, estado, hoy) &&
        coincideTexto(v, texto),
    )
    .sort((a, b) => b.pedido.fecha.localeCompare(a.pedido.fecha) || b.pedido.numero - a.pedido.numero)
}

/** Búsqueda de clientes por nombre o teléfono. */
export function coincideCliente(cliente: { nombre: string; telefono: string }, texto: string): boolean {
  const palabras = normalizar(texto).split(' ').filter(Boolean)
  const contenido = normalizar(`${cliente.nombre} ${cliente.telefono}`)
  return palabras.every((p) => contenido.includes(p))
}
