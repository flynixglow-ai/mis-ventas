import { totalAbonado, totalPedido } from '../../dominio/calculos'
import {
  validarAbono,
  validarPedidoEditado,
  validarPedidoNuevo,
  type BorradorItem,
  type ContextoPedido,
} from '../../dominio/validaciones'
import type { Abono, Id, Item, MetodoPago, Pedido } from '../../dominio/tipos'
import { db, type BaseDatos } from '../db'
import { exigir, rechazar } from '../errores'
import { ahora, nuevoId, opcional } from '../ids'

export const CLAVE_ULTIMO_NUMERO = 'ultimoNumeroPedido'

export interface DatosPedido {
  clienteId: Id
  marcaId: Id
  campanaId: Id
  fecha: string
  fechaLimite?: string
  notas?: string
  items: readonly BorradorItem[]
}

export interface DatosAbono {
  valor: number
  fecha: string
  metodo: string
  nota?: string
}

function aItems(pedidoId: Id, items: readonly BorradorItem[]): Item[] {
  return items.map((i, orden) => ({
    id: nuevoId(),
    pedidoId,
    orden,
    nombre: i.nombre.trim(),
    cantidad: i.cantidad,
    valorUnitario: i.valorUnitario,
  }))
}

function aAbono(pedidoId: Id, datos: DatosAbono): Abono {
  return {
    id: nuevoId(),
    pedidoId,
    valor: datos.valor,
    fecha: datos.fecha,
    metodo: datos.metodo as MetodoPago,
    nota: opcional(datos.nota),
    creadoEn: ahora(),
  }
}

/** Un campo opcional vacío en el formulario ("") equivale a no tenerlo. */
const normalizar = (datos: DatosPedido): DatosPedido => ({ ...datos, fechaLimite: opcional(datos.fechaLimite) })

async function contextoDe(bd: BaseDatos, datos: DatosPedido, incluirCliente: boolean): Promise<ContextoPedido> {
  const campana = datos.campanaId ? await bd.campanas.get(datos.campanaId) : undefined
  if (datos.campanaId && !campana) rechazar('La campaña seleccionada ya no existe.')
  const cliente = incluirCliente && datos.clienteId ? await bd.clientes.get(datos.clienteId) : undefined
  if (incluirCliente && datos.clienteId && !cliente) rechazar('El cliente seleccionado ya no existe.')
  return { campana, cliente }
}

/**
 * Crea el pedido con sus productos y, si lo hay, el abono inicial. Todo en una
 * transacción: o se guarda completo o no se guarda nada (ni se gasta el número).
 */
export function crearPedido(
  entrada: DatosPedido,
  abonoInicial: { valor: number; metodo: string } = { valor: 0, metodo: '' },
  bd = db,
): Promise<Pedido> {
  const datos = normalizar(entrada)
  return bd.transaction('rw', [bd.pedidos, bd.items, bd.abonos, bd.meta, bd.clientes, bd.campanas], async () => {
    exigir(validarPedidoNuevo(datos, abonoInicial, await contextoDe(bd, datos, true)))

    // Consecutivo global: solo sube, aunque después se eliminen pedidos.
    const ultimo = Number((await bd.meta.get(CLAVE_ULTIMO_NUMERO))?.valor ?? 0)
    const numero = ultimo + 1
    await bd.meta.put({ clave: CLAVE_ULTIMO_NUMERO, valor: numero })

    const pedido: Pedido = {
      id: nuevoId(),
      numero,
      clienteId: datos.clienteId,
      marcaId: datos.marcaId,
      campanaId: datos.campanaId,
      fecha: datos.fecha,
      fechaLimite: opcional(datos.fechaLimite),
      notas: datos.notas?.trim() ?? '',
      creadoEn: ahora(),
    }
    await bd.pedidos.add(pedido)
    await bd.items.bulkAdd(aItems(pedido.id, datos.items))
    if (abonoInicial.valor > 0) {
      await bd.abonos.add(aAbono(pedido.id, { ...abonoInicial, fecha: datos.fecha }))
    }
    return pedido
  })
}

/** Edita datos y productos. El total nunca puede quedar por debajo de lo abonado. */
export function editarPedido(id: Id, entrada: DatosPedido, bd = db): Promise<void> {
  const datos = normalizar(entrada)
  return bd.transaction('rw', [bd.pedidos, bd.items, bd.abonos, bd.clientes, bd.campanas], async () => {
    const actual = await bd.pedidos.get(id)
    if (!actual) rechazar('El pedido ya no existe.')
    const abonado = totalAbonado(await bd.abonos.where('pedidoId').equals(id).toArray())
    // Un pedido antiguo de un cliente archivado se puede corregir; lo que no
    // se puede es pasarle el pedido a otro cliente archivado.
    const contexto = await contextoDe(bd, datos, datos.clienteId !== actual.clienteId)
    exigir(validarPedidoEditado(datos, abonado, contexto))

    await bd.pedidos.put({
      ...actual,
      clienteId: datos.clienteId,
      marcaId: datos.marcaId,
      campanaId: datos.campanaId,
      fecha: datos.fecha,
      fechaLimite: opcional(datos.fechaLimite),
      notas: datos.notas?.trim() ?? '',
    })
    await bd.items.where('pedidoId').equals(id).delete()
    await bd.items.bulkAdd(aItems(id, datos.items))
  })
}

/** Elimina el pedido con sus productos y abonos. Su número no se reutiliza. */
export function eliminarPedido(id: Id, bd = db): Promise<void> {
  return bd.transaction('rw', [bd.pedidos, bd.items, bd.abonos], async () => {
    await bd.items.where('pedidoId').equals(id).delete()
    await bd.abonos.where('pedidoId').equals(id).delete()
    await bd.pedidos.delete(id)
  })
}

export function registrarAbono(pedidoId: Id, datos: DatosAbono, bd = db): Promise<Abono> {
  return bd.transaction('rw', [bd.pedidos, bd.items, bd.abonos], async () => {
    if (!(await bd.pedidos.get(pedidoId))) rechazar('El pedido ya no existe.')
    const saldo =
      totalPedido(await bd.items.where('pedidoId').equals(pedidoId).toArray()) -
      totalAbonado(await bd.abonos.where('pedidoId').equals(pedidoId).toArray())
    exigir(validarAbono(datos, saldo))
    const abono = aAbono(pedidoId, datos)
    await bd.abonos.add(abono)
    return abono
  })
}

export async function eliminarAbono(id: Id, bd = db): Promise<void> {
  await bd.abonos.delete(id)
}
