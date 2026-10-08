import type { Abono, Id, Item, PedidoVista } from '../../dominio/tipos'
import { db } from '../db'

const porOrden = (a: Item, b: Item) => a.orden - b.orden

function agruparPorPedido<T extends { pedidoId: Id }>(filas: T[]): Map<Id, T[]> {
  const mapa = new Map<Id, T[]>()
  for (const fila of filas) {
    const grupo = mapa.get(fila.pedidoId)
    if (grupo) grupo.push(fila)
    else mapa.set(fila.pedidoId, [fila])
  }
  return mapa
}

/**
 * Todos los pedidos con sus productos, abonos, cliente, marca y campaña.
 * Es la entrada de los cálculos del dominio (totales, filtros, historial).
 * Para el volumen de un negocio personal, cargar todo es rápido y simple.
 */
export async function cargarVistas(bd = db): Promise<PedidoVista[]> {
  const [pedidos, items, abonos, clientes, marcas, campanas] = await Promise.all([
    bd.pedidos.toArray(),
    bd.items.toArray(),
    bd.abonos.toArray(),
    bd.clientes.toArray(),
    bd.marcas.toArray(),
    bd.campanas.toArray(),
  ])
  const itemsDe = agruparPorPedido<Item>(items.sort(porOrden))
  const abonosDe = agruparPorPedido<Abono>(abonos)
  const porId = <T extends { id: Id }>(filas: T[]) => new Map(filas.map((f) => [f.id, f]))
  const cliente = porId(clientes)
  const marca = porId(marcas)
  const campana = porId(campanas)

  const vistas: PedidoVista[] = []
  for (const pedido of pedidos) {
    const c = cliente.get(pedido.clienteId)
    const m = marca.get(pedido.marcaId)
    const k = campana.get(pedido.campanaId)
    // Las reglas de eliminación impiden referencias rotas; si aun así hubiera
    // una, se omite el pedido en lugar de romper toda la pantalla.
    if (!c || !m || !k) continue
    vistas.push({
      pedido,
      items: itemsDe.get(pedido.id) ?? [],
      abonos: abonosDe.get(pedido.id) ?? [],
      cliente: c,
      marca: m,
      campana: k,
    })
  }
  return vistas
}

export async function cargarVista(id: Id, bd = db): Promise<PedidoVista | undefined> {
  const pedido = await bd.pedidos.get(id)
  if (!pedido) return undefined
  const [items, abonos, cliente, marca, campana] = await Promise.all([
    bd.items.where('pedidoId').equals(id).toArray(),
    bd.abonos.where('pedidoId').equals(id).toArray(),
    bd.clientes.get(pedido.clienteId),
    bd.marcas.get(pedido.marcaId),
    bd.campanas.get(pedido.campanaId),
  ])
  if (!cliente || !marca || !campana) return undefined
  return { pedido, items: items.sort(porOrden), abonos, cliente, marca, campana }
}
