import { validarCliente } from '../../dominio/validaciones'
import type { Cliente, EstadoCliente, Id } from '../../dominio/tipos'
import { db } from '../db'
import { exigir, rechazar } from '../errores'
import { ahora, nuevoId } from '../ids'

export interface DatosCliente {
  nombre: string
  telefono: string
  notas: string
}

const limpiar = (d: DatosCliente): DatosCliente => ({
  nombre: d.nombre.trim().replace(/\s+/g, ' '),
  telefono: d.telefono.trim(),
  notas: d.notas.trim(),
})

export async function crearCliente(datos: DatosCliente, bd = db): Promise<Cliente> {
  exigir(validarCliente(datos))
  const cliente: Cliente = { id: nuevoId(), ...limpiar(datos), estado: 'activo', creadoEn: ahora() }
  await bd.clientes.add(cliente)
  return cliente
}

export async function editarCliente(id: Id, datos: DatosCliente, bd = db): Promise<void> {
  exigir(validarCliente(datos))
  await bd.clientes.update(id, limpiar(datos))
}

/** Archivar conserva todos los pedidos y abonos del cliente. */
export async function cambiarEstadoCliente(id: Id, estado: EstadoCliente, bd = db): Promise<void> {
  await bd.clientes.update(id, { estado })
}

/** Solo se elimina un cliente sin pedidos; con pedidos se archiva. */
export function eliminarCliente(id: Id, bd = db): Promise<void> {
  return bd.transaction('rw', bd.clientes, bd.pedidos, async () => {
    if ((await bd.pedidos.where('clienteId').equals(id).count()) > 0) {
      rechazar('Este cliente tiene pedidos y no se puede eliminar. Puedes archivarlo.')
    }
    await bd.clientes.delete(id)
  })
}
