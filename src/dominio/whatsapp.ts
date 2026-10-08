import { totalAbonado, totalPedido } from './calculos'
import { formatearPesos } from './formato'
import type { Cliente, PedidoVista } from './tipos'

/**
 * Resumen de los pedidos con saldo de un cliente, agrupados por marca y
 * campaña. Devuelve null si el cliente no tiene saldo pendiente.
 * Vocabulario: pedido, abono, saldo pendiente. Nunca "deuda" ni "préstamo".
 */
export function mensajeResumenCliente(cliente: Pick<Cliente, 'nombre'>, pedidos: readonly PedidoVista[]): string | null {
  const bloques = new Map<string, { titulo: string; total: number; pagado: number }>()
  const enOrden = [...pedidos].sort(
    (a, b) => a.pedido.fecha.localeCompare(b.pedido.fecha) || a.pedido.numero - b.pedido.numero,
  )
  for (const vista of enOrden) {
    const total = totalPedido(vista.items)
    const pagado = totalAbonado(vista.abonos)
    if (total - pagado <= 0) continue
    let bloque = bloques.get(vista.campana.id)
    if (!bloque) {
      bloque = { titulo: `${vista.marca.nombre} — ${vista.campana.nombre}`, total: 0, pagado: 0 }
      bloques.set(vista.campana.id, bloque)
    }
    bloque.total += total
    bloque.pagado += pagado
  }
  if (bloques.size === 0) return null

  const lista = [...bloques.values()]
  const pendiente = lista.reduce((suma, b) => suma + b.total - b.pagado, 0)
  const nombre = cliente.nombre.trim().split(/\s+/)[0]
  return [
    `Hola ${nombre}, te comparto el resumen de tus pedidos pendientes:`,
    ...lista.map((b) =>
      [
        b.titulo,
        `Total: ${formatearPesos(b.total)}`,
        `Pagado: ${formatearPesos(b.pagado)}`,
        `Pendiente: ${formatearPesos(b.total - b.pagado)}`,
      ].join('\n'),
    ),
    `Total pendiente:\n${formatearPesos(pendiente)}`,
  ].join('\n\n')
}

/**
 * Enlace que abre WhatsApp con el mensaje escrito. Si el teléfono no trae
 * indicativo de país se le agrega; sin teléfono, WhatsApp deja elegir el contacto.
 */
export function enlaceWhatsApp(telefono: string, mensaje: string, indicativo = '57'): string {
  const texto = `text=${encodeURIComponent(mensaje)}`
  const tieneIndicativo = telefono.trim().startsWith('+')
  const digitos = telefono.replace(/\D/g, '')
  if (!digitos) return `https://wa.me/?${texto}`
  return `https://wa.me/${tieneIndicativo ? digitos : indicativo + digitos}?${texto}`
}
