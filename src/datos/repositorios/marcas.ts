import { validarMarca } from '../../dominio/validaciones'
import type { Id, Marca } from '../../dominio/tipos'
import { db } from '../db'
import { exigir, rechazar } from '../errores'
import { ahora, nuevoId } from '../ids'

export function crearMarca(datos: { nombre: string }, bd = db): Promise<Marca> {
  return bd.transaction('rw', bd.marcas, async () => {
    exigir(validarMarca(datos, await bd.marcas.toArray()))
    const marca: Marca = { id: nuevoId(), nombre: datos.nombre.trim(), activa: true, creadaEn: ahora() }
    await bd.marcas.add(marca)
    return marca
  })
}

export function editarMarca(id: Id, datos: { nombre: string; activa: boolean }, bd = db): Promise<void> {
  return bd.transaction('rw', bd.marcas, async () => {
    exigir(validarMarca(datos, await bd.marcas.toArray(), id))
    await bd.marcas.update(id, { nombre: datos.nombre.trim(), activa: datos.activa })
  })
}

/** Una marca con pedidos no se elimina (se desactiva). Sin pedidos, se va con sus campañas. */
export function eliminarMarca(id: Id, bd = db): Promise<void> {
  return bd.transaction('rw', bd.marcas, bd.campanas, bd.pedidos, async () => {
    if ((await bd.pedidos.where('marcaId').equals(id).count()) > 0) {
      rechazar('Esta marca tiene pedidos y no se puede eliminar. Puedes desactivarla.')
    }
    await bd.campanas.where('marcaId').equals(id).delete()
    await bd.marcas.delete(id)
  })
}
